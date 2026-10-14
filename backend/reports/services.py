from django.db import transaction
from django.utils import timezone

from incidents.models import Incident
from incidents.services import trouver_incident_proche
from users.models import ProfilUtilisateur

from .models import Signalement, Confirmation
SEUIL_CONFIRMATION = 70.0
MIN_PARTICIPANTS = 3
SEUIL_RETABLISSEMENT_PROBABLE = 40.0
SEUIL_RETABLI = 10.0
BONUS_SIGNALEMENT_VALIDE = 1.0
BONUS_CONFIRMATION_CORRECTE = 2.0
MALUS_CONFIRMATION_INCORRECTE = 2.0


@transaction.atomic
def creer_signalement(
    utilisateur,
    zone,
    latitude,
    longitude,
    heure_debut_estimee=None,
    commentaire=""
):
    """
    Crée un signalement et décide automatiquement s'il doit
    rejoindre un incident existant ou créer un nouvel incident.
    """

    date_reference = heure_debut_estimee or timezone.now()

    # 1. Chercher un incident compatible à moins de 300 m / 2 h
    incident = trouver_incident_proche(
        latitude=latitude,
        longitude=longitude,
        date_reference=date_reference,
    )

    nouvel_incident = False

    # 2. Aucun incident compatible : création d'un nouvel incident
    if incident is None:
        incident = Incident.objects.create(
            zone=zone,
            latitude=latitude,
            longitude=longitude,
            date_debut=date_reference,
            statut=Incident.Statut.A_CONFIRMER,
            score_confiance=0,
        )

        nouvel_incident = True

    # 3. Créer le signalement et le rattacher à l'incident
    signalement = Signalement.objects.create(
        utilisateur=utilisateur,
        incident=incident,
        latitude=latitude,
        longitude=longitude,
        heure_debut_estimee=heure_debut_estimee,
        commentaire=commentaire,
    )
    profil = utilisateur.profil
    profil.nombre_participations += 1
    profil.save(
        update_fields=["nombre_participations"]
    )

    return signalement, incident, nouvel_incident

def calculer_score_confiance(incident):
    """
    Calcule le score de confiance d'un incident
    à partir des participations des habitants.
    """

    participations = {}

    # Les signalements comptent comme avis positifs
    for signalement in incident.signalements.select_related(
        "utilisateur__profil"
    ):
        utilisateur = signalement.utilisateur

        if utilisateur.id not in participations:
            participations[utilisateur.id] = {
                "type": "positif",
                "score": utilisateur.profil.score_fiabilite,
            }

        # Ajouter les confirmations / infirmations
    for confirmation in incident.confirmations.select_related(
        "utilisateur__profil"
    ):
        utilisateur = confirmation.utilisateur

        if (
            confirmation.type_reponse
            == Confirmation.TypeReponse.COUPURE_CONFIRMEE
        ):
            type_participation = "positif"
        else:
            type_participation = "negatif"

        participations[utilisateur.id] = {
            "type": type_participation,
            "score": utilisateur.profil.score_fiabilite,
        }

    score_positif = sum(
        participation["score"]
        for participation in participations.values()
        if participation["type"] == "positif"
    )

    score_negatif = sum(
        participation["score"]
        for participation in participations.values()
        if participation["type"] == "negatif"
    )

    total = score_positif + score_negatif

    if total == 0:
        return 0.0, 0

    score_confiance = (score_positif / total) * 100

    return round(score_confiance, 2), len(participations)
def mettre_a_jour_confiance_incident(incident):
    """
    Recalcule le score de confiance et met à jour
    le statut de l'incident.
    """

    score_confiance, nombre_participants = (
        calculer_score_confiance(incident)
    )

    incident.score_confiance = score_confiance

    # 1. La coupure devient confirmée
    if (
        incident.statut == Incident.Statut.A_CONFIRMER
        and nombre_participants >= MIN_PARTICIPANTS
        and score_confiance >= SEUIL_CONFIRMATION
    ):
        incident.statut = Incident.Statut.ACTIF

    # 2. Plusieurs habitants commencent à avoir de l'eau
    elif (
        incident.statut == Incident.Statut.ACTIF
        and nombre_participants >= MIN_PARTICIPANTS
        and score_confiance <= SEUIL_RETABLISSEMENT_PROBABLE
    ):
        incident.statut = Incident.Statut.RETABLISSEMENT_PROBABLE

    # 3. Le retour de l'eau est suffisamment confirmé
    elif (
        incident.statut == Incident.Statut.RETABLISSEMENT_PROBABLE
        and nombre_participants >= MIN_PARTICIPANTS
        and score_confiance <= SEUIL_RETABLI
    ):
        incident.statut = Incident.Statut.RETABLI
        incident.date_fin = timezone.now()

    # 4. Si l'eau recoupe pendant la phase probable
    elif (
        incident.statut == Incident.Statut.RETABLISSEMENT_PROBABLE
        and score_confiance >= SEUIL_CONFIRMATION
    ):
        incident.statut = Incident.Statut.ACTIF

    incident.save(
    update_fields=[
        "score_confiance",
        "statut",
        "date_fin",
        "date_modification",
    ]
)

    if incident.statut == Incident.Statut.RETABLI:
      mettre_a_jour_scores_fiabilite(incident)

    return incident

    
@transaction.atomic
def mettre_a_jour_scores_fiabilite(incident):
    """
    Met à jour une seule fois la fiabilité des habitants
    lorsque l'incident est définitivement rétabli.
    """

    if incident.statut != Incident.Statut.RETABLI:
        return

    if incident.fiabilite_traitee:
        return

    utilisateurs_signalement = set(
        incident.signalements.values_list(
            "utilisateur_id",
            flat=True
        )
    )

    confirmations = {
        confirmation.utilisateur_id: confirmation
        for confirmation in incident.confirmations.all()
    }

    utilisateurs = (
        utilisateurs_signalement
        | set(confirmations.keys())
    )

    for utilisateur_id in utilisateurs:
        profil = ProfilUtilisateur.objects.get(
            utilisateur_id=utilisateur_id
        )

        confirmation = confirmations.get(utilisateur_id)

        if confirmation:
            if (
                confirmation.type_reponse
                == Confirmation.TypeReponse.EAU_DISPONIBLE
            ):
                variation = BONUS_CONFIRMATION_CORRECTE
            else:
                variation = -MALUS_CONFIRMATION_INCORRECTE

        else:
            variation = BONUS_SIGNALEMENT_VALIDE

        nouveau_score = (
            profil.score_fiabilite + variation
        )

        profil.score_fiabilite = max(
            0.0,
            min(100.0, nouveau_score)
        )

        profil.save(
            update_fields=["score_fiabilite"]
        )

    incident.fiabilite_traitee = True
    incident.save(
        update_fields=["fiabilite_traitee"]
    )
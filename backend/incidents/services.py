from datetime import timedelta
from math import radians, sin, cos, sqrt, atan2

from django.utils import timezone

from .models import Incident


RAYON_MAX_METRES = 300
FENETRE_TEMPORELLE_HEURES = 2


def calculer_distance_metres(lat1, lon1, lat2, lon2):
    """
    Calcule la distance entre deux coordonnées GPS
    avec la formule de Haversine.
    """
    rayon_terre = 6371000

    lat1 = radians(float(lat1))
    lon1 = radians(float(lon1))
    lat2 = radians(float(lat2))
    lon2 = radians(float(lon2))

    difference_lat = lat2 - lat1
    difference_lon = lon2 - lon1

    a = (
        sin(difference_lat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(difference_lon / 2) ** 2
    )

    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return rayon_terre * c


def trouver_incident_proche(latitude, longitude, date_reference=None):
    """
    Cherche l'incident actif le plus proche dans une fenêtre
    de 2 heures et un rayon maximal de 300 mètres.
    """

    if date_reference is None:
        date_reference = timezone.now()

    date_minimum = (
        date_reference
        - timedelta(hours=FENETRE_TEMPORELLE_HEURES)
    )

    incidents = Incident.objects.filter(
        statut__in=[
            Incident.Statut.A_CONFIRMER,
            Incident.Statut.ACTIF,
        ],
        date_debut__gte=date_minimum,
        date_debut__lte=date_reference,
    )

    meilleur_incident = None
    meilleure_distance = None

    for incident in incidents:
        distance = calculer_distance_metres(
            latitude,
            longitude,
            incident.latitude,
            incident.longitude,
        )

        if distance <= RAYON_MAX_METRES:
            if (
                meilleure_distance is None
                or distance < meilleure_distance
            ):
                meilleur_incident = incident
                meilleure_distance = distance

    return meilleur_incident
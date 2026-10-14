from rest_framework import serializers

from zones.models import Zone
from .models import Confirmation
from .services import (
    creer_signalement,
    mettre_a_jour_confiance_incident,
)
from incidents.services import (
    calculer_distance_metres,
    RAYON_MAX_METRES,
)


class SignalementCreateSerializer(serializers.Serializer):
    zone_id = serializers.PrimaryKeyRelatedField(
        queryset=Zone.objects.filter(actif=True),
        source="zone"
    )

    latitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    longitude = serializers.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    heure_debut_estimee = serializers.DateTimeField(
        required=False,
        allow_null=True
    )

    commentaire = serializers.CharField(
        required=False,
        allow_blank=True,
        default=""
    )

    def create(self, validated_data):
        utilisateur = self.context["request"].user

        signalement, incident, nouvel_incident = creer_signalement(
            utilisateur=utilisateur,
            zone=validated_data["zone"],
            latitude=validated_data["latitude"],
            longitude=validated_data["longitude"],
            heure_debut_estimee=validated_data.get(
                "heure_debut_estimee"
            ),
            commentaire=validated_data.get("commentaire", "")
        )

        signalement._incident_resultat = incident
        signalement._nouvel_incident = nouvel_incident

        return signalement


class ConfirmationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Confirmation
        fields = [
            "id",
            "incident",
            "type_reponse",
            "latitude",
            "longitude",
            "date_confirmation",
        ]

        read_only_fields = [
            "id",
            "date_confirmation",
        ]

    def validate(self, attrs):
        incident = attrs["incident"]
        latitude = attrs.get("latitude")
        longitude = attrs.get("longitude")

        if latitude is None or longitude is None:
            raise serializers.ValidationError(
                {
                    "gps": (
                        "La position GPS est obligatoire "
                        "pour confirmer un incident."
                    )
                }
            )

        distance = calculer_distance_metres(
            latitude,
            longitude,
            incident.latitude,
            incident.longitude,
        )

        if distance > RAYON_MAX_METRES:
            raise serializers.ValidationError(
                {
                    "gps": (
                        f"Vous êtes à environ {round(distance)} m "
                        f"de l'incident. La distance maximale "
                        f"autorisée est de {RAYON_MAX_METRES} m."
                    )
                }
            )

        return attrs

    def create(self, validated_data):
        utilisateur = self.context["request"].user
        incident = validated_data.pop("incident")

        confirmation, created = Confirmation.objects.update_or_create(
            utilisateur=utilisateur,
            incident=incident,
            defaults=validated_data
        )

        if created:
            deja_signale = utilisateur.signalements.filter(
                incident=incident
            ).exists()

            if not deja_signale:
                profil = utilisateur.profil
                profil.nombre_participations += 1
                profil.save(
                    update_fields=["nombre_participations"]
                )

        mettre_a_jour_confiance_incident(incident)

        return confirmation
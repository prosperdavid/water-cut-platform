from rest_framework import serializers

from .models import Incident


class IncidentSerializer(serializers.ModelSerializer):
    zone_nom = serializers.CharField(
        source="zone.nom",
        read_only=True
    )

    nombre_signalements = serializers.SerializerMethodField()
    nombre_confirmations = serializers.SerializerMethodField()

    class Meta:
        model = Incident

        fields = [
            "id",
            "zone",
            "zone_nom",
            "latitude",
            "longitude",
            "date_debut",
            "date_fin",
            "statut",
            "score_confiance",
            "nombre_signalements",
            "nombre_confirmations",
            "date_creation",
            "date_modification",
        ]

        read_only_fields = fields

    def get_nombre_signalements(self, obj):
        return obj.signalements.count()

    def get_nombre_confirmations(self, obj):
        return obj.confirmations.count()
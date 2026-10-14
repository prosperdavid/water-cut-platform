from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated

from .models import Incident
from .serializers import IncidentSerializer
from rest_framework.exceptions import ValidationError
from .services import calculer_distance_metres


class IncidentListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentSerializer

    def get_queryset(self):
     queryset = Incident.objects.select_related(
        "zone"
    ).prefetch_related(
        "signalements",
        "confirmations"
    ).order_by("-date_creation")

    # Filtre par statut
     statut = self.request.query_params.get("statut")

     if statut:
       queryset = queryset.filter(statut=statut)

    # Filtre par zone
     zone_id = self.request.query_params.get("zone")

     if zone_id:
        queryset = queryset.filter(zone_id=zone_id)

    # Filtre GPS
     latitude = self.request.query_params.get("latitude")
     longitude = self.request.query_params.get("longitude")
     rayon = self.request.query_params.get("rayon", "300")

     if latitude is not None or longitude is not None:
        if latitude is None or longitude is None:
            raise ValidationError(
                {
                    "gps": (
                        "Latitude et longitude doivent "
                        "être fournies ensemble."
                    )
                }
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)
            rayon = float(rayon)
        except ValueError:
            raise ValidationError(
                {
                    "gps": "Coordonnées GPS ou rayon invalides."
                }
            )

        if rayon <= 0:
            raise ValidationError(
                {
                    "rayon": "Le rayon doit être supérieur à 0."
                }
            )

        incidents_proches = []

        for incident in queryset:
            distance = calculer_distance_metres(
                latitude,
                longitude,
                incident.latitude,
                incident.longitude,
            )

            if distance <= rayon:
                incidents_proches.append(incident.id)

        queryset = queryset.filter(
            id__in=incidents_proches
        )

     return queryset


class IncidentDetailAPIView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = IncidentSerializer

    queryset = Incident.objects.select_related(
        "zone"
    ).prefetch_related(
        "signalements",
        "confirmations"
    )
from django.db.models import Q

from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated

from incidents.models import Incident

from .models import ProfilUtilisateur

from .serializers import (
    InscriptionSerializer,
    ProfilUtilisateurSerializer,
    HistoriqueIncidentSerializer,
)


class InscriptionAPIView(generics.CreateAPIView):
    serializer_class = InscriptionSerializer
    permission_classes = [AllowAny]


class ProfilUtilisateurAPIView(generics.RetrieveAPIView):
    serializer_class = ProfilUtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Les comptes Django créés via createsuperuser peuvent ne pas avoir
        # de profil Coupure : le créer à la première consultation de l'API.
        profil, _ = ProfilUtilisateur.objects.get_or_create(
            utilisateur=self.request.user
        )
        return profil


class HistoriqueUtilisateurAPIView(generics.ListAPIView):
    serializer_class = HistoriqueIncidentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        utilisateur = self.request.user

        return (
            Incident.objects.filter(
                Q(signalements__utilisateur=utilisateur)
                | Q(confirmations__utilisateur=utilisateur)
            )
            .select_related("zone")
            .distinct()
            .order_by("-date_debut")
        )
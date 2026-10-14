from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    SignalementCreateSerializer,
    ConfirmationSerializer,
)


class SignalementCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SignalementCreateSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        signalement = serializer.save()

        incident = signalement._incident_resultat
        nouvel_incident = signalement._nouvel_incident

        return Response(
            {
                "message": "Signalement enregistré avec succès.",
                "signalement_id": signalement.id,
                "incident_id": incident.id,
                "nouvel_incident": nouvel_incident,
                "statut_incident": incident.statut,
            },
            status=status.HTTP_201_CREATED
        )


class ConfirmationCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConfirmationSerializer(
            data=request.data,
            context={"request": request}
        )

        serializer.is_valid(raise_exception=True)
        confirmation = serializer.save()

        return Response(
            {
                "message": "Confirmation enregistrée avec succès.",
                "confirmation_id": confirmation.id,
                "incident_id": confirmation.incident_id,
                "type_reponse": confirmation.type_reponse,
            },
            status=status.HTTP_201_CREATED
        )
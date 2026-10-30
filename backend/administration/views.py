"""API de modération de Coupure, réservée aux comptes Django is_staff."""
from django.contrib.admin.models import CHANGE, LogEntry
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from incidents.models import Incident
from incidents.serializers import IncidentSerializer
from zones.models import Zone

User = get_user_model()


def tracer_action(request, objet, message):
    """Journaliser les changements dans le journal standard de Django Admin."""
    LogEntry.objects.create(
        user_id=request.user.pk,
        content_type=ContentType.objects.get_for_model(objet),
        object_id=str(objet.pk),
        object_repr=str(objet)[:200],
        action_flag=CHANGE,
        change_message=message,
    )


class AdminMeAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response({
            "id": request.user.pk,
            "username": request.user.username,
            "is_staff": True,
        })


class TableauBordAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        comptes_par_statut = dict(
            Incident.objects.values("statut")
            .annotate(total=Count("pk"))
            .values_list("statut", "total")
        )
        recents = (
            Incident.objects.select_related("zone")
            .prefetch_related("signalements", "confirmations")
            .order_by("-date_creation")[:6]
        )
        return Response({
            "nombre_utilisateurs": User.objects.filter(is_staff=False).count(),
            "nombre_zones": Zone.objects.count(),
            "nombre_incidents": Incident.objects.count(),
            "incidents_par_statut": {
                code: comptes_par_statut.get(code, 0)
                for code, _ in Incident.Statut.choices
            },
            "incidents_recents": IncidentSerializer(recents, many=True).data,
        })


class ListeIncidentsAdminAPIView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = IncidentSerializer
    pagination_class = None

    def get_queryset(self):
        qs = (
            Incident.objects.select_related("zone")
            .prefetch_related("signalements", "confirmations")
            .order_by("-date_creation")
        )
        statut = self.request.query_params.get("statut", "")
        if statut:
            if statut not in Incident.Statut.values:
                raise ValidationError({"statut": "Statut invalide."})
            qs = qs.filter(statut=statut)
        return qs[:100]


class ModererIncidentAPIView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def patch(self, request, pk):
        incident = get_object_or_404(Incident.objects.select_for_update(), pk=pk)
        if set(request.data.keys()) != {"action"}:
            raise ValidationError({"action": "Envoyez uniquement l'action de modération."})
        action = request.data.get("action")
        if action == "rejeter":
            if incident.statut not in (
                Incident.Statut.A_CONFIRMER,
                Incident.Statut.ACTIF,
                Incident.Statut.RETABLISSEMENT_PROBABLE,
            ):
                raise ValidationError({"action": "Cet incident ne peut pas être rejeté."})
            nouveau_statut = Incident.Statut.REJETE
        elif action == "rouvrir":
            if incident.statut != Incident.Statut.REJETE:
                raise ValidationError({"action": "Seul un incident rejeté peut être rouvert."})
            nouveau_statut = Incident.Statut.A_CONFIRMER
        else:
            raise ValidationError({"action": "Action attendue : rejeter ou rouvrir."})

        ancien_statut = incident.statut
        incident.statut = nouveau_statut
        incident.save(update_fields=["statut", "date_modification"])
        tracer_action(request, incident, "Modération : %s → %s" % (ancien_statut, nouveau_statut))
        incident = (
            Incident.objects.select_related("zone")
            .prefetch_related("signalements", "confirmations")
            .get(pk=incident.pk)
        )
        return Response(IncidentSerializer(incident).data)


class ListeUtilisateursAdminAPIView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        comptes = User.objects.filter(is_staff=False).order_by("-date_joined")[:100]
        return Response([{
            "id": compte.pk,
            "username": compte.username,
            "first_name": compte.first_name,
            "last_name": compte.last_name,
            "is_active": compte.is_active,
            "date_joined": compte.date_joined,
        } for compte in comptes])


class ModifierUtilisateurAPIView(APIView):
    permission_classes = [IsAdminUser]

    @transaction.atomic
    def patch(self, request, pk):
        compte = get_object_or_404(User.objects.select_for_update(), pk=pk)
        if compte.is_staff or compte.is_superuser or compte.pk == request.user.pk:
            return Response(
                {"detail": "Ce compte administrateur ne peut pas être modifié ici."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if (set(request.data.keys()) != {"is_active"}
                or type(request.data.get("is_active")) is not bool):
            raise ValidationError({"is_active": "Valeur booléenne obligatoire."})
        if compte.is_active != request.data["is_active"]:
            compte.is_active = request.data["is_active"]
            compte.save(update_fields=["is_active"])
            tracer_action(request, compte, "Réactivation" if compte.is_active else "Désactivation")
        return Response({
            "id": compte.pk,
            "username": compte.username,
            "is_active": compte.is_active,
        })

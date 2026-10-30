from django.urls import path
from .views import (
    AdminMeAPIView,
    TableauBordAPIView,
    ListeIncidentsAdminAPIView,
    ModererIncidentAPIView,
    ListeUtilisateursAdminAPIView,
    ModifierUtilisateurAPIView,
)

urlpatterns = [
    path("me/", AdminMeAPIView.as_view(), name="administration-me"),
    path("tableau-bord/", TableauBordAPIView.as_view(), name="administration-tableau-bord"),
    path("incidents/", ListeIncidentsAdminAPIView.as_view(), name="administration-incidents"),
    path("incidents/<int:pk>/", ModererIncidentAPIView.as_view(), name="administration-moderer-incident"),
    path("utilisateurs/", ListeUtilisateursAdminAPIView.as_view(), name="administration-utilisateurs"),
    path("utilisateurs/<int:pk>/", ModifierUtilisateurAPIView.as_view(), name="administration-modifier-utilisateur"),
]

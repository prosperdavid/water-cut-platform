from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    InscriptionAPIView,
    ProfilUtilisateurAPIView,
    HistoriqueUtilisateurAPIView,
)


urlpatterns = [
    path(
        "register/",
        InscriptionAPIView.as_view(),
        name="register"
    ),

    path(
        "login/",
        TokenObtainPairView.as_view(),
        name="login"
    ),

    path(
        "token/refresh/",
        TokenRefreshView.as_view(),
        name="token-refresh"
    ),

    path(
        "me/",
        ProfilUtilisateurAPIView.as_view(),
        name="profil-utilisateur"
    ),

    path(
        "history/",
        HistoriqueUtilisateurAPIView.as_view(),
        name="historique-utilisateur"
    ),
]
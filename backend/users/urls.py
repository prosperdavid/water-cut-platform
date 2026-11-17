from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

from .views import (
    InscriptionAPIView,
    GoogleLoginAPIView,
    ProfilUtilisateurAPIView,
    HistoriqueUtilisateurAPIView,
)
from .serializers import EmailOrUsernameTokenObtainPairSerializer


urlpatterns = [
    path(
        "register/",
        InscriptionAPIView.as_view(),
        name="register"
    ),

    path(
        "login/",
        TokenObtainPairView.as_view(
            serializer_class=EmailOrUsernameTokenObtainPairSerializer
        ),
        name="login"
    ),

    path(
        "google/",
        GoogleLoginAPIView.as_view(),
        name="google-login"
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

import secrets

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Q
from django.utils.text import slugify

from rest_framework import generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from incidents.models import Incident

from .models import ProfilUtilisateur

from .serializers import (
    InscriptionSerializer,
    GoogleCredentialSerializer,
    ProfilUtilisateurSerializer,
    HistoriqueIncidentSerializer,
)

User = get_user_model()


class GoogleLoginError(Exception):
    def __init__(self, detail, status_code):
        self.detail = detail
        self.status_code = status_code


def _username_for_google_email(email):
    base = slugify(email.split("@", 1)[0])[:120] or "google-user"
    username = base
    suffix = 1
    while User.objects.filter(username=username).exists():
        ending = f"-{suffix}"
        username = f"{base[:150 - len(ending)]}{ending}"
        suffix += 1
    return username


@transaction.atomic
def _get_or_create_google_user(claims):
    google_sub = claims.get("sub")
    email = (claims.get("email") or "").strip().lower()
    email_verified = claims.get("email_verified") is True

    if not google_sub or not email or not email_verified:
        raise GoogleLoginError(
            "Google n’a pas fourni une adresse courriel vérifiée.",
            401,
        )

    profile = (
        ProfilUtilisateur.objects.select_related("utilisateur")
        .filter(google_sub=google_sub)
        .first()
    )

    if profile:
        user = profile.utilisateur
    else:
        matching_users = list(
            User.objects.filter(email__iexact=email).order_by("pk")[:2]
        )
        if len(matching_users) > 1:
            raise GoogleLoginError(
                "Plusieurs comptes utilisent cette adresse. Contactez l’administration pour les lier.",
                409,
            )

        if matching_users:
            user = matching_users[0]
            profile, _ = ProfilUtilisateur.objects.get_or_create(
                utilisateur=user
            )
            if profile.google_sub and profile.google_sub != google_sub:
                raise GoogleLoginError(
                    "Ce compte est déjà lié à un autre compte Google.",
                    409,
                )
            profile.google_sub = google_sub
            profile.save(update_fields=["google_sub"])
        else:
            user = User.objects.create_user(
                username=_username_for_google_email(email),
                email=email,
                first_name=(claims.get("given_name") or "")[:150],
                last_name=(claims.get("family_name") or "")[:150],
                password=secrets.token_urlsafe(48),
            )
            profile = ProfilUtilisateur.objects.create(
                utilisateur=user,
                google_sub=google_sub,
            )

    if not user.is_active:
        raise GoogleLoginError(
            "Ce compte est désactivé. Contactez l’administration.",
            403,
        )

    changed_fields = []
    if not user.first_name and claims.get("given_name"):
        user.first_name = claims["given_name"][:150]
        changed_fields.append("first_name")
    if not user.last_name and claims.get("family_name"):
        user.last_name = claims["family_name"][:150]
        changed_fields.append("last_name")
    if changed_fields:
        user.save(update_fields=changed_fields)

    return user


class InscriptionAPIView(generics.CreateAPIView):
    serializer_class = InscriptionSerializer
    permission_classes = [AllowAny]


class GoogleLoginAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {"detail": "La connexion Google n’est pas configurée."},
                status=503,
            )

        serializer = GoogleCredentialSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            from google.auth.exceptions import GoogleAuthError
            from google.auth.transport.requests import Request
            from google.oauth2 import id_token
        except ImportError:
            return Response(
                {"detail": "La dépendance de connexion Google est absente."},
                status=503,
            )

        try:
            claims = id_token.verify_oauth2_token(
                serializer.validated_data["credential"],
                Request(),
                settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response(
                {"detail": "Le jeton Google est invalide ou expiré."},
                status=401,
            )
        except GoogleAuthError:
            return Response(
                {"detail": "La vérification Google est temporairement indisponible."},
                status=503,
            )

        try:
            user = _get_or_create_google_user(claims)
        except GoogleLoginError as error:
            return Response(
                {"detail": error.detail},
                status=error.status_code,
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        })


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

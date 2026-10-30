"""Tests de regression pour l'API de profil."""
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from .models import ProfilUtilisateur

User = get_user_model()


class ProfilUtilisateurAPITests(APITestCase):
    def test_compte_sans_profil(self):
        user = User.objects.create_user(username="habitant_sans_profil", password="secret_test_123")
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], user.username)
        self.assertEqual(ProfilUtilisateur.objects.filter(utilisateur=user).count(), 1)
        self.client.get("/api/auth/me/")
        self.assertEqual(ProfilUtilisateur.objects.filter(utilisateur=user).count(), 1)

    def test_superutilisateur_sans_profil(self):
        user = User.objects.create_superuser(
            username="administrateur_test",
            email="admin@example.test",
            password="secret_test_123",
        )
        self.client.force_authenticate(user=user)
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_me_necessite_authentification(self):
        response = self.client.get("/api/auth/me/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

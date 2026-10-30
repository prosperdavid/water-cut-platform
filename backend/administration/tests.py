from django.contrib.admin.models import LogEntry
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from incidents.models import Incident
from zones.models import Zone

User = get_user_model()


class AdministrationAPITests(TestCase):
    def setUp(self):
        self.moderateur = User.objects.create_user(
            username="moderateur", password="mot-de-passe-de-test", is_staff=True
        )
        self.habitant = User.objects.create_user(
            username="habitant", password="mot-de-passe-de-test"
        )
        self.zone = Zone.objects.create(nom="Zone test")
        self.incident = Incident.objects.create(
            zone=self.zone, latitude=-23.35, longitude=43.67,
            date_debut=timezone.now(), statut=Incident.Statut.A_CONFIRMER
        )
        self.client = APIClient()

    def test_non_authentifie_refuse(self):
        self.assertEqual(
            self.client.get("/api/administration/tableau-bord/").status_code, 401
        )

    def test_habitant_refuse(self):
        self.client.force_authenticate(user=self.habitant)
        self.assertEqual(
            self.client.get("/api/administration/tableau-bord/").status_code, 403
        )
        self.assertEqual(
            self.client.patch(
                "/api/administration/incidents/%s/" % self.incident.pk,
                {"action": "rejeter"}, format="json"
            ).status_code, 403
        )

    def test_statistiques(self):
        self.client.force_authenticate(user=self.moderateur)
        result = self.client.get("/api/administration/tableau-bord/")
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.data["nombre_incidents"], 1)

    def test_moderation_journalisee(self):
        self.client.force_authenticate(user=self.moderateur)
        url = "/api/administration/incidents/%s/" % self.incident.pk
        self.assertEqual(
            self.client.patch(url, {"action": "rejeter"}, format="json").status_code, 200
        )
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.statut, Incident.Statut.REJETE)
        self.assertEqual(
            self.client.patch(url, {"action": "rouvrir"}, format="json").status_code, 200
        )
        self.incident.refresh_from_db()
        self.assertEqual(self.incident.statut, Incident.Statut.A_CONFIRMER)
        self.assertEqual(LogEntry.objects.filter(user=self.moderateur).count(), 2)

    def test_protection_admin(self):
        self.client.force_authenticate(user=self.moderateur)
        result = self.client.patch(
            "/api/administration/utilisateurs/%s/" % self.moderateur.pk,
            {"is_active": False}, format="json"
        )
        self.assertEqual(result.status_code, 403)

    def test_desactiver_habitant(self):
        self.client.force_authenticate(user=self.moderateur)
        result = self.client.patch(
            "/api/administration/utilisateurs/%s/" % self.habitant.pk,
            {"is_active": False}, format="json"
        )
        self.assertEqual(result.status_code, 200)
        self.habitant.refresh_from_db()
        self.assertFalse(self.habitant.is_active)

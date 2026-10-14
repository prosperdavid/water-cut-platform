from django.conf import settings
from django.db import models


class ProfilUtilisateur(models.Model):
    utilisateur = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profil"
    )

    telephone = models.CharField(
        max_length=20,
        blank=True
    )

    score_fiabilite = models.FloatField(
        default=50.0
    )

    nombre_participations = models.PositiveIntegerField(
        default=0
    )

    actif = models.BooleanField(
        default=True
    )

    date_creation = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"Profil de {self.utilisateur.username}"
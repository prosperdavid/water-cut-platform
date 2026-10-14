from django.conf import settings
from django.db import models

from incidents.models import Incident


class Signalement(models.Model):
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="signalements"
    )

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="signalements",
        blank=True,
        null=True
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    heure_debut_estimee = models.DateTimeField(
        blank=True,
        null=True
    )

    commentaire = models.TextField(
        blank=True,
        null=True
    )

    date_signalement = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-date_signalement"]

    def __str__(self):
        return f"Signalement #{self.id} - {self.utilisateur}"
    
class Confirmation(models.Model):

    class TypeReponse(models.TextChoices):
        COUPURE_CONFIRMEE = "COUPURE_CONFIRMEE", "Je n'ai pas d'eau"
        EAU_DISPONIBLE = "EAU_DISPONIBLE", "J'ai de l'eau"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="confirmations"
    )

    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="confirmations"
    )

    type_reponse = models.CharField(
        max_length=30,
        choices=TypeReponse.choices
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        blank=True,
        null=True
    )

    date_confirmation = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["-date_confirmation"]

        constraints = [
            models.UniqueConstraint(
                fields=["utilisateur", "incident"],
                name="unique_confirmation_par_utilisateur_incident"
            )
        ]

    def __str__(self):
        return (
            f"{self.utilisateur} - "
            f"{self.get_type_reponse_display()} - "
            f"Incident #{self.incident_id}"
        )
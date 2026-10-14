from django.db import models
from django.conf import settings
from zones.models import Zone


class Incident(models.Model):

    class Statut(models.TextChoices):
        A_CONFIRMER = "A_CONFIRMER", "À confirmer"
        ACTIF = "ACTIF", "Coupure confirmée"
        RETABLISSEMENT_PROBABLE = (
            "RETABLISSEMENT_PROBABLE",
            "Rétablissement probable"
        )
        RETABLI = "RETABLI", "Eau rétablie"
        REJETE = "REJETE", "Rejeté"

    zone = models.ForeignKey(
        Zone,
        on_delete=models.PROTECT,
        related_name="incidents"
    )

    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6
    )

    date_debut = models.DateTimeField()

    date_fin = models.DateTimeField(
        blank=True,
        null=True
    )

    statut = models.CharField(
        max_length=30,
        choices=Statut.choices,
        default=Statut.A_CONFIRMER
    )

    score_confiance = models.FloatField(default=0)
    
    fiabilite_traitee = models.BooleanField(
    default=False
)

    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-date_creation"]

    def __str__(self):
        return f"Incident #{self.id} - {self.zone.nom}"
    
    from django.conf import settings



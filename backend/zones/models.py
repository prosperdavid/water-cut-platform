from django.db import models


class Zone(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    ville = models.CharField(max_length=100, default="Toliara")
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nom"]
        verbose_name = "Zone"
        verbose_name_plural = "Zones"

    def __str__(self):
        return self.nom
from django.contrib import admin

from .models import Incident


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "zone",
        "statut",
        "score_confiance",
        "date_debut",
        "date_fin",
        "fiabilite_traitee",
    ]

    list_filter = [
        "statut",
        "zone",
        "fiabilite_traitee",
    ]

    search_fields = [
        "zone__nom",
    ]

    ordering = [
        "-date_creation",
    ]
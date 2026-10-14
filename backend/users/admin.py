from django.contrib import admin

from .models import ProfilUtilisateur


@admin.register(ProfilUtilisateur)
class ProfilUtilisateurAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "utilisateur",
        "telephone",
        "score_fiabilite",
        "nombre_participations",
        "actif",
    ]

    list_filter = [
        "actif",
    ]

    search_fields = [
        "utilisateur__username",
        "utilisateur__first_name",
        "utilisateur__last_name",
        "telephone",
    ]

    ordering = [
        "utilisateur__username",
    ]
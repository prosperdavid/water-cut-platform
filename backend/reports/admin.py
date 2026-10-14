from django.contrib import admin

from .models import Signalement, Confirmation


@admin.register(Signalement)
class SignalementAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "utilisateur",
        "incident",
        "date_signalement",
    ]

    list_filter = [
        "incident",
        "date_signalement",
    ]

    search_fields = [
        "utilisateur__username",
        "commentaire",
    ]

    ordering = [
        "-date_signalement",
    ]


@admin.register(Confirmation)
class ConfirmationAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "utilisateur",
        "incident",
        "type_reponse",
        "date_confirmation",
    ]

    list_filter = [
        "type_reponse",
        "incident",
    ]

    search_fields = [
        "utilisateur__username",
    ]

    ordering = [
        "-date_confirmation",
    ]
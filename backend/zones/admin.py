from django.contrib import admin

from .models import Zone


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "nom",
        "ville",
        "actif",
        "date_creation",
    ]

    list_filter = [
        "ville",
        "actif",
    ]

    search_fields = [
        "nom",
        "ville",
    ]

    ordering = [
        "nom",
    ]
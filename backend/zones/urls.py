from django.urls import path

from .views import ZoneListAPIView


urlpatterns = [
    path(
        "zones/",
        ZoneListAPIView.as_view(),
        name="liste-zones"
    ),
]
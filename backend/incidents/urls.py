from django.urls import path

from .views import (
    IncidentListAPIView,
    IncidentDetailAPIView,
)


urlpatterns = [
    path(
        "incidents/",
        IncidentListAPIView.as_view(),
        name="liste-incidents"
    ),

    path(
        "incidents/<int:pk>/",
        IncidentDetailAPIView.as_view(),
        name="detail-incident"
    ),
]
from django.urls import path

from .views import (
    SignalementCreateAPIView,
    ConfirmationCreateAPIView,
)


urlpatterns = [
    path(
        "signalements/",
        SignalementCreateAPIView.as_view(),
        name="creer-signalement"
    ),

    path(
        "confirmations/",
        ConfirmationCreateAPIView.as_view(),
        name="creer-confirmation"
    ),
]
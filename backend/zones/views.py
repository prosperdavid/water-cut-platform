from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from .models import Zone
from .serializers import ZoneSerializer


class ZoneListAPIView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ZoneSerializer

    queryset = Zone.objects.filter(
        actif=True
    ).order_by("nom")
from django.contrib.auth.models import User
from rest_framework import serializers

from .models import ProfilUtilisateur
from incidents.models import Incident


class InscriptionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    telephone = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True
    )

    class Meta:
        model = User
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "telephone",
            "password",
        ]

    def create(self, validated_data):
        telephone = validated_data.pop("telephone", "")

        user = User.objects.create_user(
            **validated_data
        )

        ProfilUtilisateur.objects.create(
            utilisateur=user,
            telephone=telephone
        )

        return user


class ProfilUtilisateurSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        source="utilisateur.username",
        read_only=True
    )
    first_name = serializers.CharField(
        source="utilisateur.first_name",
        read_only=True
    )
    last_name = serializers.CharField(
        source="utilisateur.last_name",
        read_only=True
    )
    email = serializers.EmailField(
        source="utilisateur.email",
        read_only=True
    )
    is_staff = serializers.BooleanField(source="utilisateur.is_staff", read_only=True)

    class Meta:
        model = ProfilUtilisateur
        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "is_staff",
            "telephone",
            "score_fiabilite",
            "nombre_participations",
            "date_creation",
        ]
        read_only_fields = fields


class HistoriqueIncidentSerializer(serializers.ModelSerializer):
    zone_nom = serializers.CharField(
        source="zone.nom",
        read_only=True
    )

    ai_signale = serializers.SerializerMethodField()
    ma_reponse = serializers.SerializerMethodField()

    class Meta:
        model = Incident
        fields = [
            "id",
            "zone",
            "zone_nom",
            "statut",
            "score_confiance",
            "date_debut",
            "date_fin",
            "ai_signale",
            "ma_reponse",
        ]
        read_only_fields = fields

    def get_ai_signale(self, obj):
        utilisateur = self.context["request"].user
        return obj.signalements.filter(
            utilisateur=utilisateur
        ).exists()

    def get_ma_reponse(self, obj):
        utilisateur = self.context["request"].user

        confirmation = obj.confirmations.filter(
            utilisateur=utilisateur
        ).first()

        if confirmation:
            return confirmation.type_reponse

        return None
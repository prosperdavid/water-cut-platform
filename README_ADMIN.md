# Espace administration — Coupure

Cette première version ajoute une interface React /administration et une API Django /api/administration/ réservées aux utilisateurs Django is_staff=True.

## Fonctionnalités
- Tableau de bord (nombres d'incidents, quartiers et habitants ; répartition des statuts).
- Consultation des 100 incidents les plus récents, rejet et réouverture.
- Consultation des 100 comptes habitants les plus récents, désactivation et réactivation.
- Journalisation de chaque modification dans django_admin_log.
- Contrôle d'autorisation côté API avec IsAdminUser ; les comptes administrateurs sont protégés de la désactivation par cette API.

## Démarrage et vérification
1. Dans backend : python manage.py check
2. Dans backend, sur une base de test dédiée : python manage.py test administration
3. Dans frontend : npm install && npm run build
4. Créer, si nécessaire, un compte administrateur avec python manage.py createsuperuser (pas de mot de passe dans le dépôt).
5. Se connecter normalement. Les comptes is_staff sont dirigés vers /administration.

La modération ne confirme pas une coupure et ne prétend pas que l'eau est rétablie. Les algorithmes de confiance existants ne sont pas modifiés. L'API renvoie 403 aux non-administrateurs et 401 aux personnes non authentifiées.

IMPORTANT : vérifier les tests sur la configuration réelle avant le déploiement. Ne pas déployer en production sans sauvegarde de la base. Cette version ne crée pas de migration ; la pagination au-delà de 100 éléments et une modération plus fine restent à développer.

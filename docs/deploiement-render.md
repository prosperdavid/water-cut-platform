# Déploiement sur Render

Le fichier `render.yaml` décrit les services Render existants `water-cut-frontend` et `water-cut-backend`. Les deux restent liés à `main` ; l'API conserve son forfait gratuit à Francfort. Aucune base n'est créée : les variables de connexion déjà enregistrées sur l'API sont conservées.

## Déploiement

1. Pousser les changements de `feature/espace-administration` vers `main` pour déclencher les déploiements des services existants.
2. Dans Render, si ces services ne sont pas encore gérés par un Blueprint, choisir **New → Blueprint**, connecter le dépôt `prosperdavid/water-cut-platform` sur `main`, puis vérifier que les deux ressources existantes sont mises à jour sans nouvelle base.
3. Le démarrage de l'API applique les migrations avant de lancer Django. Les paramètres et secrets existants de l'API sont conservés.
4. Ajouter `https://water-cut-frontend.onrender.com` aux **Authorized JavaScript origins** du client OAuth Google pour activer la connexion Google en production.

Les comptes, incidents et zones présents uniquement dans une base locale ne sont pas copiés vers Render.

## Coût estimatif

Le service API et le site statique utilisent les forfaits déjà en place ; aucun nouveau service facturé ni aucune base Render ne sont créés par ce Blueprint.

La valeur Google Client ID enregistrée dans `render.yaml` est publique. Aucun secret OAuth ni fichier `.env` n'est inclus dans le dépôt. Le Blueprint conserve la clé Django et les variables de connexion déjà enregistrées dans Render.

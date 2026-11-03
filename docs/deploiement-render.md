# Déploiement sur Render

Le fichier `render.yaml` décrit trois ressources dans la région de Singapour : le site React, l'API Django et PostgreSQL. Le site est statique ; la base n'accepte que les connexions privées depuis Render.

## Déploiement

1. Pousser la branche `feature/espace-administration` sur GitHub avec `render.yaml`.
2. Dans Render, choisir **New → Blueprint**, connecter le dépôt `prosperdavid/water-cut-platform`, puis appliquer le Blueprint.
3. Render construit le site et l'API, génère la clé Django, crée PostgreSQL et applique les migrations avant le démarrage.
4. À la fin, noter l'URL publique du site. L'ajouter aux **Authorized JavaScript origins** du client OAuth Google pour activer la connexion Google en production.
5. Créer le premier compte administrateur dans le Shell du service API avec `python manage.py createsuperuser`, puis renseigner les quartiers dans l'administration.

Le déploiement démarre avec une base vide. Les comptes, incidents et zones présents dans la base locale ne sont pas copiés.

## Coût estimatif

Le service API au plan `0.5c-512mb` coûte environ 7 USD/mois et PostgreSQL au plan `0.1c-256mb` environ 6 USD/mois. Le site statique et le workspace Hobby sont gratuits. Prévoir environ 13 USD/mois avant dépassement de bande passante ou ajout de stockage ; vérifier le montant affiché par Render avant de valider la création des ressources.

La valeur Google Client ID enregistrée dans `render.yaml` est publique. Aucun secret OAuth ni fichier `.env` n'est inclus dans le dépôt. Render génère la clé secrète Django et fournit l'URL PostgreSQL au service API.

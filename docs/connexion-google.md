# Connexion avec Google

## Configuration du client OAuth

1. Dans Google Cloud Console, créez un identifiant OAuth 2.0 de type **Application Web**.
2. Ajoutez les origines utilisées par le site dans **Origines JavaScript autorisées**. En développement local, ajoutez les deux origines suivantes :

   ```text
   http://localhost:5173
   http://127.0.0.1:5173
   ```

3. Dans le fichier `.env` à la racine du projet, renseignez le même identifiant client Web dans les deux variables :

   ```dotenv
   GOOGLE_CLIENT_ID=votre-identifiant.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=votre-identifiant.apps.googleusercontent.com
   ```

   `GOOGLE_CLIENT_ID` sert à vérifier le jeton côté Django. `VITE_GOOGLE_CLIENT_ID` active le bouton Google dans Vite. L'identifiant client est public ; ne mettez pas de secret OAuth dans le frontend.

4. Installez la dépendance backend si nécessaire, puis appliquez la migration :

   ```powershell
   cd D:\water-cut-platform\backend
   .\.venv\Scripts\python.exe -m pip install -r requirements.txt
   .\.venv\Scripts\python.exe manage.py migrate
   ```

5. Redémarrez Django et Vite pour qu'ils relisent `.env`.

Pour un déploiement, ajoutez également l'origine HTTPS réelle du frontend aux origines JavaScript autorisées et définissez les deux variables dans l'environnement de déploiement.

## Fonctionnement

Le navigateur affiche le bouton officiel Google Identity Services et transmet le jeton d'identité à `POST /api/auth/google/`. Django vérifie le jeton pour l'audience correspondant au client Web configuré, associe le compte à l'identifiant Google stable (`sub`) et renvoie les mêmes jetons JWT que la connexion classique.

Un compte existant avec la même adresse vérifiée est associé au compte Google. Les comptes désactivés ou les adresses ambiguës sont refusés.

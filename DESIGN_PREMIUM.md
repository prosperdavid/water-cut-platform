# Design Premium Coupure

Cette évolution redessine la partie habitants, la vitrine et l'administration sans modifier les API ni les règles métier.

- Nouvelle feuille CSS centrale `src/premium.css` importée après `App.css`.
- Surcouche dédiée pour l'administration : `src/pages/AdministrationPremium.css`.
- Identité bleu nuit / bleu / turquoise, cartes et typographie uniformisées.
- Affichage responsive : tableau de bord habitants élargi en deux colonnes sur ordinateur, cartes et listes adaptées au mobile.
- Barre de navigation habitants fixe et accessible sur smartphone.
- Emoji de salutation et repère de la démo remplacés par du texte ou des icônes.
- L'aperçu de la carte sur la vitrine est explicitement indiqué comme illustratif, ses chiffres sont des exemples, pas des données en direct.

## Vérification locale

```bat
cd /d D:\water-cut-platform\frontend
npm install
npm run build
npm run dev
```

Vérifier les pages /, /connexion, /inscription, /accueil, /carte, /signaler, /historique, /profil et /administration à 375px, 768px, 1280px et 1440px. Vérifier les parcours de connexion, le menu mobile, la cartographie et la modération avec les données de test.

Ne pas fusionner tant que les tests visuels et la compilation n'ont pas été effectués.
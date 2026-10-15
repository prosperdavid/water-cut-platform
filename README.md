# 💧 Plateforme participative de suivi des coupures d'eau

Projet de fin d'études consacré au développement d'une **application web mobile participative permettant de signaler, confirmer et suivre les coupures d'eau dans un quartier**.

Le projet est conçu dans le contexte de **Toliara, Madagascar**, où l'alimentation en eau est assurée par la JIRAMA.

---

## 🎯 Problématique

> Les déclarations croisées par plusieurs habitants permettent-elles de produire un historique fiable des coupures d'eau ?

L'objectif du système est de recueillir les signalements des habitants et de les croiser afin d'identifier les coupures réellement constatées dans une zone.

---

## 📌 Principe de fonctionnement

Un habitant peut signaler une coupure d'eau depuis son téléphone ou son ordinateur en utilisant sa position GPS.

Lorsqu'un nouveau signalement est envoyé, le système recherche automatiquement s'il existe déjà un incident proche :

- distance maximale : **300 mètres**
- fenêtre temporelle : **2 heures**

Si un incident correspondant existe, le nouveau signalement lui est associé.

Sinon, un nouvel incident est créé.

Les autres habitants peuvent ensuite :

- confirmer la coupure ;
- indiquer qu'ils disposent encore d'eau ;
- participer à l'amélioration du score de confiance de l'incident.

Lorsque suffisamment d'habitants participent et que le score de confiance atteint le seuil défini, la coupure peut être considérée comme confirmée.

---

## ✨ Fonctionnalités principales

### Authentification

- inscription d'un habitant ;
- connexion sécurisée ;
- authentification avec JWT ;
- renouvellement automatique du token ;
- protection des pages privées.

### Signalement

- signalement d'une coupure d'eau ;
- récupération de la position GPS ;
- choix de la zone ;
- heure estimée du début de la coupure ;
- commentaire facultatif.

### Gestion des incidents

- regroupement automatique des signalements proches ;
- calcul de distance avec la formule de Haversine ;
- calcul d'un score de confiance ;
- gestion du nombre de participants ;
- évolution automatique du statut d'un incident.

### Confirmation communautaire

Un habitant peut :

- confirmer une coupure ;
- signaler que l'eau est disponible ;
- modifier sa réponse.

Une seule participation par utilisateur et par incident est prise en compte.

### Carte interactive

La plateforme utilise **Leaflet et OpenStreetMap** pour afficher :

- les incidents ;
- leur localisation ;
- leur statut ;
- la position de l'utilisateur.

### Historique

Chaque utilisateur peut consulter :

- ses signalements ;
- ses confirmations ;
- ses différentes participations.

### Profil utilisateur

Le profil contient notamment :

- le nom ;
- le nom d'utilisateur ;
- le numéro de téléphone ;
- le score de fiabilité ;
- le nombre de participations.

---

## 🚦 Statuts d'un incident

| Statut | Description |
|---|---|
| `A_CONFIRMER` | Signalement en attente de confirmations |
| `ACTIF` | Coupure confirmée |
| `RETABLISSEMENT_PROBABLE` | Plusieurs habitants indiquent le retour de l'eau |
| `RETABLI` | Eau considérée comme rétablie |
| `REJETE` | Incident considéré comme non fiable |

---

## 🧠 Règles métier principales

```text
Rayon maximal entre les signalements : 300 mètres
Fenêtre temporelle : 2 heures
Score initial de fiabilité utilisateur : 50
Score minimum de confirmation : 70
Nombre minimum de participants : 3
```

---

## 🛠️ Technologies utilisées

### Backend

- Python
- Django
- Django REST Framework
- SimpleJWT
- PostgreSQL
- django-cors-headers
- python-dotenv

### Frontend

- React
- Vite
- Axios
- React Router
- Leaflet
- React Leaflet
- Lucide React
- CSS

### Outils

- Visual Studio Code
- Git
- GitHub
- PowerShell
- pgAdmin
- PostgreSQL

---

## 🏗️ Architecture du projet

```text
water-cut-platform/
│
├── backend/
│   ├── config/
│   ├── users/
│   ├── zones/
│   ├── incidents/
│   ├── reports/
│   └── manage.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── .env
├── .gitignore
├── README.md
└── venv/
```

Les fichiers sensibles tels que `.env`, `venv`, `node_modules` et `dist` ne sont pas envoyés sur GitHub.

---

## 🔐 API principales

### Authentification

```text
POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/token/refresh/
GET  /api/auth/me/
GET  /api/auth/history/
```

### Zones

```text
GET /api/zones/
```

### Incidents

```text
GET /api/incidents/
GET /api/incidents/<id>/
```

### Participation

```text
POST /api/signalements/
POST /api/confirmations/
```

---

## 📱 Interfaces principales

La plateforme comprend notamment :

- connexion ;
- inscription ;
- accueil ;
- carte des incidents ;
- signalement d'une coupure ;
- détail d'un incident ;
- confirmation ou infirmation ;
- historique ;
- profil utilisateur.

L'interface est conçue dans une approche **web mobile responsive**.

---

## 🔬 Objectif académique

Ce projet permet d'étudier si la participation de plusieurs habitants peut améliorer la fiabilité des informations concernant les coupures d'eau.

Il met notamment en œuvre :

- la géolocalisation ;
- le regroupement spatial et temporel ;
- la participation communautaire ;
- un score de confiance ;
- un score de fiabilité utilisateur ;
- un historique des incidents.

---

## 🚀 Améliorations futures

- notifications en temps réel ;
- statistiques avancées ;
- tableau de bord administratif ;
- Progressive Web App (PWA) ;
- fonctionnement hors ligne ;
- déploiement public sécurisé en HTTPS ;
- amélioration du système de réputation ;
- analyse statistique des coupures par quartier.

---

## 👨‍💻 Auteur

**Prosper David**

Projet de fin d'études en informatique.

Toliara, Madagascar.

---

## 📄 Statut du projet

🟢 **MVP fonctionnel**

Le backend Django, l'API REST, la base PostgreSQL et le frontend React sont fonctionnels et continuent d'être améliorés.
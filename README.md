# Social Pulse INPT – Backend 

Social Pulse INPT – Application Web Full-Stack sur les tendances technologiques basée sur les réseaux sociaux avec Pred. IA  
Cette première version **backend minimaliste** collecte du contenu technique (Reddit), le traite et l’expose via une API GraphQL .

---

## 🚀 Fonctionnalités déjà implémentées
- 🔍 **Collecteur Reddit** — Scrape automatiquement les subreddits tech pour récupérer les derniers posts
- 🧹 **Processeur de nettoyage** — Assainit et normalise les données brutes
- 🧠 **Processeur NLP** — Extrait les entités, mots-clés et résumés
- 💬 **Analyse de sentiment** — Score le ton des posts (positif / négatif / neutre)
- 📂 **Service de catégories** — Classifie automatiquement les posts par thème tech
- 📈 **Service de tendances** — Détecte les sujets tendance en temps réel
- ⚡ **File Redis** — Files d'attente Bull pour le traitement asynchrone
- 🔌 **API GraphQL** — Interrogation flexible des données enrichies
- 📊 **Métriques Prometheus** — Observabilité et monitoring intégrés

---

## 🏗️ Architecture Actuelle
```
API Reddit
    │
    ▼
redditCollector.js           ← Récupère les posts bruts
    │
    ▼
postQueue (BullMQ)     ← File de traitement asynchrone
    │
    ├──▶ cleanWorker.js       ← Nettoyage des données  →  Modèle CleanPost
    │
    ├──▶ nlpWorker.js         ← Enrichissement NLP     →  Modèle EnrichedPost
    │
    └──▶ trendWorker.js       ← Détection de tendances →  Modèle TrendSnapshot
                │
                ▼
        API GraphQL (resolvers + schema)
                │
                ▼
          Applications clientes
```
 
---

## 📁 Structure du projet Actuelle
 
```
backend/
├── logs/
│   ├── combined.log
│   └── error.log
├── src/
│   ├── collectors/
│   │   └── redditCollector.js       # Scraper de l'API Reddit
│   ├── config/
│   │   ├── db.js                    # Configuration de la base de données
│   │   └── redis.js                 # Connexion Redis
│   ├── graphql/
│   │   ├── resolvers.js             # Résolveurs GraphQL
│   │   └── schema.js                # Définitions des types GraphQL
│   ├── models/
│   │   ├── CleanPost.js             # Schéma des posts nettoyés
│   │   ├── EnrichedPost.js          # Schéma des posts enrichis par NLP
│   │   ├── Post.js                  # Schéma de base des posts
│   │   ├── RawPost.js               # Schéma des posts bruts Reddit
│   │   └── TrendSnapshot.js         # Schéma des données de tendances
│   ├── monitoring/
│   │   └── metrics.js               # Métriques Prometheus
│   ├── processors/
│   │   ├── cleanProcessor.js        # Logique de nettoyage
│   │   └── nlpProcessor.js          # Logique de traitement NLP
│   ├── queues/
│   │   ├── index.js                 # Initialisation des files
│   │   └── postQueue                # Définition de la file Bull
│   ├── routes/                      
│   ├── services/
│   │   ├── categoryService.js       # Catégorisation des posts
│   │   ├── redisService.js          # Helpers Redis
│   │   ├── scheduler.js             # Planificateur de tâches (cron)
│   │   ├── sentimentService.js      # Analyse de sentiment
│   │   └── trendService.js          # Calcul des tendances
│   ├── utils/
│   │   └── logger.js                # Logger Winston
│   ├── workers/
│   │   ├── cleanWorker.js           # Consommateur de la file de nettoyage
│   │   ├── nlpWorker.js             # Consommateur de la file NLP
│   │   └── trendWorker.js           # Consommateur de la file de tendances
│   └── app.js                       # Point d'entrée Express
├── test/                            # Suite de tests
├── .env                             # Variables d'environnement
├── docker-compose.yml               # Services Docker
├── package.json
└── prometheus.yml                   # Configuration Prometheus

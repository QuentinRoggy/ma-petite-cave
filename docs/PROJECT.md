# Cuvée - CRM pour Cavistes

> Pivot du projet "Ma Petite Cave" vers un outil B2B2C de gestion de relation caviste-client

---

## Table des matières

1. [Vision](#vision)
2. [Personas](#personas)
3. [Décisions produit](#décisions-produit)
4. [Features](#features)
5. [Architecture technique](#architecture-technique)
6. [Modèle de données](#modèle-de-données)
7. [API](#api)
8. [Structure frontend](#structure-frontend)
9. [Roadmap](#roadmap)
10. [Tickets](#tickets)

---

## Vision

### Le problème

Un caviste propose des box mensuelles (2 bouteilles, ~25-30€) à ses clients fidèles. Aujourd'hui :
- Il explique les vins à l'oral mais le client oublie
- Il ne sait pas si le client a aimé ou non
- Il ne peut pas personnaliser les futures sélections
- Pas de moyen simple pour le client de redemander un vin

### La solution

**Cuvée** connecte le caviste et ses clients via une plateforme digitale :
- Le caviste saisit les infos des vins (une fois) et les assigne aux box clients
- Le client reçoit les fiches détaillées sur son mobile
- Le client note et commente après dégustation
- Le caviste visualise le feedback et affine ses recommandations

### La boucle de valeur

```
┌─────────────────────────────────────────────────────────────┐
│                        BOUCLE DE VALEUR                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Caviste                                    Client          │
│      │                                          │            │
│      │  1. Crée une box avec 2 vins            │            │
│      │  ─────────────────────────────────►     │            │
│      │                                          │            │
│      │  2. Reçoit la box + fiches détaillées   │            │
│      │                                          │            │
│      │  3. Note les vins après dégustation     │            │
│      │  ◄─────────────────────────────────     │            │
│      │                                          │            │
│      │  4. "J'en reveux !"                     │            │
│      │  ◄─────────────────────────────────     │            │
│      │                                          │            │
│      │  5. Affine les futures sélections       │            │
│      │  ─────────────────────────────────►     │            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Personas

### Le Caviste

**Profil :**
- Gérant d'une cave indépendante
- Propose des abonnements box mensuelles
- Connaît bien ses clients réguliers
- Peu de temps pour la gestion administrative

**Objectifs :**
- Gagner du temps (ne plus répéter les infos à l'oral)
- Fidéliser ses clients abonnés
- Comprendre les goûts de chaque client
- Gérer ses abonnements facilement

**Frustrations actuelles :**
- Pas le temps de tout expliquer
- Oublie ce qu'il a déjà donné à qui
- Ne sait pas si le client a aimé ou pas
- Pas de visibilité sur les préférences

**Device :** Desktop principalement, mobile pour les photos

### Le Client

**Profil :**
- Amateur de vin, pas expert
- Abonné à une box mensuelle chez son caviste
- Veut découvrir et se souvenir

**Objectifs :**
- Recevoir les infos sur ses vins (sans les oublier)
- Savoir quand ouvrir une bouteille
- Noter ses dégustations pour s'en souvenir
- Redemander facilement une bouteille qu'il a aimée
- Voir son historique

**Frustrations actuelles :**
- Oublie les conseils du caviste
- Ne sait plus quel vin c'était
- Pas de moyen simple de dire "j'ai adoré, j'en reveux"

**Device :** Mobile principalement (cave personnelle avec photos)

---

## Décisions produit

| Question | Décision |
|----------|----------|
| Multi-caviste | V1 mono-caviste, mais architecture multi-tenant dès le départ |
| Modèle économique | Gratuit pour tous au départ → puis abonnement caviste |
| Onboarding client | 2 modes : en magasin OU invitation par lien |
| Notifications | Email + In-app, ciblées et pertinentes |
| Client multi-cavistes | Oui, relation N-N à prévoir (V2) |
| UI Client | Mobile-first, responsive |
| UI Caviste | Desktop-first, adaptable mobile |
| Vins perso (hors box) | Garder la possibilité (potentiellement payant V2) |
| Catalogue vins | Le caviste enregistre les vins et peut les réutiliser dans plusieurs box |

---

## Features

### MVP - Côté Caviste

| Feature | Description | Statut |
|---------|-------------|--------|
| Auth merchant | Inscription/connexion avec rôle caviste | [x] |
| Dashboard clients | Liste de tous ses clients abonnés | [x] |
| Fiche client | Voir l'historique des box et les notes | [x] |
| Créer un client | Onboarding en magasin (nom, email, tel) | [x] |
| Catalogue vins | CRUD des vins réutilisables | [x] |
| Créer une box | Sélectionner 2 vins + notes personnalisées | [x] |
| Voir les notes | Visualiser le feedback des clients | [x] |

### MVP - Côté Client

| Feature | Description | Statut |
|---------|-------------|--------|
| Auth client | Inscription/connexion | [x] |
| Voir mes box | Historique des box reçues | [x] |
| Détail vin | Fiche complète (arômes, garde, accords) | [x] |
| Noter un vin | Étoiles + commentaire libre | [x] |
| Statut bouteille | En cave / Ouverte / Terminée | [x] |

### V2 - Côté Caviste

| Feature | Description | Phase | Statut |
|---------|-------------|-------|--------|
| Stats globales | Vins les plus aimés, clients actifs | 5 | [ ] |
| Invitation par email | Envoyer un lien d'inscription | 6 | [ ] |
| Notifications feedback | Alerté quand un client note un vin | 6 | [ ] |
| Demandes de re-commande | Voir les bouteilles redemandées | MVP | [x] |
| Profil de goût auto | Synthèse des préférences client | 7 | [ ] |
| Gestion abonnements | Forfaits, dates, pauses | 7 | [ ] |

### V2 - Côté Client

| Feature | Description | Phase | Statut |
|---------|-------------|-------|--------|
| Bouton "J'en reveux" | Demander une re-commande | MVP | [x] |
| Préférences déclarées | Définir ses goûts | 5 | [ ] |
| Partager une fiche | Envoyer à un ami | 5 | [ ] |
| Rappel de garde | Notification "prête à boire" | 6 | [ ] |
| Multi-cavistes | Être client de plusieurs cavistes | 7 | [ ] |
| Vins perso | Ajouter des vins hors box | 7 | [ ] |

---

## Architecture technique

### Stack

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 16 + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Backend | AdonisJS 6 + TypeScript |
| Database | PostgreSQL (Neon) |
| Storage | AWS S3 / Cloudflare R2 |
| Auth | AdonisJS Auth (tokens) |
| Monorepo | pnpm workspaces |

### Structure des packages

```
packages/
├── api/                    # Backend AdonisJS
│   ├── app/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── validators/
│   │   └── services/
│   ├── database/
│   │   └── migrations/
│   └── start/
│       └── routes.ts
│
└── app/                    # Frontend Next.js
    ├── app/
    │   ├── (auth)/         # Routes publiques (login, register)
    │   ├── (merchant)/     # Routes caviste
    │   └── (client)/       # Routes client
    └── components/
        ├── ui/             # shadcn/ui
        ├── merchant/       # Composants caviste
        └── client/         # Composants client
```

---

## Modèle de données

### Schéma relationnel

```
┌──────────┐          ┌──────────────────┐        ┌─────────┐
│  User    │          │   Subscription   │        │  User   │
│(Merchant)│ 1──────N │  (Client chez    │ N──────1│(Client) │
└──────────┘          │   un caviste)    │        └─────────┘
     │                └──────────────────┘             │
     │                        │                        │
     │ 1                      │ N                      │
     ▼                        ▼                        │
┌──────────┐            ┌──────────┐                   │
│  Wine    │            │   Box    │                   │
│(Catalogue│            │(Livraison│                   │
│ caviste) │            │mensuelle)│                   │
└──────────┘            └──────────┘                   │
     │                        │                        │
     │ 1                      │ N                      │
     │                        ▼                        │
     │              ┌─────────────────┐                │
     └─────────────►│    BoxWine      │                │
                    │ (Vin dans box)  │                │
                    └─────────────────┘                │
                             │                         │
                             │ 1                       │
                             ▼                         │
                    ┌─────────────────┐                │
                    │   ClientWine    │◄───────────────┘
                    │ (Exemplaire     │
                    │  chez client)   │
                    └─────────────────┘
```

### Tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('client', 'merchant')),
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### merchant_profiles
```sql
CREATE TABLE merchant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  shop_name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  logo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id)
);
```

#### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('pending_invite', 'active', 'paused', 'cancelled')),
  invite_token VARCHAR(255),
  invite_sent_at TIMESTAMP,
  activated_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(client_id, merchant_id)
);

CREATE INDEX idx_subscriptions_merchant ON subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
```

#### wines (catalogue caviste)
```sql
CREATE TABLE wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  vintage INTEGER CHECK (vintage >= 1900 AND vintage <= 2100),
  color VARCHAR(20) CHECK (color IN ('rouge', 'blanc', 'rosé', 'pétillant')),
  region VARCHAR(255),
  grapes VARCHAR(255),
  alcohol_degree DECIMAL(4,2),
  aromas TEXT[],
  food_pairings TEXT[],
  guard_min INTEGER,
  guard_max INTEGER,
  photo_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wines_merchant ON wines(merchant_id);
```

#### boxes
```sql
CREATE TABLE boxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- Format: '2025-01'
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent')),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(subscription_id, month)
);

CREATE INDEX idx_boxes_subscription ON boxes(subscription_id);
```

#### box_wines
```sql
CREATE TABLE box_wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id UUID REFERENCES boxes(id) ON DELETE CASCADE,
  wine_id UUID REFERENCES wines(id) ON DELETE SET NULL,
  merchant_notes TEXT,
  position INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_box_wines_box ON box_wines(box_id);
```

#### client_wines
```sql
CREATE TABLE client_wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  box_wine_id UUID REFERENCES box_wines(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'in_cellar' CHECK (status IN ('in_cellar', 'opened', 'finished')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  personal_notes TEXT,
  opened_at TIMESTAMP,
  finished_at TIMESTAMP,
  wants_reorder BOOLEAN DEFAULT FALSE,
  reorder_requested_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_client_wines_client ON client_wines(client_id);
CREATE INDEX idx_client_wines_box_wine ON client_wines(box_wine_id);
```

---

## API

### Endpoints d'authentification

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/auth/register` | Inscription (client ou merchant) | Non |
| POST | `/auth/login` | Connexion | Non |
| POST | `/auth/logout` | Déconnexion | Oui |
| GET | `/auth/me` | Utilisateur courant | Oui |

### Endpoints Caviste

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/merchant/profile` | Profil caviste | Merchant |
| PATCH | `/merchant/profile` | Modifier profil | Merchant |
| GET | `/merchant/clients` | Liste des clients | Merchant |
| POST | `/merchant/clients` | Créer un client | Merchant |
| GET | `/merchant/clients/:id` | Détail client | Merchant |
| GET | `/merchant/wines` | Catalogue vins | Merchant |
| POST | `/merchant/wines` | Ajouter un vin | Merchant |
| GET | `/merchant/wines/:id` | Détail vin | Merchant |
| PATCH | `/merchant/wines/:id` | Modifier vin | Merchant |
| DELETE | `/merchant/wines/:id` | Supprimer vin | Merchant |
| GET | `/merchant/boxes` | Liste des box | Merchant |
| POST | `/merchant/boxes` | Créer une box | Merchant |
| GET | `/merchant/boxes/:id` | Détail box | Merchant |
| PATCH | `/merchant/boxes/:id` | Modifier box | Merchant |
| POST | `/merchant/boxes/:id/send` | Envoyer la box | Merchant |

### Endpoints Client

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| GET | `/client/subscriptions` | Mes abonnements | Client |
| GET | `/client/boxes` | Mes box | Client |
| GET | `/client/boxes/:id` | Détail box | Client |
| GET | `/client/wines` | Mes vins (tous) | Client |
| GET | `/client/wines/:id` | Détail vin | Client |
| PATCH | `/client/wines/:id` | Modifier (notes, rating, status) | Client |
| POST | `/client/wines/:id/reorder` | Demander re-commande | Client |

### Endpoints Upload

| Méthode | Route | Description | Auth |
|---------|-------|-------------|------|
| POST | `/uploads/photo` | Upload photo | Oui |

---

## Structure Frontend

### Routes Next.js

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   └── layout.tsx
│
├── (merchant)/
│   ├── layout.tsx              # Layout caviste (sidebar, header)
│   ├── dashboard/
│   │   └── page.tsx            # Vue d'ensemble
│   ├── clients/
│   │   ├── page.tsx            # Liste clients
│   │   ├── new/
│   │   │   └── page.tsx        # Créer client
│   │   └── [id]/
│   │       └── page.tsx        # Fiche client
│   ├── wines/
│   │   ├── page.tsx            # Catalogue
│   │   ├── new/
│   │   │   └── page.tsx        # Ajouter vin
│   │   └── [id]/
│   │       └── page.tsx        # Détail/édition vin
│   └── boxes/
│       ├── page.tsx            # Liste box
│       ├── new/
│       │   └── page.tsx        # Créer box
│       └── [id]/
│           └── page.tsx        # Détail box
│
└── (client)/
    ├── layout.tsx              # Layout client (bottom nav)
    ├── page.tsx                # Home (redirect vers boxes ou cave)
    ├── boxes/
    │   ├── page.tsx            # Mes box
    │   └── [id]/
    │       └── page.tsx        # Détail box
    └── cave/
        ├── page.tsx            # Tous mes vins
        └── [id]/
            └── page.tsx        # Détail vin + notes
```

### Composants principaux

#### Merchant (Caviste)
- `MerchantLayout` - Layout avec sidebar navigation
- `ClientCard` - Carte client dans la liste
- `ClientForm` - Formulaire création/édition client
- `WineCatalogCard` - Carte vin dans le catalogue
- `WineForm` - Formulaire vin enrichi (arômes, garde, accords)
- `BoxBuilder` - Interface création de box (sélection vins)
- `ClientFeedback` - Vue des notes d'un client

#### Client
- `ClientLayout` - Layout mobile avec bottom navigation
- `BoxCard` - Carte d'une box mensuelle
- `WineCard` - Carte vin dans la cave
- `WineDetail` - Vue détaillée avec infos caviste
- `RatingInput` - Notation interactive
- `WineStatusSelect` - Sélecteur de statut (en cave/ouvert/terminé)

---

## Roadmap

### Phase 0 : Préparation
- [x] Définir le modèle de données
- [x] Définir les user flows
- [x] Documenter le projet
- [ ] Choisir un nom définitif

### Phase 1 : Fondations (Semaine 1) ✅
- [x] Migration DB (nouvelles tables)
- [x] Adapter le modèle User (rôles)
- [x] Middleware role guard
- [x] Layouts merchant vs client
- [x] Routing par rôle après login

### Phase 2 : Espace Caviste (Semaine 2) ✅
- [x] Dashboard caviste
- [x] Liste des clients
- [x] Créer un client (onboarding magasin)
- [x] CRUD catalogue vins (enrichi)

### Phase 3 : Box & Espace Client (Semaine 3) ✅
- [x] Créer une box (sélection vins, notes perso)
- [x] Envoyer une box
- [x] Vue client : mes box
- [x] Vue client : détail vin
- [x] Noter un vin + statut

### Phase 4 : Boucle de feedback (Semaine 4)
- [x] Caviste voit les notes des clients
- [x] Caviste voit les demandes de re-commande
- [x] Dashboard avec feedbacks récents
- [ ] Tests et corrections
- [ ] Démo au caviste

### Phase Admin : Backoffice Administrateur (Prioritaire)
- [ ] Infrastructure (rôle, middleware, layout)
- [ ] Gestion des utilisateurs (CRUD)
- [ ] Gestion des abonnements (liens client-caviste)
- [ ] Impersonation
- [ ] Outils de démo
- [ ] Dashboard admin

### Phase 5 : V2 Quick Wins
- [ ] Stats globales (caviste)
- [ ] Préférences déclarées (client)
- [ ] Partage fiche vin

### Phase 6 : Engagement & Notifications
- [ ] Infrastructure email (Resend)
- [ ] Invitation client par email
- [ ] Notifications feedback (digest)
- [ ] Rappels de garde

### Phase 7 : Features Avancées
- [ ] Multi-cavistes
- [ ] Vins personnels (hors box)
- [ ] Profil de goût automatique
- [ ] Gestion des abonnements

### Phase 8 : Production & Infrastructure
- [ ] Déploiement (Railway + Vercel)
- [ ] CI/CD (GitHub Actions)
- [ ] Monitoring (Sentry)
- [ ] Sécurité (rate limiting, headers)
- [ ] Performance

---

## Tickets

Les tickets détaillés sont dans le dossier [`./tickets/`](./tickets/).

### MVP (Phases 1-4) ✅

| Phase | Tickets | Statut |
|-------|---------|--------|
| Phase 1 | [PHASE-1-FONDATIONS.md](./tickets/PHASE-1-FONDATIONS.md) | ✅ |
| Phase 2 | [PHASE-2-ESPACE-CAVISTE.md](./tickets/PHASE-2-ESPACE-CAVISTE.md) | ✅ |
| Phase 3 | [PHASE-3-BOX-ET-CLIENT.md](./tickets/PHASE-3-BOX-ET-CLIENT.md) | ✅ |
| Phase 4 | [PHASE-4-FEEDBACK.md](./tickets/PHASE-4-FEEDBACK.md) | ✅ |

### Post-MVP

| Phase | Tickets | Priorité | Statut |
|-------|---------|----------|--------|
| Admin | [PHASE-ADMIN.md](./tickets/PHASE-ADMIN.md) | 🔴 Haute | [ ] |
| Phase 5 | [PHASE-5-V2-QUICK-WINS.md](./tickets/PHASE-5-V2-QUICK-WINS.md) | 🟡 Moyenne | [ ] |
| Phase 6 | [PHASE-6-ENGAGEMENT.md](./tickets/PHASE-6-ENGAGEMENT.md) | 🟡 Moyenne | [ ] |
| Phase 7 | [PHASE-7-FEATURES-AVANCEES.md](./tickets/PHASE-7-FEATURES-AVANCEES.md) | 🟢 Basse | [ ] |
| Phase 8 | [PHASE-8-PRODUCTION.md](./tickets/PHASE-8-PRODUCTION.md) | 🔴 Haute | [ ] |

---

## Notifications

### Pour le Caviste

| Événement | Canal | Fréquence |
|-----------|-------|-----------|
| Client accepte invitation | Email + In-app | Immédiat |
| Client note un vin | In-app | Groupé (1x/jour) |
| Client demande re-commande | Email + In-app | Immédiat |
| Client n'a pas de box ce mois | In-app | 1x/mois (rappel) |

### Pour le Client

| Événement | Canal | Fréquence |
|-----------|-------|-----------|
| Nouvelle box disponible | Email + In-app | Immédiat |
| Rappel : vins non notés | In-app | 1x après 2 sem |
| Vin arrive à maturité optimale | In-app | Quand pertinent |

---

## User Flows

### Onboarding client EN MAGASIN

```
1. Caviste clique "Nouveau client"
2. Saisit : nom, email, tel, préférences initiales
3. Crée un mot de passe temporaire
4. Compte créé ✓
5. Email envoyé au client avec ses accès
6. Client peut changer son mot de passe
```

### Onboarding client PAR INVITATION (V2)

```
1. Caviste clique "Inviter un client"
2. Saisit : email, prénom
3. Email d'invitation envoyé
4. Client clique le lien, crée son compte
5. Caviste notifié "Jean Dupont a rejoint !"
6. Caviste peut créer sa première box
```

### Création d'une box mensuelle

```
1. Caviste va sur "Nouvelle box"
2. Sélectionne le client
3. Choisit le mois (ex: Janvier 2025)
4. Ajoute le vin 1 (depuis catalogue ou nouveau)
5. Écrit ses notes personnalisées pour ce client
6. Ajoute le vin 2
7. Prévisualise
8. Envoie → Le client reçoit une notification
```

### Client note un vin

```
1. Client ouvre l'app
2. Voit la notification "Nouvelle box"
3. Ouvre la box, voit les 2 vins
4. Clique sur un vin → détail avec infos caviste
5. Plus tard, change le statut en "Ouverte"
6. Après dégustation, note (1-5 étoiles)
7. Ajoute un commentaire optionnel
8. Le caviste verra ce feedback
```

---

## Réutilisation du code existant

| Existant | Action |
|----------|--------|
| Auth système | Adapter (ajouter rôle) |
| Upload S3/R2 | Réutiliser tel quel |
| Modèle Wine | Enrichir (arômes, garde, accords) |
| WineCard component | Adapter |
| WineForm component | Dupliquer/adapter |
| Rating stars | Réutiliser tel quel |
| UI components (shadcn) | Réutiliser tel quel |
| Filtres/recherche | Adapter |

**Estimation : ~60%** du code actuel peut servir de base.

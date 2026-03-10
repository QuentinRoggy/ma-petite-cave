# Phase 7 : Features Avancées

> Durée estimée : 3-4 semaines
> Objectif : Ajouter les features complexes pour une V2 complète

---

## Vue d'ensemble

Cette phase regroupe les features les plus complexes :
- Multi-cavistes (client chez plusieurs cavistes)
- Vins personnels (hors box)
- Profil de goût automatique
- Gestion des abonnements

---

## Tickets

### TICKET-7.1 : Multi-cavistes

**Priorité :** P1
**Statut :** [ ] À faire
**Effort :** Moyen

#### Description
Permettre à un client d'être abonné chez plusieurs cavistes.

#### État actuel
L'architecture supporte déjà le multi-caviste via la table `subscriptions` (N-N entre users).

#### Travail à faire
1. **UI Client** - Afficher les vins/box groupés par caviste
2. **Sélecteur de contexte** - Filtrer par caviste ou voir tout
3. **Onboarding** - Gérer l'ajout d'un second caviste

#### Modifications UI

**Navigation client avec plusieurs cavistes :**
```
┌─────────────────────────────┐
│ Ma Cave            [Tous ▼] │
├─────────────────────────────┤
│ Filtrer par caviste:        │
│ ○ Tous (12 vins)            │
│ ● Cave du Château (8)       │
│ ○ Le Cellier (4)            │
├─────────────────────────────┤
│                             │
│ [Liste des vins filtrée]    │
│                             │
└─────────────────────────────┘
```

#### API Modifications
```
GET /client/subscriptions
  -> Liste tous les cavistes du client

GET /client/wines?merchantId=xxx
  -> Filtre par caviste (optionnel)

GET /client/boxes?merchantId=xxx
  -> Filtre par caviste (optionnel)
```

#### Fichiers à modifier
```
packages/api/app/controllers/client/wines_controller.ts
packages/api/app/controllers/client/boxes_controller.ts
packages/app/app/(client)/components/merchant-filter.tsx
packages/app/app/(client)/cave/page.tsx
packages/app/app/(client)/boxes/page.tsx
```

#### Critères d'acceptation
- [ ] Le client voit tous ses vins de tous les cavistes
- [ ] Le client peut filtrer par caviste
- [ ] Chaque vin/box indique de quel caviste il vient
- [ ] Le client peut accepter une invitation d'un second caviste

---

### TICKET-7.2 : Vins personnels (hors box)

**Priorité :** P2
**Statut :** [ ] À faire
**Effort :** Moyen

#### Description
Permettre au client d'ajouter des vins à sa cave qui ne viennent pas d'une box (achats directs, cadeaux, etc.).

#### Modèle de données
```sql
-- Option 1 : Étendre client_wines
ALTER TABLE client_wines
  ALTER COLUMN box_wine_id DROP NOT NULL;

ALTER TABLE client_wines
  ADD COLUMN personal_wine_id UUID REFERENCES personal_wines(id);

-- Nouvelle table pour les vins perso
CREATE TABLE personal_wines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255),
  vintage INTEGER,
  color VARCHAR(20),
  region VARCHAR(255),
  photo_url VARCHAR(500),
  notes TEXT,
  purchased_at DATE,
  purchase_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints
```
GET    /client/personal-wines
POST   /client/personal-wines
GET    /client/personal-wines/:id
PATCH  /client/personal-wines/:id
DELETE /client/personal-wines/:id
```

#### UI Client

**Bouton d'ajout sur la page cave :**
```
┌─────────────────────────────┐
│ Ma Cave              [+ ▼]  │
│              ├─────────────┤│
│              │ Ajouter un  ││
│              │ vin perso   ││
│              └─────────────┘│
├─────────────────────────────┤
```

**Formulaire simplifié :**
```
┌─────────────────────────────┐
│ ← Ajouter un vin            │
├─────────────────────────────┤
│                             │
│ [📷 Prendre une photo]      │
│                             │
│ Nom du vin *                │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Domaine                     │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ Millésime    Couleur        │
│ ┌────────┐   ┌───────────┐  │
│ │ 2020   │   │ Rouge   ▼ │  │
│ └────────┘   └───────────┘  │
│                             │
│ Mes notes                   │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ [     Ajouter     ]         │
│                             │
└─────────────────────────────┘
```

#### Distinction visuelle
Les vins perso ont un badge différent dans la liste :
- Vins de box : Badge "Box Janvier 2024"
- Vins perso : Badge "Perso" ou icône différente

#### Critères d'acceptation
- [ ] Le client peut ajouter un vin manuellement
- [ ] Photo via l'appareil ou upload
- [ ] Le vin apparaît dans Ma Cave
- [ ] Le vin peut être noté comme les autres
- [ ] Distinction visuelle entre vins box et vins perso

---

### TICKET-7.3 : Profil de goût automatique

**Priorité :** P3
**Statut :** [ ] À faire
**Effort :** Élevé

#### Description
Générer automatiquement un profil de goût basé sur les notes du client pour aider le caviste à personnaliser ses sélections.

#### Approche
1. **Règles simples** - Agrégation des données existantes
2. **IA (optionnel)** - Analyse plus fine avec LLM

#### Données à analyser
- Notes par couleur (rouge, blanc, rosé, pétillant)
- Notes par région
- Notes par cépage (si renseigné)
- Notes par profil aromatique
- Vins demandés en re-commande

#### Algorithme simple
```typescript
interface TasteProfile {
  favoriteColors: Array<{ color: string; avgRating: number; count: number }>
  favoriteRegions: Array<{ region: string; avgRating: number; count: number }>
  avgRating: number
  totalRated: number
  topWines: Array<{ name: string; rating: number }>
  reorderRate: number // % de vins redemandés
}

function generateTasteProfile(clientWines: ClientWine[]): TasteProfile {
  // Grouper par couleur
  const byColor = groupBy(clientWines, 'wine.color')
  const favoriteColors = Object.entries(byColor)
    .map(([color, wines]) => ({
      color,
      avgRating: average(wines.map(w => w.rating)),
      count: wines.length,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)

  // Idem pour régions...

  return {
    favoriteColors,
    favoriteRegions,
    // ...
  }
}
```

#### API Endpoints
```
GET /merchant/clients/:id/taste-profile
  -> Profil de goût calculé automatiquement

GET /client/taste-profile
  -> Mon profil de goût
```

#### Affichage côté caviste
```
┌─────────────────────────────────────────────────┐
│ Profil de goût de Jean Dupont                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Couleurs préférées                              │
│ ████████████████░░░░ Rouge (4.3★, 12 vins)     │
│ ██████████░░░░░░░░░░ Blanc (3.8★, 6 vins)      │
│ ████░░░░░░░░░░░░░░░░ Rosé (3.2★, 2 vins)       │
│                                                 │
│ Régions favorites                               │
│ 1. Bourgogne (4.5★)                            │
│ 2. Bordeaux (4.2★)                             │
│ 3. Vallée du Rhône (3.9★)                      │
│                                                 │
│ Tendances                                       │
│ • Préfère les vins de garde moyenne (5-10 ans) │
│ • Apprécie les arômes fruités et boisés        │
│ • Taux de re-commande : 25%                    │
│                                                 │
│ Top 3 vins les plus aimés                       │
│ ⭐⭐⭐⭐⭐ Château Margaux 2019                   │
│ ⭐⭐⭐⭐⭐ Meursault 2020                         │
│ ⭐⭐⭐⭐ Côte-Rôtie 2018                         │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Option IA (futur)
```typescript
// Utiliser Claude pour générer un résumé textuel
const prompt = `
Analyse les notes de dégustation suivantes et génère
un profil de goût en 2-3 phrases :

${JSON.stringify(clientData)}
`

const summary = await anthropic.messages.create({
  model: 'claude-3-haiku',
  messages: [{ role: 'user', content: prompt }],
})

// Résultat : "Jean apprécie particulièrement les vins
// rouges de Bourgogne avec des arômes fruités. Il
// privilégie les millésimes récents et les vins
// prêts à boire."
```

#### Critères d'acceptation
- [ ] Algorithme de calcul du profil
- [ ] Affichage sur la fiche client (côté caviste)
- [ ] Affichage "Mon profil" côté client
- [ ] Mise à jour automatique après chaque note

---

### TICKET-7.4 : Gestion des abonnements

**Priorité :** P2
**Statut :** [ ] À faire
**Effort :** Élevé

#### Description
Permettre au caviste de gérer les abonnements de ses clients (forfaits, pauses, historique).

#### Fonctionnalités
- Types de forfaits (Découverte 2 bouteilles, Premium 4 bouteilles, etc.)
- Fréquence (mensuel, bimestriel)
- Pause temporaire
- Historique des paiements (optionnel, hors scope V2)

#### Modèle de données
```sql
-- Types de forfaits
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  bottles_per_box INTEGER DEFAULT 2,
  frequency VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'bimonthly', 'quarterly'
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Modifier subscriptions
ALTER TABLE subscriptions
  ADD COLUMN plan_id UUID REFERENCES subscription_plans(id),
  ADD COLUMN paused_at TIMESTAMP,
  ADD COLUMN pause_reason TEXT,
  ADD COLUMN resume_at DATE;
```

#### API Endpoints
```
-- Plans
GET    /merchant/plans
POST   /merchant/plans
PATCH  /merchant/plans/:id
DELETE /merchant/plans/:id

-- Gestion abonnement client
PATCH /merchant/clients/:id/subscription
  Body: { planId?, status?, pausedUntil?, notes? }
```

#### UI Caviste - Gestion des plans
```
┌─────────────────────────────────────────────────┐
│ Mes forfaits                          [+ Créer] │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Découverte                    [Modifier]    │ │
│ │ 2 bouteilles • Mensuel • 29€               │ │
│ │ 8 clients actifs                            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Premium                       [Modifier]    │ │
│ │ 4 bouteilles • Mensuel • 55€               │ │
│ │ 3 clients actifs                            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### UI Caviste - Fiche client
```
┌─────────────────────────────────────────────────┐
│ Abonnement                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ Forfait : Découverte (2 bouteilles)    [Changer]│
│ Statut  : Actif                                 │
│ Depuis  : Janvier 2024                          │
│                                                 │
│ [ Mettre en pause ]  [ Résilier ]               │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Modal de pause
```
┌─────────────────────────────────────────────────┐
│ Mettre en pause l'abonnement                    │
├─────────────────────────────────────────────────┤
│                                                 │
│ Jean Dupont - Forfait Découverte                │
│                                                 │
│ Raison (optionnel)                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ Vacances d'été                              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Reprendre le                                    │
│ ┌─────────────────────────────────────────────┐ │
│ │ 01/09/2024                                  │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [ Annuler ]              [ Mettre en pause ]    │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### Critères d'acceptation
- [ ] Le caviste peut créer des forfaits
- [ ] Le caviste peut assigner un forfait à un client
- [ ] Le caviste peut mettre en pause un abonnement
- [ ] Le caviste peut résilier un abonnement
- [ ] Historique visible sur la fiche client

---

## Résumé Phase 7

| Ticket | Description | Effort | Statut |
|--------|-------------|--------|--------|
| 7.1 | Multi-cavistes | Moyen | [ ] |
| 7.2 | Vins personnels | Moyen | [ ] |
| 7.3 | Profil de goût auto | Élevé | [ ] |
| 7.4 | Gestion abonnements | Élevé | [ ] |

**Definition of Done Phase 7 :**
- [ ] Le client peut être chez plusieurs cavistes
- [ ] Le client peut ajouter des vins perso
- [ ] Le caviste voit le profil de goût automatique
- [ ] Le caviste peut gérer les forfaits et pauses

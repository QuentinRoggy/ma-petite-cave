# Phase 5 : V2 - Quick Wins

> Durée estimée : 1-2 semaines
> Objectif : Améliorer rapidement l'expérience avec des features à faible effort / fort impact

---

## Vue d'ensemble

Cette phase regroupe les features V2 les plus simples à implémenter :
- Stats globales pour le caviste
- Préférences déclarées par le client
- Partage de fiche vin

---

## Tickets

### TICKET-5.1 : Stats globales (Caviste)

**Priorité :** P1
**Statut :** [ ] À faire
**Effort :** Faible

#### Description
Ajouter une page de statistiques globales pour le caviste avec des insights sur son activité.

#### Fonctionnalités
- Vins les plus aimés (top 5 par note moyenne)
- Vins les plus demandés en re-commande
- Clients les plus actifs (qui notent le plus)
- Évolution du nombre de box envoyées par mois
- Taux de notation global

#### Fichiers à créer/modifier
```
packages/api/app/controllers/merchant/stats_controller.ts
packages/app/app/(merchant)/stats/page.tsx
```

#### API Endpoints
```
GET /merchant/stats/overview
GET /merchant/stats/top-wines
GET /merchant/stats/top-clients
GET /merchant/stats/monthly
```

#### Maquette
```
┌─────────────────────────────────────────────────────┐
│ Statistiques                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 45 box   │ │ 4.2 ★    │ │ 78%      │ │ 12     │ │
│  │ envoyées │ │ moyenne  │ │ notés    │ │ reorders│ │
│  └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│                                                     │
│  Top 5 vins les plus aimés                         │
│  ┌─────────────────────────────────────────────┐   │
│  │ 1. Château Margaux 2019        4.8 ★ (12)  │   │
│  │ 2. Chablis Premier Cru 2020    4.6 ★ (8)   │   │
│  │ 3. ...                                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  Évolution mensuelle              [Graphique]      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Critères d'acceptation
- [ ] Page stats accessible depuis la sidebar
- [ ] Cards avec KPIs principaux
- [ ] Liste des top vins avec note moyenne
- [ ] Graphique d'évolution (optionnel, peut utiliser une lib simple)

---

### TICKET-5.2 : Préférences client déclarées

**Priorité :** P2
**Statut :** [ ] À faire
**Effort :** Faible

#### Description
Permettre au client de déclarer ses préférences de goûts pour aider le caviste à personnaliser ses sélections.

#### Fonctionnalités
- Couleurs préférées (rouge, blanc, rosé, pétillant)
- Budget moyen par bouteille
- Régions favorites
- Arômes appréciés
- Restrictions (sulfites, bio, etc.)

#### Modèle de données
```sql
-- Ajouter à la table users ou créer client_preferences
ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';

-- Structure du JSON
{
  "colors": ["rouge", "blanc"],
  "budgetMin": 10,
  "budgetMax": 25,
  "regions": ["Bourgogne", "Bordeaux"],
  "aromas": ["fruité", "boisé"],
  "restrictions": ["bio"]
}
```

#### Fichiers à créer/modifier
```
packages/api/database/migrations/xxx_add_preferences_to_users.ts
packages/api/app/controllers/client/preferences_controller.ts
packages/app/app/(client)/preferences/page.tsx
```

#### API Endpoints
```
GET  /client/preferences
PATCH /client/preferences
```

#### Maquette mobile
```
┌─────────────────────────────┐
│ ← Mes préférences           │
├─────────────────────────────┤
│                             │
│ Couleurs préférées          │
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │Rouge│ │Blanc│ │Rosé │    │
│ │ ✓   │ │ ✓   │ │     │    │
│ └─────┘ └─────┘ └─────┘    │
│                             │
│ Budget par bouteille        │
│ [====●=======] 15-30€       │
│                             │
│ Régions favorites           │
│ + Ajouter une région        │
│ [Bourgogne] [Bordeaux]      │
│                             │
│ Arômes appréciés            │
│ [Fruité] [Épicé] [+]        │
│                             │
│ [  Enregistrer  ]           │
│                             │
└─────────────────────────────┘
```

#### Critères d'acceptation
- [ ] Page préférences accessible depuis le profil client
- [ ] Sélection multiple pour couleurs/régions/arômes
- [ ] Slider pour le budget
- [ ] Sauvegarde en temps réel ou via bouton
- [ ] Le caviste peut voir ces préférences sur la fiche client

---

### TICKET-5.3 : Partager une fiche vin

**Priorité :** P3
**Statut :** [ ] À faire
**Effort :** Très faible

#### Description
Permettre au client de partager une fiche vin avec un ami via les APIs natives de partage.

#### Fonctionnalités
- Bouton "Partager" sur la fiche vin
- Utilise Web Share API (mobile) ou copie du lien (desktop)
- Page publique de visualisation du vin (sans auth)

#### Fichiers à créer/modifier
```
packages/app/app/(client)/cave/[id]/page.tsx  # Ajouter bouton
packages/app/app/wine/[id]/page.tsx           # Page publique
packages/api/app/controllers/public/wines_controller.ts
```

#### API Endpoints
```
GET /public/wines/:id  # Retourne les infos publiques du vin
```

#### Implémentation du partage
```tsx
const handleShare = async () => {
  const shareData = {
    title: wine.name,
    text: `Découvre ce vin : ${wine.name} - ${wine.domain}`,
    url: `${window.location.origin}/wine/${wine.id}`,
  }

  if (navigator.share) {
    await navigator.share(shareData)
  } else {
    await navigator.clipboard.writeText(shareData.url)
    toast.success('Lien copié !')
  }
}
```

#### Page publique
```
┌─────────────────────────────┐
│ 🍷 Ma Petite Cave            │
├─────────────────────────────┤
│                             │
│ [    Photo du vin    ]      │
│                             │
│ Château Margaux 2019        │
│ Margaux, Bordeaux           │
│                             │
│ Rouge • 13.5%               │
│                             │
│ Arômes : Fruits noirs,      │
│ épices, vanille             │
│                             │
│ Accords : Viande rouge,     │
│ fromages affinés            │
│                             │
│ ─────────────────────────── │
│ Partagé via Ma Petite Cave  │
│ L'app qui connecte les      │
│ cavistes et leurs clients   │
│                             │
└─────────────────────────────┘
```

#### Critères d'acceptation
- [ ] Bouton partage sur la fiche vin client
- [ ] Web Share API sur mobile
- [ ] Fallback copie lien sur desktop
- [ ] Page publique lisible sans connexion
- [ ] Branding Ma Petite Cave sur la page publique

---

## Résumé Phase 5

| Ticket | Description | Effort | Statut |
|--------|-------------|--------|--------|
| 5.1 | Stats globales | Faible | [ ] |
| 5.2 | Préférences client | Faible | [ ] |
| 5.3 | Partage fiche vin | Très faible | [ ] |

**Definition of Done Phase 5 :**
- [ ] Le caviste a accès à des stats sur son activité
- [ ] Le client peut déclarer ses préférences
- [ ] Le client peut partager une fiche vin

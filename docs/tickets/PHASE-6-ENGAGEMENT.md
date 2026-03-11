# Phase 6 : Engagement & Notifications

> Durée estimée : 2-3 semaines
> Objectif : Améliorer l'engagement des utilisateurs via invitations et notifications

---

## Vue d'ensemble

Cette phase ajoute les fonctionnalités de communication :
- Invitation client par email
- Notifications quand un client note un vin
- Rappels de garde (vin prêt à boire)

---

## Prérequis techniques

### Service d'envoi d'emails
Choisir et configurer un provider :
- **Resend** (recommandé, simple, gratuit jusqu'à 3000/mois)
- **SendGrid**
- **AWS SES**

### Configuration AdonisJS
```typescript
// config/mail.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/mail'

export default defineConfig({
  default: 'resend',
  mailers: {
    resend: {
      transport: 'resend',
      key: env.get('RESEND_API_KEY'),
    },
  },
})
```

---

## Tickets

### TICKET-6.1 : Infrastructure email

**Priorité :** P0 (bloquant)
**Statut :** [ ] À faire
**Effort :** Faible

#### Description
Configurer l'envoi d'emails dans l'application.

#### Tâches
1. Installer le package mail AdonisJS
2. Configurer Resend (ou autre provider)
3. Créer les templates de base
4. Tester l'envoi

#### Fichiers à créer
```
packages/api/config/mail.ts
packages/api/resources/views/emails/
├── layout.edge
├── welcome.edge
├── invitation.edge
├── feedback-notification.edge
└── wine-ready.edge
```

#### Template de base (layout.edge)
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: sans-serif; max-width: 600px; margin: 0 auto; }
    .header { background: #722F37; color: white; padding: 20px; }
    .content { padding: 20px; }
    .button {
      background: #722F37;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      display: inline-block;
    }
    .footer { color: #666; font-size: 12px; padding: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🍷 Ma Petite Cave</h1>
  </div>
  <div class="content">
    @!section('content')
  </div>
  <div class="footer">
    <p>Ma Petite Cave - L'app qui connecte les cavistes et leurs clients</p>
  </div>
</body>
</html>
```

#### Critères d'acceptation
- [ ] Package mail installé et configuré
- [ ] Templates de base créés
- [ ] Test d'envoi fonctionnel
- [ ] Variables d'environnement documentées

---

### TICKET-6.2 : Invitation client par email

**Priorité :** P1
**Statut :** [ ] À faire
**Effort :** Moyen
**Dépend de :** TICKET-6.1

#### Description
Permettre au caviste d'inviter un nouveau client par email au lieu de créer son compte manuellement.

#### Flow
```
1. Caviste clique "Inviter un client"
2. Saisit email + prénom
3. Email envoyé avec lien d'inscription
4. Client clique, crée son mot de passe
5. Compte activé, lié au caviste
6. Caviste notifié "Jean a rejoint !"
```

#### Modèle de données
```sql
-- La table subscriptions a déjà les champs nécessaires :
-- status: 'pending_invite' | 'active' | ...
-- invite_token: VARCHAR(255)
-- invite_sent_at: TIMESTAMP
-- activated_at: TIMESTAMP
```

#### API Endpoints
```
POST /merchant/clients/invite
  Body: { email, firstName, notes? }
  -> Crée subscription avec status='pending_invite'
  -> Génère invite_token
  -> Envoie email

GET /auth/invite/:token
  -> Vérifie le token
  -> Retourne infos (email, merchant)

POST /auth/invite/:token/accept
  Body: { password, fullName }
  -> Crée le user
  -> Active la subscription
  -> Envoie notif au merchant
```

#### Fichiers à créer/modifier
```
packages/api/app/controllers/merchant/invitations_controller.ts
packages/api/app/controllers/auth_controller.ts  # Ajouter accept invite
packages/api/resources/views/emails/invitation.edge
packages/app/app/(auth)/invite/[token]/page.tsx
packages/app/app/(merchant)/clients/invite/page.tsx
```

#### Email d'invitation
```
Objet: [Cave du Château] vous invite à rejoindre Ma Petite Cave

Bonjour Jean,

Cave du Château vous invite à rejoindre Ma Petite Cave pour
recevoir vos fiches de dégustation personnalisées.

[Créer mon compte]

À bientôt,
L'équipe Ma Petite Cave
```

#### Page d'acceptation
```
┌─────────────────────────────┐
│ 🍷 Bienvenue sur Ma Petite Cave │
├─────────────────────────────┤
│                             │
│ Cave du Château vous        │
│ invite à rejoindre !        │
│                             │
│ Email                       │
│ ┌─────────────────────────┐ │
│ │ jean@example.com (fixe) │ │
│ └─────────────────────────┘ │
│                             │
│ Votre nom                   │
│ ┌─────────────────────────┐ │
│ │ Jean Dupont             │ │
│ └─────────────────────────┘ │
│                             │
│ Mot de passe                │
│ ┌─────────────────────────┐ │
│ │ ••••••••                │ │
│ └─────────────────────────┘ │
│                             │
│ [ Créer mon compte ]        │
│                             │
└─────────────────────────────┘
```

#### Critères d'acceptation
- [ ] Formulaire d'invitation côté caviste
- [ ] Email d'invitation envoyé
- [ ] Page d'acceptation fonctionnelle
- [ ] Compte créé et lié au caviste
- [ ] Notification au caviste quand le client accepte

---

### TICKET-6.3 : Notifications feedback (Caviste)

**Priorité :** P2
**Statut :** [ ] À faire
**Effort :** Moyen
**Dépend de :** TICKET-6.1

#### Description
Notifier le caviste quand un client note un vin.

#### Options de notification
1. **Email immédiat** - À chaque note
2. **Email groupé** - Résumé quotidien/hebdomadaire
3. **In-app** - Badge/notification dans l'app

#### Recommandation
Commencer par l'email groupé (digest) pour éviter le spam.

#### Modèle de données
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,  -- 'feedback', 'reorder', 'invite_accepted'
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  email_feedback BOOLEAN DEFAULT true,
  email_feedback_frequency VARCHAR(20) DEFAULT 'daily', -- 'instant', 'daily', 'weekly'
  email_reorder BOOLEAN DEFAULT true,
  email_invite_accepted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### API Endpoints
```
GET  /notifications
GET  /notifications/unread/count
POST /notifications/:id/read
POST /notifications/read-all

GET  /notifications/preferences
PATCH /notifications/preferences
```

#### Job de digest quotidien
```typescript
// app/jobs/feedback_digest_job.ts
export default class FeedbackDigestJob {
  async run() {
    // Récupérer les merchants avec des feedbacks non notifiés
    // Grouper par merchant
    // Envoyer un email récap
    // Marquer comme notifiés
  }
}
```

#### Email de digest
```
Objet: 3 nouveaux avis sur vos vins

Bonjour,

Vos clients ont donné leur avis :

⭐⭐⭐⭐⭐ Château Margaux 2019
Jean D. : "Excellent, parfait avec le gigot !"

⭐⭐⭐⭐ Chablis 2020
Marie L. : "Très frais, idéal pour l'apéro"

⭐⭐⭐ Côtes du Rhône 2021
Pierre M. : (pas de commentaire)

[Voir tous les feedbacks]

---
Modifier mes préférences de notification
```

#### Critères d'acceptation
- [ ] Table notifications créée
- [ ] Notifications créées quand un client note
- [ ] Job de digest quotidien
- [ ] Email de résumé envoyé
- [ ] Page préférences de notifications
- [ ] Compteur de notifications non lues dans le header

---

### TICKET-6.4 : Rappels de garde (Client)

**Priorité :** P2
**Statut :** [ ] À faire
**Effort :** Moyen
**Dépend de :** TICKET-6.1

#### Description
Notifier le client quand un de ses vins arrive à maturité optimale.

#### Logique
```
Si wine.vintage + wine.guard_min <= année_courante
ET client_wine.status = 'in_cellar'
ET pas de rappel déjà envoyé
-> Créer notification + envoyer email
```

#### Modèle de données
```sql
-- Ajouter à client_wines
ALTER TABLE client_wines ADD COLUMN guard_reminder_sent_at TIMESTAMP;
```

#### Job de vérification
```typescript
// app/jobs/guard_reminder_job.ts
// Exécuté quotidiennement
export default class GuardReminderJob {
  async run() {
    const currentYear = new Date().getFullYear()

    // Trouver les vins prêts à boire
    const readyWines = await ClientWine.query()
      .where('status', 'in_cellar')
      .whereNull('guard_reminder_sent_at')
      .whereHas('boxWine', (q) => {
        q.whereHas('wine', (wq) => {
          wq.whereRaw('vintage + guard_min <= ?', [currentYear])
        })
      })
      .preload('client')
      .preload('boxWine', (q) => q.preload('wine'))

    // Grouper par client et envoyer
    // ...
  }
}
```

#### Email de rappel
```
Objet: 🍷 Un vin est prêt à déguster !

Bonjour Jean,

Bonne nouvelle ! Votre Château Margaux 2019 a atteint
sa période de garde optimale et est maintenant prêt
à être dégusté.

Domaine : Château Margaux
Millésime : 2019
Garde conseillée : 5-15 ans
Reçu dans la box de : Janvier 2024

[Voir la fiche du vin]

Bonne dégustation ! 🥂
```

#### Critères d'acceptation
- [ ] Job quotidien de vérification des gardes
- [ ] Email envoyé quand un vin est prêt
- [ ] Flag pour éviter les rappels multiples
- [ ] Notification in-app optionnelle

---

## Résumé Phase 6

| Ticket | Description | Effort | Statut |
|--------|-------------|--------|--------|
| 6.1 | Infrastructure email | Faible | [ ] |
| 6.2 | Invitation par email | Moyen | [ ] |
| 6.3 | Notifications feedback | Moyen | [ ] |
| 6.4 | Rappels de garde | Moyen | [ ] |

**Definition of Done Phase 6 :**
- [ ] Emails configurés et fonctionnels
- [ ] Le caviste peut inviter un client par email
- [ ] Le caviste reçoit un digest des feedbacks
- [ ] Le client reçoit un rappel quand son vin est prêt

# Phase 8 : Production & Infrastructure

> Durée estimée : 1-2 semaines
> Objectif : Préparer l'application pour la production

---

## Vue d'ensemble

Cette phase couvre tout ce qui est nécessaire pour passer en production :
- Déploiement
- CI/CD
- Monitoring
- Sécurité
- Performance

---

## Tickets

### TICKET-8.1 : Configuration des environnements

**Priorité :** P0
**Statut :** [ ] À faire
**Effort :** Faible

#### Description
Configurer les environnements de développement, staging et production.

#### Environnements
| Env | URL API | URL App | Base de données |
|-----|---------|---------|-----------------|
| dev | localhost:3333 | localhost:3000 | local |
| staging | api.staging.cuvee.app | staging.cuvee.app | Neon (staging) |
| prod | api.cuvee.app | cuvee.app | Neon (prod) |

#### Variables d'environnement
```bash
# .env.example
NODE_ENV=development

# API
PORT=3333
HOST=0.0.0.0
APP_KEY=<random-32-chars>

# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=<random-64-chars>
AUTH_COOKIE_NAME=mpc_token

# Storage
S3_BUCKET=
S3_REGION=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# Email (Phase 6)
RESEND_API_KEY=

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3333
API_URL=http://localhost:3333
```

#### Fichiers à créer
```
packages/api/.env.example
packages/api/.env.staging
packages/api/.env.production

packages/app/.env.example
packages/app/.env.staging
packages/app/.env.production
```

#### Critères d'acceptation
- [ ] .env.example documenté pour chaque package
- [ ] Variables séparées par environnement
- [ ] Secrets gérés via le provider (Vercel, Railway, etc.)

---

### TICKET-8.2 : Déploiement API

**Priorité :** P0
**Statut :** [ ] À faire
**Effort :** Moyen

#### Description
Déployer l'API AdonisJS en production.

#### Options de déploiement

**Option 1 : Railway (recommandé)**
- Simple, supporte Node.js
- Connexion Neon intégrée
- ~5$/mois pour commencer

**Option 2 : Render**
- Free tier disponible
- Auto-deploy depuis GitHub

**Option 3 : VPS (Hetzner, DigitalOcean)**
- Plus de contrôle
- Plus complexe à maintenir

#### Configuration Railway
```yaml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "node build/bin/server.js"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

#### Endpoint de santé
```typescript
// start/routes.ts
router.get('/health', async ({ response }) => {
  return response.ok({ status: 'ok', timestamp: new Date().toISOString() })
})
```

#### Migrations en production
```bash
# Commande à exécuter au déploiement
node ace migration:run --force
```

#### Critères d'acceptation
- [ ] API déployée et accessible
- [ ] Endpoint /health fonctionnel
- [ ] Migrations automatiques au déploiement
- [ ] Logs accessibles
- [ ] Variables d'environnement configurées

---

### TICKET-8.3 : Déploiement Frontend

**Priorité :** P0
**Statut :** [ ] À faire
**Effort :** Faible

#### Description
Déployer le frontend Next.js en production.

#### Déploiement Vercel (recommandé)
1. Connecter le repo GitHub
2. Configurer les variables d'environnement
3. Définir le root directory : `packages/app`
4. Deploy

#### Configuration Vercel
```json
// packages/app/vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

#### Variables d'environnement Vercel
```
NEXT_PUBLIC_API_URL=https://api.cuvee.app
API_URL=https://api.cuvee.app
AUTH_COOKIE_NAME=mpc_token
```

#### Domaine personnalisé
1. Ajouter le domaine dans Vercel
2. Configurer les DNS
3. SSL automatique

#### Critères d'acceptation
- [ ] Frontend déployé sur Vercel
- [ ] Domaine personnalisé configuré
- [ ] HTTPS fonctionnel
- [ ] Variables d'environnement configurées

---

### TICKET-8.4 : CI/CD

**Priorité :** P1
**Statut :** [ ] À faire
**Effort :** Moyen

#### Description
Mettre en place l'intégration et le déploiement continus.

#### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  test-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: cd packages/api && pnpm test
    # Ajouter les tests quand ils existent

  build-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: cd packages/api && pnpm build

  build-app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: cd packages/app && pnpm build
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Déclencher le déploiement Railway via webhook
      - name: Deploy to Railway
        run: |
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}

  # Vercel déploie automatiquement via GitHub integration
```

#### Critères d'acceptation
- [ ] CI exécuté sur chaque PR
- [ ] Lint + Build vérifiés
- [ ] Déploiement auto sur main
- [ ] Notifications Slack/Discord (optionnel)

---

### TICKET-8.5 : Monitoring & Logs

**Priorité :** P1
**Statut :** [ ] À faire
**Effort :** Moyen

#### Description
Mettre en place le monitoring et la centralisation des logs.

#### Options

**Logs**
- **Axiom** (recommandé, gratuit jusqu'à 500MB/mois)
- **Logtail**
- **Papertrail**

**Monitoring**
- **Sentry** (erreurs, recommandé)
- **Better Uptime** (uptime monitoring)
- **Checkly** (synthetic monitoring)

#### Configuration Sentry

```typescript
// packages/api/config/sentry.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: env.get('SENTRY_DSN'),
  environment: env.get('NODE_ENV'),
  tracesSampleRate: 0.1,
})
```

```typescript
// packages/app/sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
})
```

#### Dashboard de monitoring
- Uptime API
- Temps de réponse moyen
- Taux d'erreur
- Nombre d'utilisateurs actifs

#### Critères d'acceptation
- [ ] Sentry configuré (API + Frontend)
- [ ] Logs centralisés
- [ ] Alertes configurées (downtime, erreurs)
- [ ] Dashboard accessible

---

### TICKET-8.6 : Sécurité

**Priorité :** P0
**Statut :** [ ] À faire
**Effort :** Moyen

#### Description
Audit de sécurité et mise en place des protections.

#### Checklist OWASP

**Injection**
- [x] Utilisation de l'ORM (pas de SQL brut)
- [ ] Validation des inputs (Vine)

**Authentification**
- [x] Hash bcrypt pour les mots de passe
- [ ] Rate limiting sur /auth/*
- [ ] Tokens avec expiration

**XSS**
- [x] React échappe par défaut
- [ ] CSP headers

**CSRF**
- [ ] Cookies SameSite=Strict
- [ ] Token CSRF pour les mutations

#### Rate Limiting

```typescript
// packages/api/start/kernel.ts
import { limiter } from '@adonisjs/limiter'

export const middleware = {
  // ...
  throttle: () => limiter.define('global', () => {
    return limiter.allowRequests(100).every('1 minute')
  }),
}

// Appliquer sur les routes sensibles
router.post('auth/login', [AuthController, 'login'])
  .use(middleware.throttle())
```

#### Headers de sécurité

```typescript
// packages/api/start/kernel.ts
server.use([
  async ({ response }, next) => {
    response.header('X-Content-Type-Options', 'nosniff')
    response.header('X-Frame-Options', 'DENY')
    response.header('X-XSS-Protection', '1; mode=block')
    response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    await next()
  },
])
```

#### RGPD
- [ ] Politique de confidentialité
- [ ] Consentement cookies (si analytics)
- [ ] Export des données utilisateur
- [ ] Suppression de compte

#### Critères d'acceptation
- [ ] Rate limiting sur les routes sensibles
- [ ] Headers de sécurité configurés
- [ ] Audit des dépendances (npm audit)
- [ ] Page de politique de confidentialité
- [ ] Fonctionnalité de suppression de compte

---

### TICKET-8.7 : Performance

**Priorité :** P2
**Statut :** [ ] À faire
**Effort :** Moyen

#### Description
Optimisations de performance pour une bonne expérience utilisateur.

#### Frontend

**Images**
- [x] next/image pour l'optimisation automatique
- [ ] CDN pour les images uploadées (Cloudflare R2 + CDN)
- [ ] Placeholder blur pour les images

**Bundles**
- [ ] Analyser avec `@next/bundle-analyzer`
- [ ] Code splitting automatique (Next.js)
- [ ] Lazy loading des composants lourds

**Cache**
- [ ] ISR pour les pages statiques
- [ ] Cache API avec `cache: 'force-cache'` où possible

#### Backend

**Database**
- [ ] Index sur les colonnes fréquemment requêtées
- [ ] Pagination sur toutes les listes
- [ ] Eager loading (preload) pour éviter N+1

**Cache**
- [ ] Redis pour le cache applicatif (optionnel V2)
- [ ] Cache des requêtes fréquentes

#### Index recommandés
```sql
-- Déjà créés dans les migrations
CREATE INDEX idx_subscriptions_merchant ON subscriptions(merchant_id);
CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_wines_merchant ON wines(merchant_id);
CREATE INDEX idx_boxes_subscription ON boxes(subscription_id);
CREATE INDEX idx_client_wines_client ON client_wines(client_id);

-- À ajouter si nécessaire
CREATE INDEX idx_client_wines_rating ON client_wines(rating) WHERE rating IS NOT NULL;
CREATE INDEX idx_client_wines_wants_reorder ON client_wines(wants_reorder) WHERE wants_reorder = true;
```

#### Critères d'acceptation
- [ ] Lighthouse score > 90 sur mobile
- [ ] Temps de chargement < 3s
- [ ] Pas de N+1 queries
- [ ] Images optimisées

---

## Résumé Phase 8

| Ticket | Description | Priorité | Statut |
|--------|-------------|----------|--------|
| 8.1 | Configuration environnements | P0 | [ ] |
| 8.2 | Déploiement API | P0 | [ ] |
| 8.3 | Déploiement Frontend | P0 | [ ] |
| 8.4 | CI/CD | P1 | [ ] |
| 8.5 | Monitoring & Logs | P1 | [ ] |
| 8.6 | Sécurité | P0 | [ ] |
| 8.7 | Performance | P2 | [ ] |

**Definition of Done Phase 8 :**
- [ ] Application déployée en production
- [ ] CI/CD fonctionnel
- [ ] Monitoring et alertes en place
- [ ] Audit de sécurité passé
- [ ] Performance acceptable (Lighthouse > 90)

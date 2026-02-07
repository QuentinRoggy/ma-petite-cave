1) Contexte & objectif

Je veux une mini-app personnelle pour gérer mes vins.

Objectif principal : capturer rapidement une bouteille (photo + infos), enregistrer les notes du caviste, puis ajouter mon ressenti + une note pour retrouver facilement ce que j’ai aimé / pas aimé.

Stack imposée :

Backend : AdonisJS 6 (API)

Frontend : Next.js (App Router)

DB : Postgres hébergée sur Neon

Stockage images : service compatible S3 (au choix : S3 / Cloudflare R2 / Supabase Storage), via URL persistée en DB.

Contraintes :

Usage mobile prioritaire (prise de photo).

Utilisateur unique au début (moi), mais on veut éviter de se bloquer si multi-user arrive plus tard.

2) MVP (périmètre strict)

Le MVP doit permettre en < 60 secondes :

prendre une photo (ou upload galerie),

saisir quelques infos,

enregistrer,

retrouver la bouteille plus tard via liste/recherche,

ajouter/modifier notes + notation.

2.1 Fonctionnalités MVP
Auth (simple)

Auth email + password (ou magic link si plus rapide).

Une seule catégorie d’utilisateur (owner).

Données liées à user_id (même si un seul user au début).

CRUD “Vin”

Créer un vin

Voir un vin

Modifier un vin

Supprimer un vin

Photo

1 photo minimum par vin (MVP).

Upload vers storage externe.

En DB : stocker photo_url (string).

Option post-MVP : multi-photos.

Champs MVP (minimalistes)

Pour aller vite : texte libre, pas de normalisation.

name : nom du vin / cuvée (string, requis)

domain : domaine/producteur (string, optionnel)

vintage : millésime (int, optionnel)

color : rouge/blanc/rosé/pétillant/… (enum optionnel)

merchant_notes : notes du caviste (text, optionnel)

personal_notes : mes notes (text, optionnel)

rating : note 0–5 (int, optionnel)

photo_url : url de la photo (string, requis)

created_at/updated_at auto

Liste + recherche

Page liste (cards avec photo, name, domain, vintage, rating)

Recherche simple query (au moins sur name + domain + notes)

Filtres rapides :

“Notés” / “Non notés”

Optionnel : filtre couleur

3) Hors MVP (à NE PAS FAIRE en V1)

OCR / scan étiquette / IA d’extraction automatique

Gestion de stock (quantités, entrées/sorties)

Appellation/référentiels complexes

Partage/social

Offline sync, PWA avancée

Export PDF/CSV

4) Post-MVP (roadmap courte, priorisée)
V1.1 (faible effort, gros gain)

Tags (ex : “à racheter”, “cadeau”, “BBQ”)

Multi-photos (étiquette + dos)

Champs optionnels : price, store (où acheté), grapes (si envie)

V1.2 (cave/stock)

bottles_count

statut : to_drink | drunk | gifted

dates : purchased_at, tasted_at, “à boire avant”

V1.3 (capture assistée)

OCR semi-auto

suggestions de champs à partir de la photo

dédoublonnage (même cuvée/millésime)

5) Modèle de données (MVP)
Tables
users

id (uuid)

email (unique)

password_hash

timestamps

wines

id (uuid)

user_id (fk users)

name (varchar, not null)

domain (varchar, null)

vintage (int, null)

color (varchar/enum, null)

merchant_notes (text, null)

personal_notes (text, null)

rating (smallint, null, check 0..5)

photo_url (text, not null)

timestamps

index sur (user_id, created_at)

index full text optionnel (ou trigram) sur name/domain/notes si besoin

6) API (REST) – MVP

Auth :

POST /auth/register (optionnel si tu seeds un user)

POST /auth/login

POST /auth/logout

GET /me

Wines :

GET /wines?query=&rated=true|false&color=

POST /wines (métadonnées + photo_url OU upload séparé)

GET /wines/:id

PATCH /wines/:id

DELETE /wines/:id

Upload photo (recommandé séparé) :

POST /uploads/wine-photo → retourne { photo_url }

7) UI Next.js (App Router) – MVP

Pages :

/login

/wines (liste + recherche + filtres)

/wines/new (création rapide, mobile-first)

/wines/[id] (détail + edit)
Composants essentiels :

WineCard

WineForm (create/edit)

RatingStars (0–5)

PhotoUploader (caméra/galerie)

8) Critères d’acceptation (Definition of Done)

Je peux ajouter un vin avec photo + nom en moins d’1 minute sur mobile.

Je peux retrouver un vin via la liste/recherche.

Je peux enregistrer et modifier : notes caviste, notes perso, rating.

Les images sont stockées hors DB, et l’URL est persistée en DB.

Sécurité minimum : endpoints protégés par auth, données filtrées par user_id.

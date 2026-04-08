# 🚀 PROJET : ZFlix — Plateforme de gestion d'abonnements Jellyfin
# VERSION 3 — Déploiement VPS Hetzner (Docker + CI/CD + SSL + Backups)

Tu es un développeur senior fullstack et DevOps. Tu vas créer un projet Next.js 14 complet, fonctionnel, prêt à déployer sur un VPS Hetzner via Docker Compose avec CI/CD GitHub Actions automatisé. Chaque fichier doit contenir du code complet et fonctionnel — AUCUN pseudocode, AUCUN TODO, AUCUN placeholder de code. Seuls les textes légaux (CGV, confidentialité) peuvent contenir du contenu placeholder à adapter.

---

## CONTEXTE PRODUIT

Site web de gestion d'abonnements pour un serveur Jellyfin hébergé en cloud. Les utilisateurs créent un compte, obtiennent 3 jours d'essai gratuit, puis souscrivent un abonnement payant via Stripe. Le compte Stripe n'est pas encore prêt : toutes les intégrations Stripe doivent être préparées mais désactivables via `STRIPE_ENABLED=false`.

Le site inclut un dashboard admin pour gérer les ~200 clients, un mode maintenance activable, un health check pour le monitoring, et est installable en PWA sur mobile.

**Hébergement :** VPS Hetzner (Ubuntu 22.04), déploiement Docker Compose, reverse proxy Caddy (SSL automatique Let's Encrypt), CI/CD GitHub Actions, backups PostgreSQL automatiques, cron système.

Cible : ~200 clients francophones, amateurs de streaming (films, séries, animés).
Langue du site : Français.

---

## STACK TECHNIQUE IMPOSÉE

### Application
- **Framework** : Next.js 14 (App Router uniquement, pas de Pages Router)
- **Langage** : TypeScript strict
- **Base de données** : PostgreSQL 16 (conteneur Docker) via Prisma ORM
- **Authentification** : JWT (jsonwebtoken) + bcryptjs — PAS NextAuth, PAS d'OAuth
- **Paiement** : Stripe (préparé mais conditionnel via env var)
- **Emails** : Resend (npm install resend) — SDK natif, templates en HTML
- **API Jellyfin** : appels REST directs côté serveur uniquement
- **Styles** : Tailwind CSS + CSS variables custom
- **Rate limiting** : implémentation simple en mémoire sur les routes auth
- **IDs uniques** : nanoid(8) pour les codes parrainage
- **PWA** : manifest.json + meta tags + service worker basique

### Infrastructure & Déploiement
- **Serveur** : VPS Hetzner CPX21 (3 vCPU, 4 Go RAM, 80 Go SSD) — Ubuntu 22.04
- **Conteneurisation** : Docker + Docker Compose v2
- **Reverse proxy + SSL** : Caddy v2 (SSL automatique Let's Encrypt, zero-config HTTPS)
- **CI/CD** : GitHub Actions (build → push image → deploy via SSH)
- **Registry** : GitHub Container Registry (ghcr.io) — gratuit avec GitHub
- **Cron** : cron système sur le VPS (pas de Vercel Cron)
- **Backups BDD** : script bash + cron → dump PostgreSQL quotidien → rotation 30 jours
- **Monitoring** : health check endpoint + UptimeRobot (ou BetterStack)
- **Logs** : Docker logs + journal systemd
- **Firewall** : UFW (ports 22, 80, 443 uniquement)

---

## 🖥️ GUIDE SETUP VPS HETZNER

### Recommandation serveur

Pour ~200 utilisateurs et un site Next.js + PostgreSQL :
- **Hetzner CPX21** : 3 vCPU AMD, 4 Go RAM, 80 Go SSD NVMe, 20 To trafic — ~7.50€/mois
- Datacenter : **Falkenstein (FSN1)** ou **Helsinki (HEL1)** pour la latence Europe
- OS : Ubuntu 22.04 LTS

Si le serveur Jellyfin est aussi chez Hetzner, prendre le même datacenter pour minimiser la latence entre l'app et Jellyfin.

### Étapes de configuration initiale du VPS

Le projet inclut un script `deploy/setup-server.sh` qui automatise tout. Voici ce qu'il fait :

```
1. Mise à jour système (apt update && apt upgrade)
2. Création utilisateur deploy (non-root, avec sudo)
3. Configuration SSH (désactiver login root, désactiver password auth, clé SSH uniquement)
4. Installation Docker Engine + Docker Compose v2
5. Installation Caddy v2
6. Configuration UFW (firewall) : autoriser 22, 80, 443 uniquement
7. Configuration fail2ban pour SSH
8. Création des répertoires :
   /opt/zflix/          → docker-compose.yml + .env
   /opt/zflix/backups/  → dumps PostgreSQL
   /opt/zflix/caddy/    → Caddyfile
9. Configuration du cron système (expirations + backups)
10. Configuration logrotate pour les logs Docker
```

**Ce script est à exécuter une seule fois manuellement sur le VPS après sa création.**

---

## DESIGN SYSTEM — THÈME SOMBRE PREMIUM

### Palette (CSS variables obligatoires dans globals.css) :

```css
:root {
  --accent: 189, 230, 251;         /* #BDE6FB */
  --accent-off: 111, 130, 138;     /* #6F828A */
  --dark: 30, 37, 41;              /* #1E2529 */
  --darkest: 23, 29, 32;           /* #171D20 */
  --dark-highlight: 59, 73, 77;    /* #3B494D */
  --dark-apparent: 32, 39, 42;     /* #20272A */
}
```

### Typographie :

- Titres : `Outfit` (Google Fonts) — weight 600/700
- Corps : `DM Sans` (Google Fonts) — weight 400/500
- Charger via `next/font/google`

### Tailwind config :

Étendre `tailwind.config.js` avec les couleurs custom mappées sur les CSS variables :

```js
colors: {
  accent: 'rgb(var(--accent) / <alpha-value>)',
  dark: 'rgb(var(--dark) / <alpha-value>)',
  darkest: 'rgb(var(--darkest) / <alpha-value>)',
  'dark-highlight': 'rgb(var(--dark-highlight) / <alpha-value>)',
  'dark-apparent': 'rgb(var(--dark-apparent) / <alpha-value>)',
  'accent-off': 'rgb(var(--accent-off) / <alpha-value>)',
}
```

### Composants UI :

- **Cards** : `bg-dark-apparent/80 border border-accent/10 rounded-xl backdrop-blur-md` + hover `translate-y-[-4px]` transition 200ms
- **Bouton primaire** : fond `#BDE6FB`, texte `#171D20`, font-weight 600, hover → `box-shadow: 0 0 20px rgba(189,230,251,0.4)`
- **Bouton secondaire** : outline accent, fond transparent
- **Inputs** : fond `#20272A`, border `accent/20`, focus → border `#BDE6FB` avec glow `0 0 10px rgba(189,230,251,0.15)`
- **Texte principal** : `#E8F4FA` — Texte secondaire : `#6F828A`
- **Badges** : fond `accent/15`, border `accent/30`, texte accent

### Effets visuels :

- Background principal `#171D20` avec subtle CSS noise texture (inline SVG data URI)
- Hero : radial gradient très subtil centré en haut, teinte `#BDE6FB` à 3-5% opacity
- Glassmorphism léger sur les cards (backdrop-blur-md)
- Subtle glow bleu sur éléments accent au hover
- Animations : fade-in au scroll (IntersectionObserver), hover states fluides, transitions 200-300ms
- Pas de layout générique — s'inspirer de l'esthétique des plateformes de streaming premium

### Responsive :

- Mobile-first obligatoire
- Breakpoints Tailwind standard (sm, md, lg, xl)
- Navigation mobile : menu drawer glissant depuis la droite avec backdrop sombre

---

## SCHÉMA PRISMA (prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  passwordHash          String
  jellyfinUserId        String?   @unique
  jellyfinUsername       String?   @unique
  subscriptionExpiresAt DateTime?
  isSubscribed          Boolean   @default(false)
  trialUsed             Boolean   @default(false)
  referralCode          String    @unique
  referredById          String?
  referredBy            User?     @relation("Referrals", fields: [referredById], references: [id])
  referrals             User[]    @relation("Referrals")
  emailVerified         Boolean   @default(false)
  emailVerifyToken      String?
  resetPasswordToken    String?
  resetPasswordExpires  DateTime?
  isAdmin               Boolean   @default(false)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  payments              Payment[]
}

model Payment {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  stripePaymentId String?
  amount          Int      // en centimes
  durationDays    Int
  status          String   // pending | success | failed
  createdAt       DateTime @default(now())
}

model ReferralReward {
  id           String   @id @default(cuid())
  referrerId   String
  referredId   String
  rewardDays   Int      @default(30)
  appliedAt    DateTime @default(now())
}

model AuditLog {
  id        String   @id @default(cuid())
  userId    String?  // null si action système (cron, etc.)
  action    String   // REGISTER | LOGIN | PASSWORD_CHANGE | SUBSCRIPTION_RENEW | SUBSCRIPTION_EXPIRE | REFERRAL_REWARD | PAYMENT_SUCCESS | PAYMENT_FAILED | ADMIN_EXTEND | JELLYFIN_ERROR
  details   String?  // JSON stringifié avec infos contextuelles
  ipAddress String?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

---

## VARIABLES D'ENVIRONNEMENT

### Fichier `.env.production` (sur le VPS dans /opt/zflix/.env)

```env
# === APPLICATION ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tondomaine.com
NEXT_PUBLIC_JELLYFIN_PUBLIC_URL=https://jellyfin.tondomaine.com
APP_NAME=ZFlix

# === JELLYFIN ===
JELLYFIN_URL=https://ton-serveur-jellyfin.com
JELLYFIN_API_KEY=ta_cle_api_jellyfin
JELLYFIN_FOLDER_FILMS=id_bibliotheque_films
JELLYFIN_FOLDER_SERIES=id_bibliotheque_series
JELLYFIN_FOLDER_ANIMES=id_bibliotheque_animes

# === BASE DE DONNÉES ===
# URL interne Docker (le conteneur postgres est accessible via le nom de service)
DATABASE_URL=postgresql://zflix:mot_de_passe_fort_genere@postgres:5432/zflix
# Credentials séparés pour docker-compose
POSTGRES_USER=zflix
POSTGRES_PASSWORD=mot_de_passe_fort_genere
POSTGRES_DB=zflix

# === JWT ===
JWT_SECRET=un_secret_tres_long_et_aleatoire_genere_avec_openssl
JWT_EXPIRES_IN=7d

# === RESEND (emails) ===
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tondomaine.com

# === STRIPE (désactivé) ===
STRIPE_ENABLED=false
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_1MONTH=price_xxx
STRIPE_PRICE_6MONTHS=price_xxx
STRIPE_PRICE_12MONTHS=price_xxx

# === CRON ===
CRON_SECRET=un_secret_pour_cron_genere_avec_openssl

# === ADMIN ===
ADMIN_EMAILS=admin@tondomaine.com

# === MAINTENANCE ===
MAINTENANCE_MODE=false
NEXT_PUBLIC_MAINTENANCE_MODE=false

# === HEALTH CHECK ===
HEALTH_CHECK_SECRET=un_secret_health_genere_avec_openssl

# === DOMAINE (utilisé par Caddy) ===
DOMAIN=tondomaine.com
```

### Fichier `.env.local` (développement local)

Même structure mais avec :
```env
DATABASE_URL=postgresql://zflix:password@localhost:5432/zflix
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## ARBORESCENCE COMPLÈTE

```
/
├── public/
│   ├── manifest.json
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   ├── icon-512x512.png
│   │   └── apple-touch-icon.png
│   └── sw.js
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx                          # Landing page
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── reset-password/page.tsx
│   ├── reset-password/[token]/page.tsx
│   ├── dashboard/page.tsx
│   ├── admin/page.tsx
│   ├── legal/
│   │   ├── cgv/page.tsx
│   │   └── privacy/page.tsx
│   ├── maintenance/page.tsx
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts
│       │   ├── login/route.ts
│       │   ├── logout/route.ts
│       │   └── me/route.ts
│       ├── user/
│       │   ├── change-password/route.ts
│       │   └── profile/route.ts
│       ├── subscription/
│       │   ├── renew/route.ts
│       │   └── status/route.ts
│       ├── stripe/
│       │   └── webhook/route.ts
│       ├── admin/
│       │   ├── users/route.ts
│       │   ├── extend/route.ts
│       │   └── audit/route.ts
│       ├── cron/
│       │   └── check-expirations/route.ts
│       └── health/route.ts
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── MaintenanceBanner.tsx
│   ├── home/
│   │   ├── HeroSection.tsx
│   │   ├── CatalogSection.tsx
│   │   ├── PricingSection.tsx
│   │   ├── ReferralSection.tsx
│   │   └── TutorialSection.tsx
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── dashboard/
│   │   ├── AccountInfo.tsx
│   │   ├── SubscriptionCard.tsx
│   │   ├── ChangePasswordForm.tsx
│   │   └── RenewalModal.tsx
│   ├── admin/
│   │   ├── UserTable.tsx
│   │   ├── UserRow.tsx
│   │   ├── ExtendModal.tsx
│   │   ├── StatsCards.tsx
│   │   └── AuditLogTable.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Card.tsx
│       ├── Badge.tsx
│       ├── Modal.tsx
│       └── Toast.tsx
│
├── lib/
│   ├── jellyfin.ts
│   ├── auth.ts
│   ├── email.ts
│   ├── stripe.ts
│   ├── referral.ts
│   ├── ratelimit.ts
│   ├── audit.ts
│   ├── admin.ts
│   └── db.ts
│
├── middleware.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                           # Données de test (dev local)
├── tailwind.config.js
├── next.config.js
│
├── ===== FICHIERS INFRASTRUCTURE (NOUVEAU) =====
│
├── Dockerfile                            # Build multi-stage Next.js optimisé
├── .dockerignore
├── docker-compose.yml                    # App Next.js + PostgreSQL 16
├── docker-compose.dev.yml                # Override pour le dev local
│
├── deploy/
│   ├── setup-server.sh                   # Script setup initial VPS (exécuté 1 fois)
│   ├── Caddyfile                         # Config reverse proxy + SSL
│   ├── backup-db.sh                      # Script backup PostgreSQL
│   ├── restore-db.sh                     # Script restauration backup
│   └── deploy.sh                         # Script de déploiement manuel (fallback)
│
├── .github/
│   └── workflows/
│       └── deploy.yml                    # CI/CD GitHub Actions
│
└── .env.local                            # Dev uniquement (gitignored)
```

---

## 🐳 INFRASTRUCTURE DOCKER

### Dockerfile (multi-stage, optimisé production)

```dockerfile
# ===== STAGE 1 : Dependencies =====
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production && cp -R node_modules /prod_deps
RUN npm ci

# ===== STAGE 2 : Build =====
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Build Next.js en mode standalone
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ===== STAGE 3 : Production =====
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copier les fichiers nécessaires uniquement
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**IMPORTANT dans next.config.js :**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // OBLIGATOIRE pour Docker
}
module.exports = nextConfig
```

### .dockerignore

```
node_modules
.next
.git
.github
deploy
*.md
.env*
!.env.production
```

### docker-compose.yml (production)

```yaml
version: '3.8'

services:
  # ===== APPLICATION NEXT.JS =====
  app:
    image: ghcr.io/${GITHUB_USERNAME}/zflix:latest
    # En fallback sans CI/CD : build: .
    container_name: zflix-app
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:3000"  # Exposé UNIQUEMENT sur localhost (Caddy fait le proxy)
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - zflix

  # ===== BASE DE DONNÉES POSTGRESQL =====
  postgres:
    image: postgres:16-alpine
    container_name: zflix-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"  # Accessible uniquement en local (pas depuis l'extérieur)
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - zflix

volumes:
  postgres_data:
    driver: local

networks:
  zflix:
    driver: bridge
```

### docker-compose.dev.yml (développement local)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: zflix-db-dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: zflix
      POSTGRES_PASSWORD: password
      POSTGRES_DB: zflix
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

volumes:
  postgres_dev_data:
    driver: local
```

Usage dev :
```bash
# Lancer la BDD en dev
docker compose -f docker-compose.dev.yml up -d

# Lancer l'app en dev (hors Docker)
npm run dev
```

---

## 🔒 REVERSE PROXY — CADDY (SSL AUTOMATIQUE)

### deploy/Caddyfile

```caddyfile
{
  email admin@tondomaine.com
}

tondomaine.com {
  reverse_proxy localhost:3000

  # Headers de sécurité
  header {
    X-Content-Type-Options "nosniff"
    X-Frame-Options "DENY"
    X-XSS-Protection "1; mode=block"
    Referrer-Policy "strict-origin-when-cross-origin"
    Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    -Server
  }

  # Compression
  encode gzip zstd

  # Logs
  log {
    output file /var/log/caddy/zflix.log {
      roll_size 10mb
      roll_keep 5
    }
  }
}

# Redirection www → non-www
www.tondomaine.com {
  redir https://tondomaine.com{uri} permanent
}
```

**Pourquoi Caddy plutôt que Nginx :**
- SSL Let's Encrypt automatique (zero config, renouvellement auto)
- Config 10x plus simple que Nginx
- HTTP/2 et HTTP/3 par défaut
- Pas besoin de certbot, pas de cron pour le renouvellement
- Parfait pour un projet de cette taille

**Installation Caddy sur le VPS :**
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

---

## 🚀 CI/CD — GITHUB ACTIONS

### .github/workflows/deploy.yml

```yaml
name: Build & Deploy ZFlix

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      # 1. Checkout du code
      - name: Checkout
        uses: actions/checkout@v4

      # 2. Login au GitHub Container Registry
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # 3. Metadata Docker (tags, labels)
      - name: Docker meta
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      # 4. Build et push de l'image Docker
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
          cache-to: type=inline

      # 5. Déploiement sur le VPS via SSH
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: deploy
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/zflix

            # Pull la nouvelle image
            docker compose pull app

            # Relancer avec zero downtime
            docker compose up -d app

            # Attendre que le healthcheck passe
            echo "Waiting for healthcheck..."
            for i in $(seq 1 30); do
              if docker inspect --format='{{.State.Health.Status}}' zflix-app 2>/dev/null | grep -q "healthy"; then
                echo "✅ App is healthy!"
                break
              fi
              echo "  Attempt $i/30..."
              sleep 5
            done

            # Exécuter les migrations Prisma
            docker compose exec -T app npx prisma migrate deploy

            # Nettoyer les vieilles images
            docker image prune -f

            echo "🚀 Deployment complete!"
```

### Secrets GitHub à configurer

Dans GitHub → Settings → Secrets and variables → Actions :

| Secret | Valeur |
|--------|--------|
| `VPS_HOST` | IP de ton VPS Hetzner (ex: `65.108.xxx.xxx`) |
| `VPS_SSH_KEY` | Clé SSH privée de l'utilisateur `deploy` (générer avec `ssh-keygen -t ed25519`) |

**Le `GITHUB_TOKEN` est automatiquement fourni par GitHub Actions** — pas besoin de le créer.

---

## 💾 BACKUPS POSTGRESQL

### deploy/backup-db.sh

```bash
#!/bin/bash
# Backup quotidien PostgreSQL — ZFlix
# Appelé par cron : 0 3 * * * /opt/zflix/deploy/backup-db.sh

set -euo pipefail

BACKUP_DIR="/opt/zflix/backups"
CONTAINER_NAME="zflix-db"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
FILENAME="zflix_backup_${DATE}.sql.gz"
RETENTION_DAYS=30

# Créer le répertoire si nécessaire
mkdir -p "$BACKUP_DIR"

# Dump compressé depuis le conteneur PostgreSQL
docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --format=plain --no-owner --no-privileges \
  | gzip > "${BACKUP_DIR}/${FILENAME}"

# Vérifier que le fichier n'est pas vide
if [ ! -s "${BACKUP_DIR}/${FILENAME}" ]; then
  echo "❌ ERREUR: Backup vide ou échoué!"
  rm -f "${BACKUP_DIR}/${FILENAME}"
  exit 1
fi

# Taille du backup
SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "✅ Backup créé : ${FILENAME} (${SIZE})"

# Rotation : supprimer les backups de plus de 30 jours
find "$BACKUP_DIR" -name "zflix_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "🧹 Nettoyage des backups > ${RETENTION_DAYS} jours"

# Afficher les backups restants
echo "📦 Backups disponibles :"
ls -lh "$BACKUP_DIR"/zflix_backup_*.sql.gz 2>/dev/null || echo "  (aucun)"
```

### deploy/restore-db.sh

```bash
#!/bin/bash
# Restauration d'un backup PostgreSQL — ZFlix
# Usage : ./restore-db.sh backups/zflix_backup_2025-01-15_03-00-00.sql.gz

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <chemin_vers_backup.sql.gz>"
  echo ""
  echo "Backups disponibles :"
  ls -lh /opt/zflix/backups/zflix_backup_*.sql.gz 2>/dev/null || echo "  Aucun backup trouvé"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="zflix-db"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Fichier non trouvé : $BACKUP_FILE"
  exit 1
fi

echo "⚠️  ATTENTION : Cette opération va ÉCRASER la base de données actuelle."
echo "   Backup à restaurer : $BACKUP_FILE"
read -p "   Continuer ? (oui/non) : " CONFIRM

if [ "$CONFIRM" != "oui" ]; then
  echo "Annulé."
  exit 0
fi

echo "🔄 Restauration en cours..."

# Arrêter l'app pendant la restauration
docker compose -f /opt/zflix/docker-compose.yml stop app

# Restaurer
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Relancer l'app
docker compose -f /opt/zflix/docker-compose.yml start app

echo "✅ Restauration terminée ! L'app a été redémarrée."
```

---

## 🖥️ SCRIPT SETUP SERVEUR

### deploy/setup-server.sh

```bash
#!/bin/bash
# ============================================================
# ZFlix — Setup initial du VPS Hetzner
# À exécuter UNE SEULE FOIS en tant que root sur un Ubuntu 22.04 frais
# Usage : ssh root@IP 'bash -s' < deploy/setup-server.sh
# ============================================================

set -euo pipefail

echo "=========================================="
echo "  ZFlix — Configuration du serveur"
echo "=========================================="

# --- Variables ---
DEPLOY_USER="deploy"
APP_DIR="/opt/zflix"
DOMAIN="${1:-tondomaine.com}"  # Passer le domaine en argument, sinon valeur par défaut

# --- 1. Mise à jour système ---
echo "📦 Mise à jour système..."
apt update && apt upgrade -y
apt install -y curl wget git ufw fail2ban htop nano

# --- 2. Créer utilisateur deploy ---
echo "👤 Création utilisateur deploy..."
if ! id "$DEPLOY_USER" &>/dev/null; then
  adduser --disabled-password --gecos "" "$DEPLOY_USER"
  usermod -aG sudo "$DEPLOY_USER"
  echo "$DEPLOY_USER ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/$DEPLOY_USER
fi

# Copier les clés SSH de root vers deploy
mkdir -p /home/$DEPLOY_USER/.ssh
cp /root/.ssh/authorized_keys /home/$DEPLOY_USER/.ssh/
chown -R $DEPLOY_USER:$DEPLOY_USER /home/$DEPLOY_USER/.ssh
chmod 700 /home/$DEPLOY_USER/.ssh
chmod 600 /home/$DEPLOY_USER/.ssh/authorized_keys

# --- 3. Sécuriser SSH ---
echo "🔒 Sécurisation SSH..."
sed -i 's/#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/#\?PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
systemctl restart sshd

# --- 4. Firewall UFW ---
echo "🔥 Configuration firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (Caddy redirect)
ufw allow 443/tcp   # HTTPS (Caddy)
ufw --force enable

# --- 5. Fail2ban ---
echo "🛡️ Configuration fail2ban..."
systemctl enable fail2ban
systemctl start fail2ban

# --- 6. Installer Docker ---
echo "🐳 Installation Docker..."
curl -fsSL https://get.docker.com | sh
usermod -aG docker $DEPLOY_USER

# --- 7. Installer Caddy ---
echo "🌐 Installation Caddy..."
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install -y caddy

# --- 8. Créer répertoires ---
echo "📁 Création structure de fichiers..."
mkdir -p $APP_DIR/backups
mkdir -p /var/log/caddy
chown -R $DEPLOY_USER:$DEPLOY_USER $APP_DIR

# --- 9. Cron jobs ---
echo "⏰ Configuration des crons..."
# Écrire les crons pour l'utilisateur deploy
CRON_CONTENT="
# ZFlix — Vérification des expirations (toutes les heures)
0 * * * * curl -s -H 'Authorization: Bearer CRON_SECRET_ICI' http://localhost:3000/api/cron/check-expirations >> /var/log/zflix-cron.log 2>&1

# ZFlix — Backup PostgreSQL (tous les jours à 3h)
0 3 * * * /opt/zflix/deploy/backup-db.sh >> /var/log/zflix-backup.log 2>&1
"
echo "$CRON_CONTENT" | crontab -u $DEPLOY_USER -

# --- 10. Logrotate ---
echo "📋 Configuration logrotate..."
cat > /etc/logrotate.d/zflix << 'EOF'
/var/log/zflix-*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
}
/var/log/caddy/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    postrotate
        systemctl reload caddy > /dev/null 2>&1 || true
    endscript
}
EOF

echo ""
echo "=========================================="
echo "  ✅ Setup terminé !"
echo "=========================================="
echo ""
echo "  Prochaines étapes :"
echo "  1. Se reconnecter en tant que 'deploy' : ssh deploy@IP"
echo "  2. Copier le fichier .env dans $APP_DIR/.env"
echo "  3. Copier le Caddyfile dans /etc/caddy/Caddyfile"
echo "  4. Mettre à jour le CRON_SECRET dans le crontab : crontab -e"
echo "  5. Relancer Caddy : sudo systemctl reload caddy"
echo "  6. Faire un premier déploiement via GitHub Actions ou manuellement"
echo "  7. Exécuter les migrations : docker compose exec app npx prisma migrate deploy"
echo ""
echo "  💡 DNS : Faire pointer $DOMAIN et www.$DOMAIN vers l'IP de ce serveur"
echo ""
```

---

## 📄 PAGES — SPÉCIFICATIONS DÉTAILLÉES

### 1. LANDING PAGE `/`

Sections dans cet ordre exact :

**A. Navbar (sticky)**
- Logo texte "ZFlix" à gauche (font Outfit, weight 700, accent color)
- Liens : Accueil, Catalogue, Tarifs, Parrainage, Tutoriels (smooth scroll vers les sections)
- Boutons : "Se connecter" (outline) + "Commencer" (primaire)
- `backdrop-blur-md` + `bg-darkest/80` au scroll
- Mobile : hamburger → drawer slide-in depuis la droite avec backdrop sombre

**B. Hero Section**
- Titre H1 : "Votre cinéma personnel. Partout." (Outfit 700, ~3.5rem desktop)
- Sous-titre : "Films, séries et animés en streaming HD. Sur tous vos appareils." (DM Sans, accent-off)
- 2 CTA : "Essai gratuit 3 jours" (primaire) + "Voir le catalogue" (secondaire)
- Background : radial gradient subtil `#BDE6FB` 3% opacity centré haut + noise texture
- Éléments décoratifs : formes géométriques SVG flottantes en accent/5 avec animation CSS lente

**C. Section Catalogue**
- Titre : "Un catalogue riche et varié"
- 3 cards côte à côte (responsive → empilées mobile) :
  - Films 🎬 — "1200+ films" — "Des blockbusters aux films d'auteur"
  - Séries 📺 — "500+ séries" — "Toutes les saisons, sans attente"
  - Animés ⛩️ — "800+ animés" — "VOSTFR et VF disponibles"
- Mention "Catalogue mis à jour chaque semaine"

**D. Section Tarifs**
- 3 cards pricing :
  - 1 mois : 4.99€/mois
  - 6 mois : 3.99€/mois — Badge "Populaire" (accent)
  - 12 mois : 2.99€/mois — Badge "Meilleure offre" (accent, glow)
- Features communes : Accès HD, Multi-appareils, Support prioritaire, Catalogue complet
- Mention "3 jours offerts à l'inscription"
- Si STRIPE_ENABLED=false → boutons grisés + texte "Paiement bientôt disponible"

**E. Section Parrainage**
- Titre : "Partagez, gagnez"
- 3 étapes visuelles numérotées avec icônes SVG :
  1. "Partagez votre code unique"
  2. "Votre ami s'inscrit"
  3. "Recevez 1 mois offert"
- Visuel connecting line entre les étapes

**F. Section Tutoriels**
- Tabs interactifs : Mobile / Smart TV / Navigateur
- Contenu par tab :
  - Mobile : Télécharger Jellyfin Mobile → Entrer URL serveur → Se connecter
  - Smart TV : Télécharger app Jellyfin pour votre TV → Configurer → Profiter
  - Navigateur : Aller sur `NEXT_PUBLIC_JELLYFIN_PUBLIC_URL` → Se connecter
- Afficher l'URL publique Jellyfin dans un bloc copiable

**G. Footer**
- Logo + "Votre cinéma personnel"
- Colonnes : Produit (Tarifs, Catalogue) / Aide (Tutoriels, Contact) / Légal (CGV, Confidentialité)
- Liens CGV → `/legal/cgv`, Confidentialité → `/legal/privacy`
- Icônes réseaux sociaux (liens vides `#`)
- © 2025 ZFlix

---

### 2. PAGES AUTH

**`/register`**
- Card centrée sur fond darkest
- Champs : Email, Mot de passe (min 8 car), Confirmation MDP, Code parrain (optionnel, pré-rempli si `?ref=` en query)
- Validation client en temps réel
- Si `MAINTENANCE_MODE=true` → formulaire désactivé + message "Inscriptions temporairement suspendues"
- Submit → POST /api/auth/register :
  1. Vérifier MAINTENANCE_MODE
  2. Valider inputs serveur
  3. Rate limit (5 req/IP/15min)
  4. Hash password bcryptjs (12 rounds)
  5. Créer user Prisma + générer referralCode via nanoid(8)
  6. Créer compte Jellyfin via API
  7. Appliquer profil abonné Jellyfin (trial 3 jours)
  8. Set subscriptionExpiresAt = now + 3j, isSubscribed = true, trialUsed = true
  9. Si code parrain valide → set referredById
  10. Envoyer email bienvenue via Resend
  11. AuditLog action=REGISTER
  12. JWT → cookie httpOnly secure sameSite lax
  13. Retourner 201 + redirect /dashboard

**`/login`**
- Card centrée, mêmes principes
- Si `MAINTENANCE_MODE=true` → désactivé
- AuditLog action=LOGIN

**`/reset-password` et `/reset-password/[token]`**
- Flow complet avec token nanoid(32), hash stocké, expire 1h
- AuditLog action=PASSWORD_CHANGE

---

### 3. DASHBOARD `/dashboard` (protégé par middleware)

4 onglets : Mon compte, Renouveler, Sécurité, Parrainage.
(Spécifications identiques à V2 — voir sections détaillées dans l'arborescence)

---

### 4. DASHBOARD ADMIN `/admin` (protégé par whitelist email)

Stats cards + Tableau utilisateurs (tri/filtre/recherche/pagination) + Modal extension + Journal d'audit.
(Spécifications identiques à V2)

---

### 5. PAGES LÉGALES `/legal/cgv` et `/legal/privacy`

CGV (11 articles) + Politique de confidentialité (11 sections) conformes droit français / RGPD.
(Spécifications identiques à V2)

---

### 6. PAGE MAINTENANCE `/maintenance`

Page standalone, pas de navbar/footer, logo centré + message.
(Spécifications identiques à V2)

---

## LOGIQUE BACKEND DÉTAILLÉE

### lib/jellyfin.ts
Mêmes fonctions que V2 : createJellyfinUser, deleteJellyfinUser, changeJellyfinPassword, applySubscribedProfile, applyUnsubscribedProfile, getJellyfinUser. Toutes les erreurs → AuditLog action=JELLYFIN_ERROR.

### lib/email.ts (Resend)
5 templates HTML aux couleurs du thème. **Fallback dev obligatoire** : si `RESEND_API_KEY` absent ou `NODE_ENV=development`, toutes les fonctions d'envoi doivent logger le contenu de l'email dans `console.log` au lieu d'appeler Resend, avec un format lisible (destinataire, sujet, extrait du contenu).

### lib/stripe.ts
Conditionnel via STRIPE_ENABLED. (Identique V2)

### lib/auth.ts
JWT helpers. Cookie `secure` conditionnel : `secure: process.env.NODE_ENV === 'production'` (false en dev HTTP localhost, true en prod HTTPS derrière Caddy).

### lib/audit.ts
Helper logAudit avec types d'actions. (Identique V2)

### lib/admin.ts
Vérification whitelist email. (Identique V2)

### lib/referral.ts
Logique parrainage +30j. (Identique V2)

### lib/ratelimit.ts
Rate limiting en mémoire. (Identique V2)

### Cron /api/cron/check-expirations
Protégé par Bearer token. Appelé par cron système du VPS (pas Vercel Cron).
Logique identique V2.

### /api/health
Vérifications BDD + Jellyfin + Resend + Stripe.
Retourne JSON compatible UptimeRobot/BetterStack.
(Identique V2)

---

## MIDDLEWARE — middleware.ts

Logique identique V2 :
1. Mode maintenance → redirect sauf /maintenance, /api/health, assets statiques, /admin (si admin)
2. Protection /dashboard → JWT requis
3. Protection /admin → JWT + email dans ADMIN_EMAILS
4. Sinon → laisser passer

---

## PWA — Configuration

manifest.json, sw.js, meta tags, icônes.
(Identique V2)

---

## DÉPENDANCES

```bash
npx create-next-app@14 zflix --typescript --tailwind --app --src-dir=false
cd zflix
npm install prisma @prisma/client jsonwebtoken bcryptjs resend stripe nanoid@3
npm install -D @types/jsonwebtoken @types/bcryptjs ts-node
npx prisma init
```

---

## 🧪 DÉVELOPPEMENT LOCAL — GUIDE COMPLET

Le développement se fait en mode classique : PostgreSQL tourne dans Docker, l'app Next.js tourne nativement avec `npm run dev` (hot reload, fast refresh, debugging VS Code). Pas besoin de rebuild Docker à chaque modif.

### Prérequis

- Node.js 20+ installé (recommandé : via nvm)
- Docker Desktop installé et lancé
- VS Code (ou éditeur au choix)
- Git

### Étape 1 — Cloner et installer

```bash
git clone https://github.com/ton-username/zflix.git
cd zflix
npm install
```

### Étape 2 — Lancer PostgreSQL en local via Docker

```bash
docker compose -f docker-compose.dev.yml up -d
```

Cela lance un conteneur PostgreSQL 16 sur `localhost:5432` avec :
- User : `zflix`
- Password : `password`
- Database : `zflix`

Vérifier que ça tourne :
```bash
docker ps
# Tu dois voir "zflix-db-dev" avec status "Up"
```

### Étape 3 — Configurer les variables d'environnement

Créer le fichier `.env.local` à la racine du projet :

```env
# Base de données locale
DATABASE_URL=postgresql://zflix:password@localhost:5432/zflix

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_JELLYFIN_PUBLIC_URL=https://jellyfin.tondomaine.com
APP_NAME=ZFlix

# Jellyfin (mettre tes vraies valeurs pour tester, ou des faux pour le dev UI)
JELLYFIN_URL=https://ton-serveur-jellyfin.com
JELLYFIN_API_KEY=ta_cle_api
JELLYFIN_FOLDER_FILMS=id_films
JELLYFIN_FOLDER_SERIES=id_series
JELLYFIN_FOLDER_ANIMES=id_animes

# JWT
JWT_SECRET=dev_secret_pas_important_en_local
JWT_EXPIRES_IN=7d

# Resend (optionnel en dev — les emails s'affichent dans la console si clé absente)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@tondomaine.com

# Stripe (désactivé)
STRIPE_ENABLED=false
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_1MONTH=price_xxx
STRIPE_PRICE_6MONTHS=price_xxx
STRIPE_PRICE_12MONTHS=price_xxx

# Cron
CRON_SECRET=dev_cron_secret

# Admin
ADMIN_EMAILS=admin@tondomaine.com

# Maintenance (false en dev)
MAINTENANCE_MODE=false
NEXT_PUBLIC_MAINTENANCE_MODE=false

# Health check
HEALTH_CHECK_SECRET=dev_health_secret
```

**IMPORTANT pour le dev local :**
- Le cookie JWT doit avoir `secure=false` en développement (HTTP, pas HTTPS). Le code dans `lib/auth.ts` doit détecter `NODE_ENV=development` et adapter :
  ```typescript
  secure: process.env.NODE_ENV === 'production'
  ```
- Si tu n'as pas de clé Resend, implémenter un fallback dans `lib/email.ts` qui log le contenu de l'email dans la console au lieu de l'envoyer :
  ```typescript
  if (!process.env.RESEND_API_KEY || process.env.NODE_ENV === 'development') {
    console.log('📧 [DEV] Email qui aurait été envoyé :', { to, subject, html })
    return
  }
  ```
- Si tu n'as pas encore de serveur Jellyfin pour les tests, le code doit ne pas crasher : toutes les fonctions `lib/jellyfin.ts` doivent catch les erreurs réseau et logger un warning.

### Étape 4 — Initialiser la base de données

```bash
# Générer le client Prisma
npx prisma generate

# Pousser le schéma vers la BDD locale (crée les tables)
npx prisma db push

# (Optionnel) Ouvrir Prisma Studio pour visualiser les données
npx prisma studio
# → Ouvre http://localhost:5555 dans le navigateur
```

### Étape 5 — Lancer l'app en développement

```bash
npm run dev
```

L'app est accessible sur **http://localhost:3000**.

Hot reload actif : chaque modification de fichier se reflète instantanément dans le navigateur.

### Étape 6 — Tester les features

**Test inscription :**
1. Aller sur http://localhost:3000/register
2. Créer un compte avec un email test
3. Vérifier dans Prisma Studio (`npx prisma studio`) que l'utilisateur est créé
4. Vérifier dans la console du terminal que l'email de bienvenue est loggé (mode dev)

**Test dashboard :**
1. Se connecter sur http://localhost:3000/login
2. Vérifier que le dashboard affiche les bonnes infos
3. Tester le changement de mot de passe

**Test admin :**
1. S'assurer que l'email du compte test est dans `ADMIN_EMAILS` du .env.local
2. Aller sur http://localhost:3000/admin
3. Vérifier le tableau des utilisateurs, les stats, le journal d'audit

**Test cron manuellement :**
```bash
curl -H "Authorization: Bearer dev_cron_secret" http://localhost:3000/api/cron/check-expirations
```

**Test health check :**
```bash
# Sans détail
curl http://localhost:3000/api/health

# Avec détail
curl -H "Authorization: Bearer dev_health_secret" http://localhost:3000/api/health
```

**Test mode maintenance :**
1. Changer `MAINTENANCE_MODE=true` et `NEXT_PUBLIC_MAINTENANCE_MODE=true` dans `.env.local`
2. Relancer `npm run dev`
3. Vérifier que toutes les pages redirigent vers `/maintenance` sauf `/admin` (si admin)

### Commandes utiles en dev

```bash
# Lancer la BDD
docker compose -f docker-compose.dev.yml up -d

# Arrêter la BDD
docker compose -f docker-compose.dev.yml down

# Arrêter la BDD ET supprimer les données (reset complet)
docker compose -f docker-compose.dev.yml down -v

# Voir les logs de la BDD
docker logs zflix-db-dev

# Reset complet de la BDD (supprime toutes les tables et recrée)
npx prisma db push --force-reset

# Visualiser les données
npx prisma studio

# Lancer l'app
npm run dev

# Lint
npm run lint

# Build de test (vérifie que ça compile sans erreur avant de push)
npm run build
```

### Structure des scripts package.json

S'assurer que `package.json` contient ces scripts :

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "postinstall": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:reset": "prisma db push --force-reset",
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

### (Optionnel) Script de seed pour données de test

Créer un fichier `prisma/seed.ts` qui insère des données de test :

```typescript
// Ce script crée :
// - 1 utilisateur admin (email = celui dans ADMIN_EMAILS)
// - 5 utilisateurs test avec différents statuts (abonné, expiré, trial)
// - Quelques entrées AuditLog
// - Quelques Payment de test
// - Quelques ReferralReward de test
//
// Usage : npx ts-node prisma/seed.ts
// Ou via : npm run db:seed (après avoir ajouté ts-node en devDependency)
```

Ajouter `ts-node` en devDependency :
```bash
npm install -D ts-node
```

### Workflow de dev typique

```
1. docker compose -f docker-compose.dev.yml up -d    ← BDD
2. npm run dev                                         ← App
3. Coder, tester dans le navigateur (hot reload)
4. npx prisma studio                                   ← Voir les données si besoin
5. npm run build                                       ← Vérifier le build avant de push
6. git add . && git commit && git push origin main     ← Déclenche le CI/CD auto
```

---

## ORDRE DE DÉVELOPPEMENT

### Phase 1 — Setup & Infrastructure
1. Setup projet + Tailwind config + CSS variables + fonts + PWA
2. Dockerfile + .dockerignore + docker-compose.yml + docker-compose.dev.yml
3. next.config.js avec `output: 'standalone'`
4. deploy/Caddyfile
5. deploy/setup-server.sh
6. deploy/backup-db.sh + deploy/restore-db.sh
7. .github/workflows/deploy.yml

### Phase 2 — Application Core
8. Composants UI réutilisables (Button, Input, Card, Badge, Modal, Toast)
9. Layout global + Navbar + Footer
10. lib/db.ts (singleton Prisma)
11. Schéma Prisma (avec AuditLog) + `npx prisma db push`
12. prisma/seed.ts (données de test : admin, users variés, payments, audit logs)
13. lib/audit.ts
14. lib/jellyfin.ts
15. lib/auth.ts + lib/admin.ts + lib/ratelimit.ts
16. middleware.ts
17. Page maintenance

### Phase 3 — Auth & Dashboard
18. API auth (register, login, logout, me) — avec AuditLog
19. Pages login + register
20. lib/email.ts + templates Resend (avec fallback console.log en dev)
21. Dashboard complet (4 onglets)
22. API user (change-password, profile)
23. API subscription (status, renew)

### Phase 4 — Features avancées
24. Cron check-expirations + AuditLog
25. Landing page complète
26. lib/referral.ts + logique parrainage
27. lib/stripe.ts + webhook (préparé, désactivé)
28. Reset password (pages + API)
29. Pages légales (CGV + Confidentialité)
30. Dashboard admin (page + composants + API routes)
31. Health check `/api/health`

### Phase 5 — Déploiement
32. Premier déploiement : setup VPS, DNS, Caddy, docker compose up
33. `docker compose exec app npx prisma migrate deploy`
34. Vérifier health check, crons, backups
35. Test complet de tous les flows en production

---

## ✅ CHECKLIST PREMIER DÉPLOIEMENT

```
□ VPS Hetzner CPX21 créé (Ubuntu 22.04)
□ DNS : A record tondomaine.com → IP du VPS
□ DNS : A record www.tondomaine.com → IP du VPS
□ Clé SSH ajoutée au VPS
□ Script setup-server.sh exécuté
□ Fichier .env copié dans /opt/zflix/.env
□ Caddyfile copié dans /etc/caddy/Caddyfile + systemctl reload caddy
□ CRON_SECRET mis à jour dans crontab (crontab -e)
□ Repo GitHub créé + secrets configurés (VPS_HOST, VPS_SSH_KEY)
□ Premier push sur main → GitHub Actions build + deploy
□ Migration Prisma exécutée
□ Health check OK : curl https://tondomaine.com/api/health
□ SSL vérifié (cadenas vert)
□ Inscription test fonctionnelle
□ Backup test : /opt/zflix/deploy/backup-db.sh
□ Monitoring configuré (UptimeRobot sur /api/health)
```

---

## CONTRAINTES NON NÉGOCIABLES

- Ne JAMAIS stocker de mot de passe Jellyfin en BDD
- Toutes les erreurs Jellyfin API catchées, loggées + AuditLog, message générique côté client
- Rate limiting sur register + login (5 req/IP/15min)
- Validation stricte côté serveur sur TOUS les inputs
- Cookie JWT : httpOnly=true, secure=`process.env.NODE_ENV === 'production'` (false en dev local HTTP, true en prod derrière Caddy HTTPS), sameSite='lax'
- Code parrainage : nanoid(8), unique (retry si collision)
- Aucun TODO, aucun placeholder de code — code complet partout
- Les emails doivent avoir un fallback console.log si RESEND_API_KEY absent ou NODE_ENV=development
- Le seed Prisma (`prisma/seed.ts`) doit être fonctionnel avec des données de test réalistes
- TypeScript strict (pas de `any`)
- Imports propres avec alias `@/`
- `output: 'standalone'` obligatoire dans next.config.js pour Docker
- Ports Docker exposés UNIQUEMENT sur 127.0.0.1 (jamais sur 0.0.0.0)
- PostgreSQL JAMAIS accessible depuis l'extérieur
- Backups testés et fonctionnels AVANT la mise en production
- Les scripts deploy/ doivent être exécutables (`chmod +x`)
- Le CI/CD ne doit JAMAIS contenir de secrets en clair (tout dans GitHub Secrets)

---

## QUALITÉ ATTENDUE

- Code production-ready
- UI premium, pas de template générique
- UX fluide avec feedback visuel (loading states, toasts, transitions)
- SEO : meta tags, Open Graph, titre/description par page, structure sémantique
- Accessibilité : labels, aria, focus visible, contraste
- Performance : composants serveur par défaut, 'use client' uniquement si nécessaire
- PWA installable sur mobile
- Infrastructure Docker propre, sécurisée, reproductible
- CI/CD automatisé : push sur main → déploiement en production
- SSL automatique via Caddy (Let's Encrypt)
- Backups PostgreSQL quotidiens avec rotation 30 jours
- Monitoring via health check + service externe
- Zero downtime deployments via healthcheck Docker
- Dashboard admin fonctionnel pour gérer 200 clients
- Système d'audit complet

Génère TOUS les fichiers dans l'ordre de développement. Code complet uniquement.

# Society/Community Portal
## Deployment Guide (Vercel Free Tier)

---

## What's Built

A full-stack complaint & issue tracker for **Society Portal** with:
- **4 wings (A, B, C, D, E)** × **50 flats each**
- **8 categories**: Plumbing, Electrical, Elevator, Parking, Housekeeping, Common Areas, Security, Structural
- **Resident portal**: Submit complaints with photos/video, track status
- **Admin panel**: Update status, assign issues, manage categories & users
- **Dashboard**: KPI cards, status donut chart, category bar chart, 30-day trend line
- **Role-based access**: Admin vs Resident with middleware protection

---

## Step 1 — Local Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
```

---

## Step 2 — Create Your Vercel Project

1. Push this folder to a **GitHub repository** (new repo)
2. Go to [vercel.com/new](https://vercel.com/new)
3. Click **"Import Git Repository"** and select your repo
4. Framework preset: **Next.js** (auto-detected)
5. Click **Deploy** (will fail — that's expected until we add the DB)

---

## Step 3 — Add Vercel Postgres (Database)

1. In Vercel dashboard → your project → **Storage** tab
2. Click **"Create Database"** → choose **Postgres**
3. Name it `society-portal-db` → click **Create & Continue**
4. Click **"Connect"** to link it to your project
5. Vercel auto-populates these env vars:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`

---

## Step 4 — Add Vercel Blob (File Storage)

1. In Vercel dashboard → **Storage** tab
2. Click **"Create Database"** → choose **Blob**
3. Name it `society-portal-uploads` → click **Create**
4. Click **"Connect"** to link to your project
5. Vercel auto-populates `BLOB_READ_WRITE_TOKEN`

---

## Step 5 — Add Auth Secret

In Vercel dashboard → **Settings** → **Environment Variables**:

```
AUTH_SECRET = <generate with: openssl rand -base64 32>
```

---

## Step 6 — Run Database Migration

Install Vercel CLI and run migration against production:

```bash
npm i -g vercel
vercel login
vercel env pull .env.local       # Pull production env vars locally
npx prisma migrate deploy        # Apply schema to production DB
npx prisma db seed               # Seed admin user + categories
```

---

## Step 7 — Redeploy

```bash
vercel --prod
```

Or push a commit to GitHub — Vercel auto-deploys on every push.

---

## Step 8 — First Login

Visit your Vercel URL and log in with:

| Role     | Email                          | Password    |
|----------|-------------------------------|-------------|
| Admin    | admin@greenvalley.com         | admin123    |
| Resident | resident@greenvalley.com      | resident123 |

**⚠️ Change these passwords immediately after first login!**

---

## Local Development

```bash
# After pulling env vars:
npx prisma migrate dev    # Run migrations
npx prisma db seed        # Seed data
npm run dev               # Start dev server at localhost:3000
```

---

## Free Tier Limits (Vercel)

| Resource       | Your Usage (est.) | Free Limit | Headroom |
|----------------|------------------|-----------|---------|
| Postgres       | ~50 MB/year      | 256 MB    | ~5 years |
| Blob Storage   | ~200 MB/year     | 1 GB      | ~5 years |
| Bandwidth      | ~5 GB/month      | 100 GB    | 20×     |
| Functions      | ~10 GB-hrs/mo    | 100 GB-hrs | 10×    |

The app will run comfortably free for **years** at typical housing society usage.

---

## Customisation

- **App name/branding**: Edit `src/app/layout.tsx` title and `src/components/layout/sidebar.tsx`
- **Add wings**: Update `WINGS` constant in `src/lib/utils.ts`
- **Add categories**: Use the Admin → Categories page
- **Primary color**: Update `--primary` in `src/app/globals.css`
- **Add more flat numbers**: Update `FLAT_NUMBERS` in `src/lib/utils.ts`

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Database | Vercel Postgres (Neon) |
| ORM | Prisma |
| Auth | NextAuth.js v5 |
| File Storage | Vercel Blob |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Validation | Zod |

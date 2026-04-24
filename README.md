# Amber Meadows — Issue Tracker

A full-stack complaint and issue tracking web app for housing societies. Residents submit issues with photos and videos; the admin team tracks and resolves them through a status workflow.

---

## Features

- **Resident portal** — register, log complaints with photo/video attachments, track status
- **Admin dashboard** — charts by status, category, and wing; KPI cards; 30-day trend
- **Approval workflow** — new registrations require admin approval before the resident can sign in
- **Issue lifecycle** — Pending → In Progress → Completed / Rejected, with a full status history timeline
- **Media attachments** — up to 5 images and 1 video per issue, stored on Vercel Blob
- **Role-based access** — Admin and Resident roles; admin routes are protected by middleware
- **User management** — approve/reject registrations, promote to admin, activate/deactivate, reset passwords
- **Profile page** — residents can update their details and change their password

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Neon |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 (credentials, JWT) |
| File Storage | Vercel Blob |
| UI | Tailwind CSS + shadcn/ui (Radix UI) |
| Charts | Recharts |
| Validation | Zod |
| Hosting | Vercel free tier |

---

## Local Development

### Prerequisites

- Node.js 18+
- A PostgreSQL database (local install, or a free [Neon](https://neon.tech) account)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd amber-meadows-tracker
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Open `.env.local` and fill in:

```env
# Your Postgres connection string (pooled)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Your Postgres connection string (direct, no pooler)
DATABASE_URL_UNPOOLED=postgresql://user:password@host/dbname?sslmode=require

# Generate with: openssl rand -base64 32
AUTH_SECRET=your-random-secret-here

NEXTAUTH_URL=http://localhost:3000

# Leave blank for local dev — file uploads won't work without a real Blob token
BLOB_READ_WRITE_TOKEN=
```

> If you're using a local Postgres install, both `DATABASE_URL` and `DATABASE_URL_UNPOOLED` can be the same connection string.

### 3. Run database migrations

```bash
npx prisma migrate dev --name init
```

### 4. Seed the database

```bash
npm run db:seed
```

This creates the admin account and default complaint categories.

**Default admin credentials:**
| Field | Value |
|---|---|
| Email | `admin@ambermeadows.com` |
| Password | `AmberMeadows@2026` |

### 5. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
```

Create a new repo at [github.com/new](https://github.com/new) and push to it.

### 2. Import into Vercel

- Go to [vercel.com](https://vercel.com) → **Add New → Project**
- Select your GitHub repo → click **Import**
- Vercel auto-detects Next.js — leave all defaults as-is
- **Do not deploy yet** — add storage first

### 3. Add a Postgres database

- In your Vercel project, open the **Storage** tab → **Create Database**
- Choose **Neon** (under Marketplace integrations)
- Follow the prompts — Vercel automatically injects `DATABASE_URL` and `DATABASE_URL_UNPOOLED` as environment variables

### 4. Add Vercel Blob

- Still in the **Storage** tab → **Create Database** → choose **Blob**
- Set access to **Public**, give it a name, click **Create**
- Vercel automatically injects `BLOB_READ_WRITE_TOKEN`

### 5. Add remaining environment variables

Go to **Settings → Environment Variables** and add:

| Name | Value |
|---|---|
| `AUTH_SECRET` | Random 32-char string — generate at [generate-secret.vercel.app/32](https://generate-secret.vercel.app/32) |
| `NEXTAUTH_URL` | Your Vercel deployment URL, e.g. `https://amber-meadows-tracker.vercel.app` |

### 6. Deploy

Go to the **Deployments** tab and click **Redeploy**, or push a new commit to trigger a deployment. Vercel runs `prisma generate && next build` automatically.

### 7. Run migrations and seed on the live database

After the first successful deploy, run this from your local machine:

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Log in and link the project
vercel login
vercel link

# Pull production environment variables locally
vercel env pull .env.production.local

# Install dotenv-cli (if not already installed)
npm install -g dotenv-cli

# Run migrations against the live database
npx dotenv -e .env.production.local -- npx prisma migrate deploy

# Seed the admin account and categories
npx dotenv -e .env.production.local -- npm run db:seed
```

### 8. Sign in

Visit your deployment URL and log in with the admin credentials above.

---

## Project Structure

```
amber-meadows-tracker/
├── prisma/
│   ├── schema.prisma        # Database schema (User, Issue, Category, Attachment, StatusHistory)
│   └── seed.ts              # Seeds admin user and default categories
├── src/
│   ├── actions/             # Server actions (auth, issues, users, profile, dashboard, upload)
│   ├── app/
│   │   ├── (auth)/          # Login and register pages
│   │   ├── (main)/          # Protected app pages
│   │   │   ├── dashboard/   # KPI cards and charts
│   │   │   ├── issues/      # Issue list, new issue, detail, edit
│   │   │   ├── profile/     # Edit profile and change password
│   │   │   └── admin/
│   │   │       ├── users/   # User management and approval queue
│   │   │       └── categories/
│   │   └── api/             # API routes (auth, issues, admins, categories)
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Sidebar, header, mobile nav
│   │   ├── issues/          # Issue cards, filters, media upload, status badges
│   │   └── dashboard/       # Chart and KPI components
│   └── lib/
│       ├── auth.ts          # NextAuth.js configuration
│       ├── prisma.ts        # Prisma client singleton
│       ├── session.ts       # requireAuth / requireAdmin helpers
│       └── validators.ts    # Zod schemas
└── tsconfig.seed.json       # Separate tsconfig for running the seed script
```

## Useful Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run db:migrate` | Create and run a new Prisma migration |
| `npm run db:seed` | Seed the database with admin user and categories |
| `npm run db:studio` | Open Prisma Studio to browse the database |
| `npm run db:push` | Push schema changes without creating a migration (dev only) |

## Default Categories

The seed script creates these complaint categories out of the box:

- Plumbing
- Electrical
- Amenities
- Basement
- Common Areas
- Security
- Structural

Categories can be added, edited, or removed by an admin at **Admin → Categories**.

## Registration & Approval Flow

1. A new resident registers at `/register`
2. Their account is created with status **Pending**
3. They cannot sign in until an admin approves them
4. Admin approves or rejects from **Admin → Users → Pending Approvals**
5. Once approved, the resident can sign in normally

## Vercel Free Tier Limits

| Resource | Estimated usage | Free limit |
|---|---|---|
| Postgres (Neon) | ~50 MB/year | 512 MB |
| Blob storage | ~100 MB/year | 1 GB |
| Bandwidth | ~5 GB/month | 100 GB |
| Serverless functions | ~10 GB-hrs/month | 100 GB-hrs |

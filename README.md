# Amber Meadows — Community Portal

A full-stack community portal for housing societies. Residents submit society and villa-specific issues with photos and videos; the admin team tracks and resolves them through a status workflow. The portal also includes a shared service contacts directory and per-flat shared issue views for family members.

---

## Features

### Resident Portal
- **Registration & approval** — new residents register with their wing and flat number; accounts require admin approval before sign-in
- **Society issues** — raise complaints visible to all residents (common areas, amenities, etc.) with photo/video attachments, priority level, and category
- **Villa issues** — raise issues private to your flat; all family members registered under the same wing + flat number share the same view
- **Flat-shared access** — multiple family members can register under the same wing/flat; they see each other's villa issues but only the original creator can edit, delete, or resolve their own issue
- **Issue lifecycle** — track status from Pending → In Progress → Completed / Rejected with a full activity timeline
- **Media attachments** — up to 5 images and 1 video per issue, stored on Vercel Blob
- **Profile page** — update personal details and change password

### Admin Dashboard
- **Society dashboard** — KPI cards, status distribution chart, category breakdown, 30-day trend chart, and a recent issues list
- **Villa dashboard** — separate dashboard for villa-specific issues with KPI cards, status chart, trend chart, and per-wing breakdown; drill into any flat to see all its issues
- **Issue management** — view, filter, assign, update status, and add notes to all society and villa issues
- **User management** — approve/reject registrations, promote to admin, activate/deactivate accounts, reset passwords, view individual user profiles
- **Category management** — create and manage complaint categories used across society and villa issues
- **All villa issues view** — grouped list of all villas that have raised issues, filterable by wing and flat; admin can view any flat's full issue history

### Service Contacts Directory
- **Shared directory** — a community-wide contact book for service providers (plumbers, electricians, security, etc.)
- **Category-organised** — contacts are grouped into admin-defined categories (e.g. Maintenance, Emergency, Utilities)
- **Kanban view** — visualise contacts by category in a kanban-style board
- **Search & filter** — find contacts by name across all categories
- **Share contacts** — copy a contact's details or share via native share sheet
- **Admin controls** — add, edit, and delete contacts; manage contact categories

### Access Control
- **Role-based access** — Admin and Resident roles; admin routes are protected server-side
- **Flat-level scoping** — villa issues are visible to all users sharing the same wing + flat number
- **Ownership rules** — only the original creator (or an admin) can edit, delete, or resolve an issue

---

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
│   ├── schema.prisma        # Database schema (User, Issue, Category, Attachment, StatusHistory, Contact, ContactCategory)
│   └── seed.ts              # Seeds admin user and default categories
├── src/
│   ├── actions/             # Server actions (auth, issues, villa-issues, dashboard, villa-dashboard, contacts, users, profile)
│   ├── app/
│   │   ├── (auth)/          # Login and register pages
│   │   ├── (main)/          # Authenticated app shell
│   │   │   ├── dashboard/       # Society issues dashboard
│   │   │   ├── issues/          # Society issues list + detail + new + edit
│   │   │   ├── villa-issues/    # Villa issues list + detail + new + edit
│   │   │   ├── contacts/        # Service contacts directory + kanban view
│   │   │   ├── profile/         # Resident profile page
│   │   │   └── admin/
│   │   │       ├── users/           # User management
│   │   │       ├── categories/      # Issue category management
│   │   │       ├── villa-dashboard/ # Villa issues admin dashboard
│   │   │       ├── all-villa-issues/# All villas grouped view
│   │   │       └── contacts/        # Contact category management
│   │   └── api/             # API routes (villa issue detail, categories, uploads)
│   ├── components/          # Reusable UI components
│   └── lib/                 # Auth, Prisma client, validators, utilities
└── public/                  # Static assets
```

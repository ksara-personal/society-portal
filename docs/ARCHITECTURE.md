# Issue Tracker — Architecture & Implementation Plan

## Project Overview

A web-based issue tracker for a real estate housing society. Residents submit issues with images/videos under categories (basement, wing-wise issues, etc.). Admins manage, triage, and resolve them. A dashboard provides real-time visibility into issue status and trends.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 14 (App Router) | Full-stack React, SSR, API routes, Vercel-native |
| **Hosting** | Vercel (Free Tier) | Zero-config deploys, edge functions, generous free limits |
| **Database** | Vercel Postgres (Neon) | Managed Postgres, free tier: 256MB storage, 1GB transfer |
| **ORM** | Prisma | Type-safe queries, migrations, great DX |
| **Auth** | NextAuth.js v5 (Auth.js) | Credentials + OAuth, role-based access, session management |
| **File Storage** | Vercel Blob | Free tier: 250MB, simple put/get API, signed URLs |
| **UI** | Tailwind CSS + shadcn/ui | Modern, accessible components, no runtime cost |
| **Charts** | Recharts | Lightweight, React-native charting for dashboard |
| **Validation** | Zod | Runtime + TypeScript schema validation |
| **State** | React Server Components + SWR | Minimal client JS, smart caching |

---

## Vercel Free Tier Limits (What We're Working Within)

| Resource | Free Limit |
|----------|-----------|
| Deployments | Unlimited |
| Bandwidth | 100GB/month |
| Serverless Function Executions | 100GB-hrs/month |
| Vercel Postgres | 256MB storage, 60 compute hrs |
| Vercel Blob | 250MB storage (consider upgrading if heavy media use) |
| Build Time | 6000 min/month |

> **Note:** For production with heavy image/video uploads, consider upgrading to Vercel Pro ($20/mo) or offloading media to Cloudinary's free tier (25GB) as a future optimization.

> **Project Name:** `issue-tracker`

---

## Database Schema

```
┌──────────────────────┐       ┌──────────────────────┐
│       User           │       │     Category         │
├──────────────────────┤       ├──────────────────────┤
│ id          (uuid)   │       │ id          (uuid)   │
│ name        (string) │       │ name        (string) │
│ email       (string) │       │ slug        (string) │
│ password    (hash)   │       │ description (string) │
│ role        (enum)   │──┐    │ icon        (string) │
│ phone       (string) │  │    │ createdAt            │
│ wing        (string) │  │    └──────────┬───────────┘
│ flatNo      (string) │  │               │
│ createdAt            │  │               │
└──────────────────────┘  │               │
                          │               │
                    ┌─────┴───────────────┴──┐
                    │        Issue           │
                    ├────────────────────────┤
                    │ id           (uuid)    │
                    │ title        (string)  │
                    │ description  (text)    │
                    │ status       (enum)    │◄── PENDING | IN_PROGRESS | COMPLETED | REJECTED
                    │ priority     (enum)    │◄── LOW | MEDIUM | HIGH | URGENT
                    │ categoryId   (fk)      │
                    │ createdById  (fk)      │
                    │ assignedToId (fk)      │
                    │ wing         (string)  │
                    │ location     (string)  │
                    │ createdAt              │
                    │ updatedAt              │
                    │ resolvedAt             │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴────────────┐
                    │                        │
            ┌───────┴──────┐      ┌──────────┴─────┐
            │  Attachment  │      │  StatusHistory  │
            ├──────────────┤      ├────────────────┤
            │ id    (uuid) │      │ id      (uuid) │
            │ issueId      │      │ issueId        │
            │ url   (str)  │      │ fromStatus     │
            │ type  (enum) │      │ toStatus       │
            │ filename     │      │ changedById    │
            │ size  (int)  │      │ note    (text) │
            │ createdAt    │      │ createdAt      │
            └──────────────┘      └────────────────┘
```

---

## Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Next.js App Router                  │    │
│  │                                                  │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │    │
│  │  │ Dashboard │  │ Resident │  │ Admin Panel  │   │    │
│  │  │  (RSC)   │  │  Portal  │  │   (RSC)      │   │    │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │    │
│  │       │              │               │           │    │
│  │  ┌────┴──────────────┴───────────────┴───────┐   │    │
│  │  │          Server Actions / API Routes       │   │    │
│  │  │  • createIssue()                       │   │    │
│  │  │  • updateStatus()                          │   │    │
│  │  │  • uploadMedia()                           │   │    │
│  │  │  • getDashboardStats()                     │   │    │
│  │  └────────────────────┬──────────────────────┘   │    │
│  │                       │                          │    │
│  └───────────────────────┼──────────────────────────┘    │
│                          │                               │
│  ┌───────────┐  ┌────────┴────────┐  ┌───────────────┐  │
│  │ NextAuth  │  │ Prisma ORM      │  │ Vercel Blob   │  │
│  │ (Auth.js) │  │                 │  │ (Media Store) │  │
│  └───────────┘  └────────┬────────┘  └───────────────┘  │
│                          │                               │
│                 ┌────────┴────────┐                      │
│                 │ Vercel Postgres │                      │
│                 │   (Neon)        │                      │
│                 └─────────────────┘                      │
└─────────────────────────────────────────────────────────┘
```

---

## Page Structure & Routes

```
/                           → Landing / redirect to dashboard
/login                      → Login page
/register                   → Resident signup
/dashboard                  → Main dashboard (role-aware)
/issues                 → List all issues (filterable)
/issues/new             → Submit new issue (with media upload)
/issues/[id]            → Issue detail view
/issues/[id]/edit       → Edit issue
/admin/categories           → Manage categories (admin only)
/admin/users                → Manage users (admin only)
/profile                    → User profile & settings
```

---

## Feature Breakdown by Role

### Resident
- Register with name, email, wing, flat number
- Submit issues with title, description, category, priority, location
- Attach up to 5 images or 1 video per issue
- View own issues and their status history
- Filter own issues by status/category

### Admin
- Full dashboard with charts and KPIs
- View all issues across the society
- Change status (Pending → In Progress → Completed / Rejected)
- Assign issues to other admins
- Filter/search by status, category, wing, date range, priority
- Manage categories (CRUD)
- Manage users (promote to admin, deactivate)
- View status change history / audit trail

---

## Implementation Plan (Phased)

### Phase 1: Project Setup & Auth (Day 1-2)

1. Initialize Next.js 14 project with TypeScript
2. Configure Tailwind CSS + shadcn/ui
3. Set up Prisma with Vercel Postgres
4. Define database schema & run migrations
5. Implement NextAuth.js with credentials provider
6. Build login & registration pages
7. Add role-based middleware (admin vs. resident)
8. Seed database with default categories & admin user

### Phase 2: Core Issue CRUD (Day 3-4)

1. Build issue submission form with Zod validation
2. Implement Vercel Blob upload for images/videos
3. Create server actions: `createIssue`, `updateIssue`, `deleteIssue`
4. Build issue list page with filters (status, category, wing)
5. Build issue detail page with media gallery
6. Add status update flow with history tracking
7. Implement pagination and search

### Phase 3: Dashboard & Analytics (Day 5-6)

1. Build KPI cards: total, pending, in-progress, completed, avg resolution time
2. Add status distribution pie/donut chart
3. Add category-wise bar chart
4. Add wing-wise issue heatmap
5. Add trend line chart (issues over time)
6. Add recent issues feed
7. Make dashboard responsive

### Phase 4: Admin Features & Polish (Day 7-8)

1. Build admin category management (CRUD)
2. Build admin user management
3. Add issue assignment to admins
4. Build status history timeline on issue detail
5. Add loading states, error boundaries, toast notifications
6. Mobile responsiveness pass
7. Deploy to Vercel & test

---

## Key Technical Decisions

### Why Server Components + Server Actions?
- Minimizes client-side JavaScript (faster loads)
- Database queries run on the server (no API layer needed)
- Form submissions via server actions (progressive enhancement)
- Perfect for a dashboard-heavy app

### Why Vercel Postgres over Supabase?
- Zero-config with Vercel deployment
- Same free tier is sufficient for a housing society (~100-500 users)
- Prisma works seamlessly with it
- No additional service to manage

### Why Vercel Blob over Cloudinary?
- Native Vercel integration (env vars auto-configured)
- Simple API: `put()` returns a URL, done
- Good enough for issue photos/videos
- Upgrade path is straightforward if needed

### Media Upload Strategy
- Client-side: Validate file type (jpg, png, mp4) and size (<10MB images, <50MB videos)
- Server-side: Upload to Vercel Blob via server action
- Store blob URL in Attachment table
- Display with Next.js Image component (auto-optimized)

---

## Getting Started (Commands)

```bash
# 1. Create the project
npx create-next-app@latest issue-tracker --typescript --tailwind --eslint --app --src-dir

# 2. Install dependencies
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter
npm install @vercel/blob @vercel/postgres
npm install zod react-hook-form @hookform/resolvers
npm install recharts lucide-react date-fns
npx shadcn@latest init

# 3. Set up Prisma
npx prisma init
# → Edit schema.prisma with the models above
npx prisma migrate dev --name init
npx prisma db seed

# 4. Deploy
vercel link
vercel env pull .env.local
vercel deploy
```

---

## Environment Variables Needed

```env
# Database (auto-set by Vercel when you add Postgres)
POSTGRES_URL=
POSTGRES_PRISMA_URL=
POSTGRES_URL_NON_POOLING=

# Auth
NEXTAUTH_SECRET=          # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Vercel Blob (auto-set by Vercel when you add Blob store)
BLOB_READ_WRITE_TOKEN=
```

---

## Folder Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx              # Sidebar + header layout
│   │   ├── dashboard/page.tsx
│   │   ├── issues/
│   │   │   ├── page.tsx            # List
│   │   │   ├── new/page.tsx        # Create form
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # Detail
│   │   │       └── edit/page.tsx   # Edit
│   │   ├── admin/
│   │   │   ├── categories/page.tsx
│   │   │   └── users/page.tsx
│   │   └── profile/page.tsx
│   ├── api/
│   │   └── auth/[...nextauth]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn components
│   ├── dashboard/
│   │   ├── kpi-cards.tsx
│   │   ├── status-chart.tsx
│   │   ├── category-chart.tsx
│   │   └── recent-issues.tsx
│   ├── issues/
│   │   ├── issue-form.tsx
│   │   ├── issue-card.tsx
│   │   ├── issue-filters.tsx
│   │   ├── media-upload.tsx
│   │   └── status-badge.tsx
│   └── layout/
│       ├── sidebar.tsx
│       ├── header.tsx
│       └── mobile-nav.tsx
├── lib/
│   ├── auth.ts                     # NextAuth config
│   ├── prisma.ts                   # Prisma client singleton
│   ├── validators.ts               # Zod schemas
│   └── utils.ts
├── actions/
│   ├── issues.ts                   # Server actions
│   ├── categories.ts
│   ├── users.ts
│   ├── upload.ts
│   └── contacts.ts                 # ← NEW: Contacts feature
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── components/
│   └── contacts/                   # ← NEW: All contacts components
│       ├── contact-card.tsx
│       ├── contact-form.tsx
│       ├── contact-filters.tsx
│       ├── contact-type-badge.tsx
│       ├── share-contact-sheet.tsx
│       ├── share-button-wrapper.tsx
│       ├── delete-contact-button.tsx
│       ├── kanban-column.tsx
│       ├── kanban-contact-card.tsx
│       ├── contact-kanban.tsx
│       └── contact-category-table.tsx
└── types/
    └── index.ts
```

---

## Contacts Feature (added)

See `contacts-feature/INTEGRATION_STEPS.md` for full integration guide and `CONTACTS_FEATURE_PLAN.md` for the detailed design plan.

### New routes
```
/contacts                           → Directory list (search + filter + view toggle)
/contacts/new                       → Add a contact
/contacts/kanban                    → Kanban board grouped by category
/contacts/[id]                      → Contact detail + share (clipboard / WhatsApp / vCard)
/contacts/[id]/edit                 → Edit contact (own or admin)
/admin/contacts/categories          → Admin: manage contact categories
```

### New DB models
- **ContactCategory** — name, slug, icon, color, order  
- **Contact** — name, type (INDIVIDUAL/COMPANY), companyName, phone, altPhone, email, address, website, notes → FK to ContactCategory + User

### Permissions
| Action | Resident | Admin |
|--------|----------|-------|
| View / share | ✅ | ✅ |
| Add | ✅ | ✅ |
| Edit/delete own | ✅ | ✅ |
| Edit/delete others | ❌ | ✅ |
| Manage categories | ❌ | ✅ |

### New dependency
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Estimated Vercel Free Tier Usage

For a housing society with ~200 residents, ~50 issues/month:

| Resource | Estimated Usage | Free Limit | Status |
|----------|----------------|-----------|--------|
| Postgres Storage | ~50MB/year | 256MB | ✅ Comfortable |
| Blob Storage | ~100MB/year (images) | 250MB | ✅ Comfortable |
| Bandwidth | ~5GB/month | 100GB | ✅ Comfortable |
| Serverless | ~10GB-hrs/month | 100GB-hrs | ✅ Comfortable |

This comfortably fits within the free tier for a medium-sized society.

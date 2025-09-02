# FRA Atlas & DSS (MVP)

Full-stack Next.js (App Router, TypeScript) implementing FRA Atlas & DSS with Clerk authentication, PostgreSQL + Prisma, OCR upload (Tesseract.js), and MapLibre GL for maps.

## Tech Stack
- Next.js (App Router, TS)
- TailwindCSS (UI only; no extra UI libraries)
- Clerk (Auth)
- PostgreSQL (Neon/Supabase/Railway/local)
- Prisma ORM
- MapLibre GL JS (maps)
- Tesseract.js (OCR)

## Local Setup

1) Install dependencies
- npm install

2) Environment variables (.env.local)
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
- CLERK_SECRET_KEY=your_secret
- DATABASE_URL=postgresql://user:pass@host:port/db

3) Prisma
- npx prisma migrate dev --name init
- Optional: npx prisma studio

4) Dev
- npm run dev
- Visit /sign-in, authenticate, and you’ll land on /landing

## Protection
- middleware.ts protects all routes except /sign-in and /sign-up (Clerk public routes).
- API POST routes require an authenticated user.

## App Flow
- Landing: hub cards to Dashboard, Upload, FRA Atlas, DSS, Admin
- Dashboard: KPIs (counts), simple Tailwind bar visuals
- Upload: Upload PDF/JPEG/PNG → OCR via Tesseract → parsed claimant/village/area/type → Save as Claim
- Atlas: MapLibre map shows claims and assets with popups and simple filters
- DSS: Table of recommendations with CSV export
- Admin: Minimal forms to add claims and assets

## API Routes
- /api/claims: GET all claims (with user) • POST create claim
- /api/assets: GET assets • POST add asset
- /api/dss: GET recommendations • POST add recommendation
- /api/upload: POST multipart file → OCR → return text + parsed fields

## Deploy
- Frontend: Vercel
- Database: Neon/Supabase/Railway (DATABASE_URL)
- Auth: Clerk (set keys in Vercel env)

Notes: This MVP uses server route handlers (runtime nodejs). For PDFs, OCR quality may vary based on the source; images work best.

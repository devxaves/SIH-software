# Smart Adarsh Gram Platform 🏡

AI-driven infrastructure planning, inclusion analytics, and participatory governance toolkit for SC-majority villages pursuing the Adarsh Gram declaration.

## 🌍 Vision & Impact

- Deliver real-time gap analysis across infrastructure, social protection, and service delivery.
- Dynamically prioritize interventions using ML-powered scoring blended with officer judgement.
- Visualize community assets with geospatial intelligence and offline-first access.
- Activate multilingual community engagement, grievance loops, and impact storytelling.
- Guarantee accountability with blockchain-backed funding trails and risk intelligence.

Outcome: accelerate evidence-led village transformation with measurable social impact at scale.

## 🔑 Platform Pillars

1. **Open Data Mesh** – Standards-compliant APIs ingest government registries, field surveys, crowdsourced inputs, and IoT feeds (OC4IDS-ready).
2. **AI Gap Radar** – Machine learning models detect and forecast service gaps, ranking interventions by equity, cost, and urgency.
3. **Smart Geographies** – Interactive MapLibre atlas with demographic overlays, asset layers, offline caching, and mobile geotagging.
4. **Dynamic Prioritization** – Simulation-ready scoring engine with audit trails for manual overrides by government officers.
5. **Community Pulse** – Multilingual dashboards, WhatsApp/SMS nudges, grievance tracking, and impact storytelling.
6. **Resource Automation** – Live alerts for bottlenecks, resource shortfalls, and field visit scheduling.
7. **Risk & Accountability** – AI risk forecasts and blockchain-backed funding ledger for transparent procurement and disbursals.
8. **Accessible by Design** – Voice-ready, low-bandwidth UI with vernacular support for first-time digital users.

## 🧭 Module Overview

| Module | Purpose |
| --- | --- |
| **Landing Experience** | Mission overview, capability cards, platform pillars. |
| **Intelligence Hub (Dashboard)** | KPIs, adoption velocity, gap breakdown, AI risk signals, blockchain ledger, community sentiment. |
| **Geo Atlas** | MapLibre-based digital twin with project markers, community assets, and filterable layers. |
| **Prioritization Lab** | AI-assisted recommendation engine, policy threshold tuning, simulation mode, CSV export. |
| **Data Ops Workbench** | OCR + NER ingestion, metadata extraction, project registry creation. |
| **Community Pulse Archive** | Searchable community feedback and project registry with advanced filters and summaries. |
| **Operations Desk** | Project & asset management, AI-detected asset summaries, governance workflows. |

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS v4, custom utility components
- **Auth**: Clerk for end-to-end user management
- **Data**: PostgreSQL + Prisma ORM (Neon-compatible)
- **GIS**: MapLibre GL JS with OpenStreetMap, satellite, terrain, and search integrations
- **AI/ML**: Tesseract.js OCR, HuggingFace NER, rule-based DSS engine with simulation
- **State & Fetching**: SWR for intelligent caching and polling
- **Analytics**: Custom Tailwind visualizations and lightweight charts

## ⚙️ Environment Variables

Create a `.env.local` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require

# Optional AI Services
HUGGINGFACE_API_KEY=your_huggingface_key_here
```

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Apply database migrations
npx prisma migrate dev --name init

# (Optional) Inspect data
npx prisma studio

# Run locally
npm run dev
```

Visit `http://localhost:3000`, sign in via Clerk, and explore from the landing page.

## 🧱 Data Model Snapshot

```prisma
model Claim {
  id           Int      @id @default(autoincrement())
  claimant     String
  claimantName String
  village      String
  district     String
  type         String
  area         Float
  status       String
  coords       Json
  nerData      Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  userId       String?
  user         User?    @relation(fields: [userId], references: [id])
  dss          DSSRecommendation[]
}

model Asset {
  id        Int      @id @default(autoincrement())
  name      String
  owner     String?
  type      String
  coords    Json
  village   String
  source    String
  createdAt DateTime @default(now())
}

model DSSRecommendation {
  id        Int      @id @default(autoincrement())
  claimId   Int
  scheme    String
  reason    String
  priority  Int      @default(1)
  createdAt DateTime @default(now())
}
```

> _Note_: Field names retain legacy semantics for compatibility; UI and analytics reinterpret them as Adarsh Gram project entities.

## 🔐 Security Highlights

- Clerk-powered authentication & session management
- Middleware-protected routes and API endpoints
- Audit-friendly logs and AI alerting across modules
- Blockchain ledger view for funding transparency

## 📦 Deployment

1. Deploy via [Vercel](https://vercel.com/) (recommended).
2. Configure environment variables in Vercel dashboard.
3. Point `DATABASE_URL` to managed PostgreSQL (Neon/Supabase/Railway).
4. Add Clerk production keys and allowed URLs.

## 🧪 Development Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Serve production build
npm run lint       # ESLint
npm run type-check # TypeScript checks
npx prisma studio  # Inspect database
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit (`git commit -m "feat: add your feature"`)
4. Push (`git push origin feature/your-feature`)
5. Open a Pull Request

## 📄 License

MIT License – refer to the `LICENSE` file.

## 💬 Support

- Check open issues
- Raise a new ticket with clear reproduction steps
- Share feedback via the Community Pulse module

---

Built with ❤️ for inclusive, accountable village development.

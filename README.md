# Takhaial

Production-ready scaffold for Takhaial — a deep-tech company fusing Spatial
Computing and Artificial Intelligence. Decoupled architecture:

- `backend/` — Python FastAPI service (`/chat`, `/contact`).
- `frontend/` — Next.js 14 App Router site with a WebGL gatekeeper eye,
  continuous nebula background, glassmorphic UI, and animated product /
  industry / award sections.

## Aesthetic

Ultra-premium dark mode (`#05050A`) · heavy glassmorphism (`backdrop-filter: blur(20px)`)
· deep violet (`#6B4CE6`) and neon red (`#FF3366`) accents · Inter with wide
tracking for headers.

## Quickstart

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000.

## Flow

1. **Gatekeeper** — a shader-driven 3D eye tracks the mouse, blinks, and asks
   "Are you ready for the future."
   - **Yes** → camera dives infinitely into the pupil, then the site reveals.
   - **No** → the eye closes and the browser redirects to google.com.
2. **Main site** — hero, awards timeline, services grid, 8 products in a
   diagonal zigzag, logo marquee, draggable industries carousel, contact form,
   footer. A floating glassmorphic AI agent FAB is wired to `/chat`.

## Structure

```
.
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── README.md
├── frontend/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── webgl/EyeScene.tsx
│   │   ├── Gatekeeper.tsx
│   │   ├── SpaceBackground.tsx
│   │   ├── Hero.tsx
│   │   ├── ChatAgentFab.tsx
│   │   ├── AwardsTimeline.tsx
│   │   ├── ServicesOverview.tsx
│   │   ├── ProductsShowcase.tsx
│   │   ├── LogoMarquee.tsx
│   │   ├── IndustriesCarousel.tsx
│   │   └── ContactFooter.tsx
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── README.md
└── README.md
```

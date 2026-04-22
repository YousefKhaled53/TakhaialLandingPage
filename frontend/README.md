# Takhaial Frontend

Next.js 14 (App Router) + Tailwind + Framer Motion + React Three Fiber.

## Run

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:3000.

## Stack

- **Next.js 14** App Router, TypeScript strict.
- **TailwindCSS** for styling; custom tokens live in `tailwind.config.ts`.
- **Framer Motion** for layout animations, `whileInView`, and drag carousels.
- **@react-three/fiber + drei + three** for the Gatekeeper eye and the global nebula + starfield background.

## Architecture

| Layer            | File                                     |
| ---------------- | ---------------------------------------- |
| Page orchestrator | `app/page.tsx` — gatekeeper → main stage |
| Gatekeeper       | `components/Gatekeeper.tsx`              |
| WebGL Eye        | `components/webgl/EyeScene.tsx`          |
| Background       | `components/SpaceBackground.tsx`         |
| Hero             | `components/Hero.tsx`                    |
| Chat FAB         | `components/ChatAgentFab.tsx` → `/chat`  |
| Awards           | `components/AwardsTimeline.tsx`          |
| Services         | `components/ServicesOverview.tsx`        |
| 8 Products       | `components/ProductsShowcase.tsx`        |
| Logos            | `components/LogoMarquee.tsx`             |
| Industries       | `components/IndustriesCarousel.tsx`      |
| Contact + Footer | `components/ContactFooter.tsx` → `/contact` |

The backend URL is configured via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`).

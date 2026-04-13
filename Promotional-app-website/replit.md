# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## BODHI Website Notes

- Main web artifact: `artifacts/bodhi-website`, served at `/` on port `25236`.
- The site is a React/Vite animated fintech marketing website using Framer Motion, Tailwind CSS, Wouter routing, and custom CSS animation utilities.
- Navigation now scrolls to the top on route changes.
- The homepage superpowers orbit uses four independent animated rings with one shared hover/focus/click reveal for all four nodes.
- Large display typography and stat cards are responsive on the security and about pages to prevent viewport overflow at tablet and narrow desktop widths.
- The about page no longer includes the open roles/careers section.
- The app uses route-level lazy loading and throttled hero mouse parallax to reduce initial load and runtime re-render work without changing the visual design.
- Mobile responsiveness has been tightened across navigation, orbit visuals, CTAs, 3D cards, section spacing, and footer while preserving the desktop visual design.

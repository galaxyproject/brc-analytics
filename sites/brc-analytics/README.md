# BRC Analytics (`sites/brc-analytics`)

The BRC Analytics site is a standalone Next.js app living under
`sites/brc-analytics/`. It builds from its own `pages/` and imports all shared,
site-agnostic code from the `@repo/shared` workspace package
(`packages/shared`).

## Layout

```text
sites/brc-analytics/
  pages/                    route files (resolve BRC content directly — no runtime site branching)
  views/                    BRC-specific views/components
  components/               BRC-specific components
  viewModelBuilders/        BRC view-model builders
  config/                   BRC site config resolver (config/config.ts)
  apis/                     BRC catalog API types/utils
  services/                 BRC-specific services
  meta/                     BRC page metadata
  constants/                BRC route/constant definitions
  routes/                   BRC route helpers
  theme/ styles/            BRC theme + global styles
  docs/ mdx/                BRC docs + MDX content
  public/                   BRC static assets
  @types/                   BRC-scoped type augmentations (e.g. theme)
  tests/e2e/                BRC Playwright suite
  playwright.config.ts
  next.config.mjs
  tsconfig.json
  mdx-components.tsx
  instrumentation-client.ts (Sentry)
  _app / _document / _error
```

## Build & run

All commands are run **from the repo root** (the static-export and catalog data
paths resolve relative to it):

| Command                                            | What it does                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `npm run dev:brc`                                  | Dev server (`next dev sites/brc-analytics`) on `localhost:3000`   |
| `npm run build-local:brc`                          | Production export using the local env → `sites/brc-analytics/out` |
| `npm run build-dev:brc` / `npm run build-prod:brc` | Export using the dev / prod env                                   |
| `npm run start:brc`                                | Serve the built export (`npx serve sites/brc-analytics/out`)      |
| `npm run test:e2e:brc`                             | Build, serve, and run the Playwright suite                        |

Each build script copies the site's env, favicons, and catalog `/api/*.json`
into `sites/brc-analytics/` before running Next, so the produced app is
self-contained.

## Keeping the sites clean and separate

The `sites/<site>/` folders hold **only site-specific** code. Anything
view-agnostic or shared belongs in `@repo/shared`.

**If you find yourself duplicating a file (component, hook, util, type) between
`sites/brc-analytics` and another site, that is the signal to move it into
`@repo/shared` and import it from both.** Copy-paste across sites is how the
shared layer silently rots — promote the shared piece instead. Keep in
`sites/brc-analytics` only what is genuinely BRC-only.

Conversely, `@repo/shared` must never import from `sites/*` or from another
site's config — it stays site-neutral so every site can consume it.

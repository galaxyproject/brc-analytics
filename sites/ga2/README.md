# Genome Ark 2 (`sites/ga2`)

The Genome Ark 2 site is a standalone Next.js app living under `sites/ga2/`. It
builds from its own `pages/` and imports all shared, site-agnostic code from the
`@repo/shared` workspace package (`packages/shared`).

## Layout

```text
sites/ga2/
  pages/            route files (resolve GA2 content directly — no runtime site branching)
  views/            GA2-specific views/components
  config/           GA2 site config resolver (config/config.ts)
  meta/             GA2 page metadata
  public/           GA2 static assets
  tests/e2e/        GA2 Playwright smoke suite
  playwright.config.ts
  next.config.mjs
  tsconfig.json
  mdx-components.tsx
  _app / _document / _error
```

## Build & run

All commands are run **from the repo root** (the static-export and catalog data
paths resolve relative to it):

| Command                                            | What it does                                            |
| -------------------------------------------------- | ------------------------------------------------------- |
| `npm run dev:ga2`                                  | Dev server (`next dev sites/ga2`) on `localhost:3000`   |
| `npm run build-local:ga2`                          | Production export using the local env → `sites/ga2/out` |
| `npm run build-dev:ga2` / `npm run build-prod:ga2` | Export using the dev / prod env                         |
| `npm run start:ga2`                                | Serve the built export (`npx serve sites/ga2/out`)      |
| `npm run test:e2e:ga2`                             | Build, serve, and run the Playwright smoke suite        |

Each build script copies the site's env, favicons, and catalog `/api/*.json`
into `sites/ga2/` before running Next, so the produced app is self-contained.

## Keeping the sites clean and separate

The `sites/<site>/` folders hold **only site-specific** code. Anything
view-agnostic or shared belongs in `@repo/shared`.

**If you find yourself duplicating a file (component, hook, util, type) between
`sites/ga2` and another site, that is the signal to move it into
`@repo/shared` and import it from both.** Copy-paste across sites is how the
shared layer silently rots — promote the shared piece instead. Keep in
`sites/ga2` only what is genuinely GA2-only.

Conversely, `@repo/shared` must never import from `sites/*` or from another
site's config — it stays site-neutral so every site can consume it.

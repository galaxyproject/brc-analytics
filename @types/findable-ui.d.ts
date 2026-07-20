// Canonical load point for findable-ui's MUI theme augmentations — the extra
// Palette colors, Typography variants and SvgIcon colors that its theme adds to
// `@mui/material`. TypeScript only applies those augmentations when a compiled
// file bare-imports the findable-ui package root; without one they silently
// vanish and every use of an augmented member fails to type-check.
//
// This file lives in `@types/`, which every tsconfig program includes (the root
// program via `**/*.ts`, each site via `../../@types/**/*.d.ts`), so the
// augmentations load repo-wide from a single place and no source file — app,
// site or core — needs its own bare import.
//
// Types-only: the findable-ui package root is empty at runtime (`lib/index.js`
// is `export {}`, `sideEffects: false`), so this has no bundle impact.
import "@databiosphere/findable-ui";

# @brc-analytics/brc

BRC Analytics: explore, analyze, and share genomic data across organisms using Galaxy workflows.

The BRC Analytics Next.js app. Site-agnostic code is imported from `@brc-analytics/core`; everything here is BRC-specific.

## Contents

- `pages/` — BRC routes (organisms, genomes, priority pathogens, workflows, learn, calendar)
- Site-specific views (`HomeView`, `AboutView`, `RoadmapView`, `PriorityPathogensView`, `LearnView`, `CalendarView`)
- Site-specific components (`SectionAnalytics`, `SectionWhitePapers`, `SectionViz`, BRC `Branding`)
- BRC concrete entity types, column/category configs, theme overrides
- BRC catalog source/output + build scripts, `public/` assets, `next.config`, `.env`

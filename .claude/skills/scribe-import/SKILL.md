---
name: scribe-import
description: Convert Scribe markdown export into a tutorial page under /learn/getting-started. Use when the user pastes Scribe-exported markdown and wants it turned into a site page.
disable-model-invocation: true
argument-hint: "<Card Title>" "<Card Subtitle>"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

# Scribe Import

Convert a Scribe markdown export into a properly formatted tutorial page on this site.

## Input

- `$0` = Card title (e.g., "What Are Organisms")
- `$1` = Card subtitle (e.g., "Species and taxa served by BRC Analytics")
- The user will paste raw Scribe markdown in the conversation

If the user hasn't pasted the Scribe markdown yet, ask them to paste it.

## Steps

### 1. Derive slug

Convert the title to a URL slug: lowercase, spaces to hyphens, strip punctuation.
Example: "What Are Assemblies" → `what-are-assemblies`

### 2. Download images

- Extract all image URLs from the Scribe markdown (typically `colony-recorder.s3.amazonaws.com` URLs)
- Create directory: `public/learn/getting-started/<slug>/`
- Download each image with a short descriptive filename (e.g., `filter-panel.jpeg`, `click-organisms.jpeg`)
- Use `curl -sL -o <path> <url>` for each download
- Verify all downloads succeeded by checking file sizes

### 3. Create MDX page

Create `app/docs/learn/getting-started/<slug>.mdx` with this structure:

**Frontmatter:**
```yaml
---
breadcrumbs:
  - path: "/learn"
    text: "Learn"
  - path: "/learn/getting-started"
    text: "Getting Started"
  - path: ""
    text: "<Title>"
contentType: "ARTICLE"
description: ""
enableOutline: true
title: "<Title>"
---
```

**Body — rewrite each Scribe step as:**
```mdx
## Short descriptive heading

One or two sentences describing what the user sees or should do. Fix any grammar issues from the original.

<Figure src="/learn/getting-started/<slug>/<image-filename>" alt="Descriptive alt text" />
```

**Rules:**
- Each step gets a short `##` heading (2-4 words) followed by descriptive text
- Use `<Figure>` component for all images (not markdown `![]()` syntax)
- Image `src` paths start with `/learn/` (not `/public/learn/`)
- Remove ALL Scribe attribution links and "Made with Scribe" references
- Fix grammar, spelling, and style issues in the original text
- Merge consecutive steps that describe the same action into one section
- Use *italics* for species names

**Reference these files for style guidance:**
- `app/docs/learn/getting-started/what-are-organisms.mdx`
- `app/docs/learn/getting-started/what-are-assemblies.mdx`

### 4. Add card to getting-started page

Read `app/docs/learn/getting-started.mdx` and append a new entry to the `cards` array in frontmatter:

```yaml
  - href: "/learn/getting-started/<slug>"
    secondaryText: "<subtitle from $1>"
    title: "<Title from $0>"
```

### 5. Verify

- Confirm the MDX file exists and has valid frontmatter
- Confirm all images exist in `public/learn/getting-started/<slug>/`
- Confirm the card was added to `getting-started.mdx`
- Tell the user to check the page at `http://localhost:3001/learn/getting-started/<slug>`

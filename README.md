# Archer

Archer is a Chrome extension that brings Arc’s sidebar to Chrome using the Side Panel API. It shows a live list of tabs with quick activate/close, a one‑click Clear Inactive action, bookmark shortcuts with favicons, and a New Tab button—built with React, TanStack Query, Tailwind, and shadcn/ui.

## Features

- **Live tabs panel**: Activate or close tabs, plus a one‑click clear for inactive, non‑audible tabs.
- **Bookmark grid**: Open bookmarks instantly with favicon tiles.
- **New Tab**: Create a new tab from the side panel.
- **Auto-refresh**: Updates in real time via tab and bookmark listeners.

## Tech Stack

- **Framework**: React 19 + WXT (Web Extensions Toolkit)
- **Data**: TanStack Query
- **UI**: Tailwind CSS v4, shadcn/ui, Radix primitives, lucide-react icons
- **APIs**: Chrome Side Panel, Tabs, and Bookmarks permissions

## Getting Started

Prereqs: Node 18+ (or Bun), pnpm/npm/yarn/bun.

Install dependencies:

```bash
bun install
# or: npm install / pnpm install / yarn
```

Start development (auto-reload):

```bash
bun run dev
# or: npm run dev
```

Build production bundle:

```bash
bun run build
# or: npm run build
```

Zip for store upload:

```bash
bun run zip
```

## Load in Chrome

After building:

1. Open `chrome://extensions`
2. Enable Developer mode
3. Click “Load unpacked” and select `dist/chrome-mv3`
4. Pin Archer and open it from the side panel

## Firefox (optional)

Dev: `bun run dev:firefox` • Build: `bun run build:firefox` • Zip: `bun run zip:firefox`

## Permissions

`sidePanel`, `tabs`, `bookmarks`

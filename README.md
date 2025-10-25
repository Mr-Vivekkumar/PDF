# C-M-PDF – Interactive PDF Viewer

An interactive React + Vite application for exploring the Maersk Q2 2025 Interim Report. It features a movable Analysis panel, document search with phrase highlighting, reference-driven page navigation, and overlay annotations.

## Overview
- Built with `React 18`, `Vite`, `TypeScript`, `TailwindCSS`, and `shadcn/ui`.
- Uses `react-pdf` and `pdfjs-dist` to render the PDF and access text content.
- Supports keyboard/mouse interaction, zooming, search, and visual highlights.

## Tech Stack
- UI: `React`, `TailwindCSS`, `shadcn/ui`
- PDF Rendering: `react-pdf` (`Page`, `Document`) backed by `pdfjs-dist`
- Tooling: `Vite`

## Features
- Reference navigation: Jump to pre-defined pages from the Analysis panel.
- Document-wide search: Type a query and navigate to the first page containing it.
- Phrase highlighting: Highlights spans across multiple text nodes in the text layer.
- Zoom controls: Smooth in/out zoom with percentage indicator.
- Overlay highlights: Visual boxes marking key sections, scale-independent.
- Movable/resizable Analysis panel.

## Getting Started
1. Prerequisites
   - Node.js 18+ recommended
   - npm (bundled with Node.js)
2. Install dependencies
   ```bash
   npm install
   ```
3. Start the dev server
   ```bash
   npm run dev
   ```
   - The app typically serves at `http://localhost:8080/` or the next free port.
4. Build for production
   ```bash
   npm run build
   ```
5. Preview production build
   ```bash
   npm run preview
   ```

## Scripts
- `npm run dev` – Start Vite dev server
- `npm run build` – Build production assets
- `npm run build:dev` – Build with development mode settings
- `npm run preview` – Preview built assets
- `npm run lint` – Run ESLint

## Project Structure
```
C-M-PDF/
├─ public/
│  └─ Maersk_Q2_2025_Interim_Report.pdf
├─ src/
│  ├─ components/
│  │  ├─ AnalysisPanel.tsx      # Movable panel with references and search
│  │  └─ PDFViewer.tsx          # PDF rendering, search, highlighting, overlays
│  ├─ pages/                    # Basic routing pages
│  ├─ hooks/                    # Utilities (e.g., mobile detection, toast)
│  └─ lib/utils.ts              # UI helpers
├─ index.html                   # Vite entry
├─ package.json
└─ tailwind.config.ts
```

## Key Components
### PDFViewer.tsx
- Renders the PDF via `react-pdf` (`Document` → `Page`).
- Zoom controls using local `scale` state.
- Listens for the custom event `pdf-search` and updates `searchQuery`.
- Document-wide navigation:
  - Preloads the PDF using `pdfjs.getDocument`.
  - On search, iterates page text with `getTextContent()` starting from current page and wraps around, navigating to the first match.
- Text highlighting:
  - Multi-node algorithm builds a combined string from all text nodes in the text layer, finds matches, and maps them back to node ranges.
  - Each match is wrapped with a single `mark.cm-pdf-highlight` for clean visual feedback.
- Overlay highlights:
  - Uses absolute-positioned `div`s with percentage-based `top/left/width/height`.
  - Positions are independent of zoom (no multiplication by `scale`).

### AnalysisPanel.tsx
- Displays references (e.g., `[1]`, `[2]`, `[3]`) that jump the viewer to relevant pages.
- Bottom sticky search input:
  - On submit, dispatches `window.dispatchEvent(new CustomEvent('pdf-search', { detail: { query } }))`.
  - The viewer listens and responds with navigation and highlights.
- Drag to move; resize handle in the bottom-right corner.

## Search and Highlighting
- Event dispatch: The Analysis panel fires `pdf-search` with `{ detail: { query: string } }`.
- Cross-page navigation: The viewer finds the first page containing the query and calls `setPageNumber`.
- Multi-node text highlight: Queries that span multiple text nodes (e.g., "Profit before tax") are highlighted correctly.
- Built-in pattern highlights: `customTextRenderer` applies static highlights for known patterns (e.g., specific headers) independently of dynamic search.

## Customization
- Add new references:
  - Extend `getActivePatterns` and overlay blocks in `PDFViewer.tsx`.
  - Wire a new `[n]` reference button in `AnalysisPanel.tsx` to call `onReferenceClick(n)`.
- Adjust overlay positions:
  - Overlays use percentages: `top/left/width/height`. Tune these for each page.
  - Keep positions independent of zoom (do not multiply by `scale`).
- Extend static highlighting:
  - Add regex patterns in `getActivePatterns` to highlight recurring phrases.
- Change default page:
  - Update the initial `pageNumber` in `PDFViewer.tsx`.

## Troubleshooting
- PDF worker issues:
  - The worker is configured using `pdfjs.GlobalWorkerOptions.workerSrc` with a CDN URL.
  - If the worker fails to load, ensure network access and correct `pdfjs` version.
- Search finds nothing:
  - Ensure the query exists in the document. Try simpler tokens.
  - Some PDFs use hyphenation or unusual spacing; normalization can be added if needed.
- Port already in use:
  - Vite will automatically switch to the next free port (e.g., `8081`). Check the console for the active URL.
- Blank or misaligned overlays:
  - Overlays must be anchored inside the same container as the `Page`.
  - Verify percentages correspond to the current page layout.

## Notes
- Styling uses Tailwind and shadcn/ui components for consistent design.
- Keep highlight logic in `PDFViewer.tsx` synchronized with the text layer markup generated by `react-pdf`.
- For performance with very large documents, consider caching page text content or indexing.
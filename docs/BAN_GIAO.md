# Engineering Handoff (`docs/BAN_GIAO.md`)

> **Primary Claude Handoff**: Read [`docs/gemini-output/HANDOFF_CLAUDE.md`](./gemini-output/HANDOFF_CLAUDE.md) first for the full Stage 1 summary (`T-45`, `T-44`, `T-33`, `T-35`, `T-46`, `T-47`, `borderWidth`) and the updated **1-page A4 clean PDF spec** for `T-29`.

## Active Print Renderer Contracts (Existing Code for `T-29` & `T-37`)
- `src/lib/print/parts.ts`: `PartRenderer` interface (`pxPerMm: PRINT_PX_PER_MM = 14`, `bleedMm = 2`, `background` toggle). Wait for `document.fonts.load(...)` before Canvas 2D text draw (`useFontsKey` in `src/components/letter/hooks.ts`).
- `src/lib/print/layout.ts` (**T-29 done**): pure geometry for the 1-page A4 kit. `envelopeC7()` (curves flattened to one polyline shared by the colour fill and the vector cut line: rounded flap + 22×10 tuck tab, 26 mm curved slit, glue trapezoids proven covered by the bottom flap), `miniCard()`, `printKitLayout()` (adds card crop marks + scissors icon positions), `cropMarks()`. Geometry tests in `layout.test.ts`.
- `src/lib/print/render-envelope.ts`: `renderEnvelopeSheet` (raster layer: envelope colour + 2 mm bleed, glue hatch + drop icon, flap text from `renderEnvelopeFlap` rotated 180°), `renderEnvelopeFlap` (upright), `renderCardBack` (not in the default PDF).
- `src/lib/client/export-pdf.tsx`: `exportLetterPdf({ canvas, qrUrl, envelopeColor, background, fileName })` → exactly 1 A4 page. The card is the `inside` face (the only face with the QR) captured from Konva at pixelRatio 2, edge-stretched by `withEdgeBleed` for the 2 mm bleed. Cut/fold/slit/crop marks/scissors are vector lines; the PDF contains **zero text glyphs**. Assembly steps live only in `SharePanel`.
- Not in the default PDF any more: folded card strips (removed), `renderLetterSheet`/`renderWritingPage` (still used by the editor's LetterPanel; decide in `T-37` whether to keep that panel).

## Owner Infrastructure Checklist (`T-02`)
- **Audio**: Upload licensed MP3s (128kbps) to R2 at `audio/<id>.mp3` matching `src/lib/audio-tracks.ts`.
- **Donate**: Add `public/donate-qr-bank.webp` and/or `public/donate-qr-zalo.webp`, set `NEXT_PUBLIC_DONATE_*`.
- **DB & Cron**: Run `0001_init.sql`, `0002_upload_orphaned_at.sql` (and `0003` in Stage 4) on Supabase; set `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, R2 CORS, and Vercel Cron (`19:00 UTC`).

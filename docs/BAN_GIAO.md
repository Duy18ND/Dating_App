# Engineering Handoff (`docs/BAN_GIAO.md`)

> **Primary Claude Handoff**: Read [`docs/gemini-output/HANDOFF_CLAUDE.md`](./gemini-output/HANDOFF_CLAUDE.md) first for the full Stage 1 summary (`T-45`, `T-44`, `T-33`, `T-35`, `T-46`, `T-47`, `borderWidth`) and the updated **1-page A4 clean PDF spec** for `T-29`.

## Active Print Renderer Contracts (Existing Code for `T-29` & `T-37`)
- `src/lib/print/parts.ts`: `PartRenderer` interface (`pxPerMm: PRINT_PX_PER_MM = 14`, `bleedMm = 2`, `background` toggle). Wait for `document.fonts.load(...)` before Canvas 2D text draw (`useFontsKey` in `src/components/letter/hooks.ts`).
- `src/lib/print/render-envelope.ts`: `renderEnvelopeFlap` (drawn upright; `T-29` rotates 180° and clips to rounded tuck-in flap), `renderCardBack`. Envelope paper color comes from `web_config.envelopeColor`.
- `src/lib/print/render-letter.ts`: `renderWritingPage`, `renderLetterSheet` (note: per v1.7 owner update, default PDF is now 1 single A4 page with C7 tuck-in envelope on top + flat `105 × 74 mm` card on bottom; blank paper back is used for handwriting).
- `src/lib/print/layout.ts` & `src/lib/client/export-pdf.tsx`: currently holds the draft v1.3 3-page layout; update in `T-29` to the locked **1-page A4 clean spec** in `docs/gemini-output/HANDOFF_CLAUDE.md` Section 3.

## Owner Infrastructure Checklist (`T-02`)
- **Audio**: Upload licensed MP3s (128kbps) to R2 at `audio/<id>.mp3` matching `src/lib/audio-tracks.ts`.
- **Donate**: Add `public/donate-qr-bank.webp` and/or `public/donate-qr-zalo.webp`, set `NEXT_PUBLIC_DONATE_*`.
- **DB & Cron**: Run `0001_init.sql`, `0002_upload_orphaned_at.sql` (and `0003` in Stage 4) on Supabase; set `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, R2 CORS, and Vercel Cron (`19:00 UTC`).

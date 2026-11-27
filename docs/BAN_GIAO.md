# Engineering Handoff (`docs/BAN_GIAO.md`)

> **Primary Claude Handoff**: Read [`docs/gemini-output/HANDOFF_CLAUDE.md`](./gemini-output/HANDOFF_CLAUDE.md) first for the full Stage 1 summary (`T-45`, `T-44`, `T-33`, `T-35`, `T-46`, `T-47`, `borderWidth`) and the updated **1-page A4 clean PDF spec** for `T-29`.

## Active Print Renderer Contracts (Existing Code for `T-29` & `T-37`)
- `src/lib/print/parts.ts`: `PartRenderer` interface (`pxPerMm: PRINT_PX_PER_MM = 14`, `bleedMm = 2`, `background` toggle). Wait for `document.fonts.load(...)` before Canvas 2D text draw (`useFontsKey` in `src/components/letter/hooks.ts`).
- `src/lib/print/layout.ts` (**T-29 done**): pure geometry for the 1-page A4 kit. `envelopeC7()` (curves flattened to one polyline shared by the colour fill and the vector cut line: rounded flap + 22×10 tuck tab, 26 mm curved slit, glue trapezoids proven covered by the bottom flap), `miniCard()`, `printKitLayout()` (adds card crop marks + scissors icon positions), `cropMarks()`. Geometry tests in `layout.test.ts`.
- `src/lib/print/render-envelope.ts`: `renderEnvelopeSheet` (raster layer: envelope colour + 2 mm bleed, glue hatch + drop icon, flap text from `renderEnvelopeFlap` rotated 180°), `renderEnvelopeFlap` (upright), `renderCardBack` (not in the default PDF).
- `src/lib/client/export-pdf.tsx`: `exportLetterPdf({ canvas, qrUrl, envelopeColor, background, fileName })` → exactly 1 A4 page. The card is the `inside` face (the only face with the QR) captured from Konva at pixelRatio 2, edge-stretched by `withEdgeBleed` for the 2 mm bleed. Cut/fold/slit/crop marks/scissors are vector lines; the PDF contains **zero text glyphs**. Assembly steps live only in `SharePanel`.
- Not in the default PDF any more: folded card strips (removed). Since `T-37` the editor no longer mounts `LetterPanel` (3-fold letter + writing page) or the card-back preview, because neither is printed. `LetterPanel.tsx`, `render-letter.ts` and `renderCardBack` are kept unused, and `canvas_data.letter` / `writingPage` stay in the schema. Owner decides whether to delete them or bring back an optional back-side page.

> **v1.8 (supersedes the 1-page wording above):** the PDF is **2 pages = both sides of one A4**, printed duplex, flip on the long edge. Page 1: envelope (y 8..196) + card `front` face (y 207..281) + all vector marks. Page 2: card `inside` face only, at `miniCardBack()`. `PrintKitInput` needs `recipientName`; `envelope.frontText` prints on the envelope body via `drawEnvelopeFront`. `composeSheetCanvas(kit, pxPerMm, "front" | "back")`. Measured registration on the exported PDF: 0.1 mm.

## Editor (`T-34`, `T-37`)
- `EditorShell`: `Bản in` (views: front, inside, envelope, full kit) and `Trang web` (`components/editor/web/*`). Mobile bottom bar = 7 canvas tools, only on card views.
- Web preview: same-origin iframe `/editor/xem-truoc` fed by `postMessage` (`src/lib/preview-bridge.ts`, origin + source checked). Phone 390px / PC 1366px give real breakpoints. When `T-38` guards `/editor`, this child route is covered too.
- Full-kit preview and PDF share `renderPrintKit` (`export-pdf.tsx`) and `drawSheetVectors` (`print/sheet.ts`); the folded envelope comes from `foldedEnvelope()` in `print/layout.ts`.
- Draft PDF QR points to `/xem-thu/<template>` (`draftQrUrl`), a real page showing sample content.
- Freeform web section `board`: the card editor edits it when `store.boardId` is set (`currentElements/currentBackground/currentHeight`). Board images must stay in `collectWebImageUrls`, otherwise the nightly cron deletes them.
- Section order is drag-only (`useDragReorder`, `lib/reorder.ts`). Optional sizing fields: `WebImage.size/zoom`, `WebStyleConfig.textScale` (CSS `zoom` on `.story-text h1/h2/p`).
- Dev server note: after editing `globals.css`, Turbopack has twice served stale CSS; make a real edit to the file or restart `npm run dev`.

## Accounts (`T-38` → `T-41`)
- Sessions: `@supabase/ssr` cookies. `src/lib/server/auth.ts` `getUser()/requireUser()` verify with Supabase Auth (`getUser`). `src/proxy.ts` refreshes the session and redirects `/editor`, `/thiep-cua-toi`, `/doi-mat-khau` to `/dang-nhap?next=` (optimistic only; APIs enforce).
- APIs: `POST /api/letters` and `POST /api/upload` (login + Origin + Turnstile + per-IP and per-account limits); `/api/me/letters`, `/api/me/letters/[id]` (GET/PATCH/DELETE, filtered by `owner_id`, foreign = 404); `DELETE /api/me/account` (body `{ confirm: "XOA TAI KHOAN" }`). `assertSameOrigin` guards every mutating authenticated route.
- Pages: `/dang-nhap` (email, Google hidden in in-app browsers, reset), `/auth/callback` (PKCE `?code=` only), `/doi-mat-khau`, `/thiep-cua-toi`, `/thiep-cua-toi/[id]`, `/chinh-sach-rieng-tu`.
- Migration `0003_accounts.sql`: delete test letters/uploads first. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Supabase dashboard settings: see `docs/REVIEW_OPUS.md` (T-41).

## Owner Infrastructure Checklist (`T-02`)
- **Audio**: Upload licensed MP3s (128kbps) to R2 at `audio/<id>.mp3` matching `src/lib/audio-tracks.ts`.
- **Donate**: Add `public/donate-qr-bank.webp` and/or `public/donate-qr-zalo.webp`, set `NEXT_PUBLIC_DONATE_*`.
- **DB & Cron**: Run `0001_init.sql`, `0002_upload_orphaned_at.sql` (and `0003` in Stage 4) on Supabase; set `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, R2 CORS, and Vercel Cron (`19:00 UTC`).

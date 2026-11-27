# Claude Handoff Brief — Phygital Letter Studio (v1.7)

> Single concise English entry point for Claude (Opus / Sonnet). Read this file + `docs/BACKLOG.md` before starting `T-48`.

## 1. Current Verified State
- **Tests**: `npm test` → **16/16 files, 114/114 tests PASS**.
- **Typecheck**: `npm run typecheck` → **PASS (0 errors)**.
- **Lint**: `npm run lint` → **PASS (0 errors, 0 warnings)**.
- **Git**: Changes are uncommitted in the working tree (ready for review & commit after `T-48`).
- **Completed by Gemini**: `T-45`, `T-44`, `T-33`, `T-35`, `T-46`, `T-47`, plus customizable white photo border (`CanvasElement.borderWidth`).

---

## 2. Architecture & File Map (What Was Built)

### Data Contract, Validation & Store (`T-45` + `borderWidth`)
- `src/types/letter.ts`
  - Added `ImageFocus` (`{ x, y }` in `0..1`), `ImageFit` (`"contain" | "cover"`), `WebImage` (`{ src, fit?, focus? }`).
  - Added optional `focus?: ImageFocus` and `borderWidth?: number` (`0..48` logical px; `0` = no border) on `CanvasElement`.
  - Added `WebSection` discriminated union covering all 8 FR-10 types (`hero`, `first_day`, `memories`, `reasons`, `counter`, `message`, `interact`, `ending`), `WebStyleConfig` (FR-15), and optional `sections?` / `style?` on `WebConfig`.
  - All new fields are optional → legacy cards remain 100% schema-valid.
- `src/lib/web-styles.ts`
  - Plug-in registry `WEB_THEME_REGISTRY` with all 4 Wave 1 themes (`warm_letter`, `starry_night`, `pastel`, `doodle`, all `ready: true`), `EFFECT_CATALOG`, `DEFAULT_THEME_BY_TEMPLATE`, `resolveWebStyle`, `defaultWebStyle`, `contrastRatio`, `isReadableAccent`, `randomWebStyle`, `cssFontVar`.
  - Adding Wave 2 themes/effects requires editing only this registry + union types in `letter.ts`.
- `src/lib/validation.ts`
  - Zod strict schemas: `imageFocusSchema`, `webImageSchema`, `webSectionSchema`, `webStyleSchema`, `borderWidth: z.number().min(0).max(48).optional()`.
  - Enforces FR-10 limits: `maxWebImages = 8`, `maxMemories = 8`, `maxReasons = 8`, char limits, unique section IDs.
  - Exports `collectWebImageUrls(web)` and extended `collectUserImageUrls(canvas, web?)` (passing `web` returns deduplicated union of card + web image URLs for `T-32`).
- `src/lib/editor/store.ts`
  - Added Undo/Redo-backed actions: `setWebStyle`, `setWebSections`, `updateWebSection`, `moveWebSection`, `toggleWebSection`.
- `src/lib/web-styles.test.ts`
  - 10 unit tests covering legacy compatibility, FR-10/FR-15 limits, `collectUserImageUrls`, WCAG ≥ 4.5 contrast for all 4 themes (ink & muted), store Undo/Redo, `coverCrop` focal shifts, `T-35` FR-01 order, and `/xem-thu/[mau]`.

### Card Rendering, Photo Focus & White Border (`T-44` + `borderWidth`)
- `src/lib/editor/transform.ts` & `src/components/editor/EditorStage.tsx`
  - Aspect-ratio locked on resize for `image`, `sticker_img`, `svg_icon`, `handwriting`, `qr_code`, `text` (only `lined_area` stretches freely on both axes).
- `src/lib/render/image-frame.ts` & `src/components/letter/ElementNode.tsx`
  - `coverCrop(srcW, srcH, dstW, dstH, focus?)` crops around focal point `(0..1)`.
  - `renderFramedImage(..., focus?, borderWidth?)` draws a crisp white sticker-style border (`defaultImageBorder` ≈ 18px at 600px, `0` disables border) matching `none` / `rounded` / `circle` / `cloud` contours, plus soft paper shadow.
- `src/components/editor/ImagePanel.tsx`
  - Added interactive `FocusPicker` (pointer drag + keyboard arrows + 5 presets) and `borderWidth` range slider (`0..48` px) + 4 presets (`Tắt / Mảnh / Vừa / Dày`).
  - Visual reference: `docs/gemini-output/T-44-photo-border-demo.png`.
- `src/components/viewer/CardZoomModal.tsx`
  - Full-screen accessible tap-to-zoom lightbox (`role="dialog"`, `Esc` to close, front/inside face toggle, `1x` / `1.6x` zoom).

### Scrollable Web Experience, 4 Templates, 4 Themes & Wave 1 Effects (`T-33`, `T-35`, `T-46`, `T-47`)
- `src/lib/web-defaults.ts` & `src/lib/templates.ts`
  - Imports `docs/gemini-output/T-35-scroll-web-defaults.json` (do NOT delete that JSON!).
  - `createFromTemplate(type)` populates `web_config.style` and `web_config.sections` in exact FR-01 order.
- `src/components/viewer/ScrollStory.tsx`
  - All 8 FR-10 sections, auto-hides empty enabled sections, lazy-loaded images (`contain` default, `cover` with `object-position` from `focus`), plain-text XSS-safe paragraphs, `prefers-reduced-motion`, `dvh` + `safe-area-inset-*`.
  - Implements `textReveal` (`slide`, `typewriter` with `sr-only`, `lines`), `photo` (`polaroid`, `flip` interactive card, `drop`), `counter` (`count_up`, `flip_calendar`).
- `src/components/viewer/LetterExperience.tsx`
  - Implements all 3 open modes (`wax_seal`, `ribbon` 1:1 drag + tap/keyboard, `hold_heart` 850ms progress ring + keyboard button). Calls `audio.play()` synchronously inside user gesture for iOS Safari. Supports `preview` mode (skips `recordView`) and `styleOverride`.
- `src/components/viewer/ParticleLayer.tsx`
  - Max 1 ambient canvas layer (`none`, `hearts`, `stars`, `petals`), reduced particle count on mobile (`< 768px`), pauses on `document.hidden` (`visibilitychange`), hidden under `prefers-reduced-motion`.
- `src/lib/celebrate.ts` & `src/components/viewer/blocks.tsx`
  - Implements `confetti`, `fireworks`, `heart_rain` scaled by `intensity`, with `disableForReducedMotion: true` and `preview` mode (simulates submit without API call).
- `src/app/xem-thu/[mau]/page.tsx`, `PreviewSandbox.tsx`, `src/lib/preview-samples.ts`
  - Database-free preview at `/xem-thu/{confession|wedding|dinner|holiday}` with floating style/effect/font switcher + **Randomize** button (`randomWebStyle`).

---

## 3. Locked Print Spec Update for `T-29` (Single-Page A4 Clean Kit)

Owner approved simplifying the print PDF from 3 pages down to **1 SINGLE A4 PAGE (210 × 297 mm, 1-sided print, 180–220gsm paper)**. Visual target: `docs/gemini-output/T-29-print-kit-single-a4.png`.

1. **Top Half — C7 Tuck-In Envelope (`144 × 188 mm`, continuous single piece)**:
   - Placement: `offsetX = 33 mm`, `offsetY = 10 mm` (`y = 10..198 mm`).
   - Body `114 × 81 mm`, side flaps `15 mm`, bottom flap `62 mm`, rounded top flap `45 mm` with a **22 mm wide × ~10 mm tall tuck tongue tab** at the apex.
   - Top flap text (`monogram` + `line`) rotated **180°** so it reads upright when folded down.
   - **Tuck slit (`26 mm` slightly curved cut line)** on the bottom flap at `45 mm` below the bottom fold line (`17 mm` from bottom edge, aligns with top flap tongue when folded).
   - Glue zones on side flaps: confined to area covered by bottom flap (`bottom - 62 + 8` to `bottom - 8`).
   - Bleed: `2 mm`.
2. **Gap**: `13 mm` (`y = 198..211 mm`) — fits `2 mm` bleed + `5 mm` crop marks cleanly.
3. **Bottom Half — Flat 1-Sided Mini Card (`105 × 74 mm`, half A6, NO folding, NO back gluing)**:
   - Placement: `x = 52.5 mm`, `y = 211 mm` (`y = 211..285 mm`, leaving `12 mm` bottom margin).
   - **Front**: Greeting + user photo (`focus` + `borderWidth`) + QR code.
   - **Back**: Naturally blank white back of the A4 sheet for handwriting.
   - Bleed: `2 mm`; 4 corner crop marks outside bleed.
4. **Clean PDF Rule (Mandatory)**:
   - **NEVER print instructional text** ("cắt ở đây", "bôi keo", "rạch khe", "mặt trước"...) on the PDF paper.
   - Use **minimal vector icons/lines only**: small scissor icon `✂` placed **outside** cut lines (and tiny `✂` beside the tuck slit), faint crosshatch + tiny glue-drop icon inside hidden glue tabs, thin cut/fold lines. Put all written assembly instructions in the web PDF modal only.

---

## 4. Next Tasks for Claude (Strict Order)
1. **`T-48` (Opus — NEXT)**: Cross-review Stage 1 (`LetterExperience` iOS Safari audio on `ribbon`/`hold_heart`, mobile mid-range perf, `360/390/768/1366/1920px`, keyboard a11y, `prefers-reduced-motion`). Fix issues & commit.
2. **`T-49` (Owner — Gate 1)**: Live test `/xem-thu/[mau]` on PC, iPhone, Android.
3. **`T-32` (Opus)**: Web image uploads (max 8, 20/hr), claim both card + web URLs via `collectUserImageUrls(canvas, web)` on create & PATCH (even single-side PATCH).
4. **`T-34` (Sonnet)**: Editor "Trang web" tab (toggle/reorder sections, inputs, web image upload + fit/focus, theme/effect picker, Phone/PC preview, Undo/Redo).
5. **`T-29` (Opus)**: Implement clean 1-page A4 PDF per Section 3 above + geometry tests.
6. **`T-37` (Sonnet)**: Full-kit preview (FR-13) + draft PDF download + compact mobile toolbar.
7. **`T-38` → `T-39` → `T-40` → `T-41` → `T-36`**: Supabase Auth (`0003`), `/thiep-cua-toi`, security & final launch review.
8. **Post-Launch V1.8 (deferred — do not block MVP)**: Canva-style smart snap alignment guides in `EditorStage` + hybrid `scrapbook` (`4:5` Konva canvas) section for freeform sticker/photo collages inside the responsive scrollable web page.

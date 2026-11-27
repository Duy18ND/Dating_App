# Project Backlog (v1.7 — Updated 27/11/2026)

> Authoritative task list. Full Stage 1 handoff & 1-page A4 print spec: [`docs/gemini-output/HANDOFF_CLAUDE.md`](./gemini-output/HANDOFF_CLAUDE.md). Full Vietnamese functional spec: `docs/SRS.md`.

## Done
- **Core v1–v1.3**: `T-01`, `T-03 → T-16`, `T-18`, `T-21`, `T-22`, `T-24`, `T-26`, `T-27`, `T-28`, `T-30`, `T-31` (`T-17`/`T-19`/`T-20` superseded by `T-28`/`T-29`/`T-33`; `edit_token` replaced in `T-38 → T-40`).
- **Stage 1 Code (Gemini — 114/114 tests, typecheck & lint PASS)**:
  - `T-45`: Web data contract (`sections` FR-10, `style` FR-15, `fit`/`focus` FR-16, `borderWidth`), plug-in registry (`src/lib/web-styles.ts`), Zod + `collectUserImageUrls(canvas, web?)`, store Undo/Redo.
  - `T-44`: Aspect-ratio lock (all except `lined_area`), focal-point crop + `FocusPicker`, customizable white photo border (`0..48` px), `CardZoomModal` tap-to-zoom.
  - `T-33`, `T-35`, `T-46`, `T-47`: Scrollable story page (all 8 FR-10 sections), DB-free `/xem-thu/[mau]`, wired `docs/gemini-output/T-35-scroll-web-defaults.json`, all 4 Wave 1 themes (`warm_letter`, `starry_night`, `pastel`, `doodle`), all Wave 1 effects (`wax_seal`/`ribbon`/`hold_heart`, `slide`/`typewriter`/`lines`, `polaroid`/`flip`/`drop`, `none`/`hearts`/`stars`/`petals`, `count_up`/`flip_calendar`, `confetti`/`fireworks`/`heart_rain`, `intensity`, randomizer).

- **Claude (27/11/2026)**: `T-48` (touch audio for ribbon/hold_heart, a11y, tall-section reveal, local dates, modal focus, `/xem-thu` build fix), `T-32` (claim card + web URLs on create and on any one-sided PATCH, upload limit 20/h, `useImageUpload("web")`), `T-29` (1-page A4 PDF, geometry tests).

## Stage 1: Finish & Gate 1
| Task | Scope | Acceptance Criteria | Owner | Est (h) | After |
|---|---|---|---|---|---|
| ~~`T-48`~~ ✅ | Cross-review Stage 1 | Audit mobile mid-range perf, iOS Safari audio (`ribbon`/`hold_heart`), `prefers-reduced-motion`, widths `360/390/768/1366/1920px`, keyboard a11y; fix issues; commit | **Opus** | 2 | `T-47` |
| `T-49` | **Gate 1**: Live device QA | Deploy preview to Vercel (or LAN Wi-Fi); verify `/xem-thu/[mau]` on PC, iPhone, Android. **Must pass before Stage 2** | **Project Owner** | 1.5 | `T-48` |

## Stage 2: Web Content Authoring
| Task | Scope | Acceptance Criteria | Owner | Est (h) | After |
|---|---|---|---|---|---|
| ~~`T-32`~~ ✅ | Web images (max 8, 20 uploads/hr) | Claim both card + web URLs via `collectUserImageUrls(canvas, web)` into `set_letter_uploads` on create AND PATCH (**even when patching only one side**); reject unknown URLs; tests | **Opus** | 2 | `T-49` |
| ~~`T-34`~~ ✅ | Editor "Trang web" tab | Toggle/reorder sections, text inputs, web image upload + fit/focus, theme & effect pickers, Phone/PC preview toggle, Undo/Redo, mobile usable | **Sonnet** | 5 | `T-32` |

## Stage 3: Clean 1-Page A4 Print & Physical QA
| Task | Scope | Acceptance Criteria | Owner | Est (h) | After |
|---|---|---|---|---|---|
| ~~`T-29`~~ ✅ | Clean **1-page A4 PDF** (v1.7 spec) | Top (`y=10..198mm`): continuous C7 envelope (`144×188mm`) with 22mm tuck tab, 26mm curved slit on bottom flap, 180° top flap text, hidden glue tabs (hatch + drop icon), 2mm bleed. Bottom (`y=211..285mm`): flat `105×74mm` mini card (Front: greeting + QR; Back: blank paper for handwriting; no folding/back-gluing), 2mm bleed. **Zero helper text on paper** (icon-only `✂` & thin marks). No `pdf.text()` for user copy; respect image `focus` & `borderWidth`; geometry tests | **Opus** | 3.5 | `T-34` |
| ~~`T-37`~~ ✅ | Full-kit preview (FR-13) + draft PDF | Render via shared PDF functions; allow downloading draft PDF before publish; group mobile editor toolbar into Print / Web tabs (SRS 2.3) | **Sonnet** | 2.5 | `T-29` |
| `T-23A` | **Gate 2**: Print, cut, tuck & scan | **v1.8 (restored after the two-sheet trial):** print the 2-page PDF duplex (long edge) on 1 A4 sheet of 180–200 gsm, confirm the printer accepts it and the envelope folds without cracking; check front/back of the card line up within 2 mm; cut envelope & card; tuck flap into slit; scan QR (card back) on 2 phones. **Must pass before Stage 4** | **Project Owner** | 2 | `T-37` |

## Stage 4: Accounts & Launch
| Task | Scope | Acceptance Criteria | Owner | Est (h) | After |
|---|---|---|---|---|---|
| ~~`T-38`~~ ✅ | Auth & ownership (`0003`, `/api/me/*`) | Read `node_modules/next/dist/docs/`; verify session with Supabase; remove `edit_token`; owner + Origin checks; foreign card returns 404; upload ownership check; server-side route guards; internal-only redirects; migration & API tests | **Opus** | 4 | `T-23A` |
| ~~`T-39`~~ ✅ | Auth UI & Privacy Policy | Sign up/in, password reset, Google (disabled with Open-in-Browser guide in Threads/Zalo in-app browsers), `/chinh-sach-rieng-tu`, 360px ready, 60-day QR expiry notice | **Sonnet** | 3 | `T-38` |
| ~~`T-40`~~ ✅ | `/thiep-cua-toi` dashboard (replaces `/manage`) | Full FR-14 actions, `/editor?id=`, remove `edit_token` code, expiry date & `<= 7d` warning, screen-record tip | **Sonnet** | 3.5 | `T-39` |
| ~~`T-41`~~ ✅ | Account security review | Cross-account access tests on all APIs, CSRF, open redirects, no secret keys in client bundle, account deletion cascade | **Opus** | 1.5 | `T-40` |
| ~~`T-36`~~ ✅ | Final pre-launch review | XSS safety, image URL ownership, cron cleanup safety, end-to-end flow | **Opus** | 1.5 | `T-41` |
| `T-23B` | Real-device E2E QA | iPhone & Android full flow (auth incl. in-app browser, audio, scroll, `?to=`, responses, PDF, QR) | **Project Owner** | 1.5 | `T-36` |
| `T-25` | Production deploy & Threads launch | Launch script: `docs/gemini-output/T-25-threads-launch-script.md` | **Project Owner** | 3 | `T-23B` |

## Remaining Workload & Next Prompts for Claude
- **Claude Opus**: Stage 4 done (`T-38`, `T-41`, `T-36`)
- **Claude Sonnet**: Stage 4 done (`T-39`, `T-40`)
- **Post-Launch V1.8 (after MVP launch — do not block Stage 1–4)**:
  - ~~**Canva-style Smart Snap Guides**~~ ✅ done early on owner request (27/11/2026): `lib/editor/snap.ts` + `useSnapping` (drag, resize handles, equal spacing, Ctrl to bypass) and centre buttons in the toolbar.
  - ~~**Hybrid Freeform Web Block**~~ ✅ done early on owner request (27/11/2026) as section type `board` (3 sizes, max 3 per page), together with drag-to-reorder sections, web image size/zoom, web text scale and 6 more Vietnamese fonts. Not yet tested on real phones.
- **Next (owner)**: configure Supabase per `docs/REVIEW_OPUS.md` (T-41), run `0003_accounts.sql`, set `NEXT_PUBLIC_SUPABASE_*`, then `T-23A`, `T-23B` (real sign-in flows), `T-25`.

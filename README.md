# Bidcraft

Make every bid count. A Next.js tender and proposal workspace with evidence search, Gemini drafting and OCR, compliance review, version snapshots, and local browser persistence.

## Run

Use Node.js 20+ or Bun. Install with `bun install --frozen-lockfile` (or `npm install`), copy `.env.example` to `.env.local`, and run `npm run dev`.

- `GEMINI_API_KEY` enables online AI drafting, audits, and OCR. It stays server-side. Local edits, snapshots, exports, and local search work without it.
- Set `APP_URL` to the real public origin before the production build to generate canonical URLs, social image URLs, and sitemap entries. No production domain is invented when it is unset.
- `GEMINI_MODEL` and `GEMINI_EMBEDDING_MODEL` optionally override documented defaults. Model references: https://ai.google.dev/gemini-api/docs/models.

## Verify

`npm run lint`, `npm run typecheck`, `npm run build`, then `npm test`. Install test Chromium with `npx playwright install chromium`, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an existing Chromium binary. Browser tests run against the production build.

## Data and AI behavior

The initial tenders and corporate evidence are demonstration content. New bids start blank. Tender content is saved in this browser's localStorage; there is no account system or cross-device sync. Existing browser storage keys are preserved for compatibility. Invalid saved structures are rejected; recoverable invalid structures are backed up under the storage key ending in `_recovery`.

AI failures do not change proposal content or report successful reviews. Manual edits and suggested fixes require a fresh review. Version restoration includes clause, summary, score, and available discrepancy snapshots, including intentionally empty content. Export important proposals as Markdown and verify all evidence and commitments before submission.

## Brand and UI

The name is **Bidcraft**; the tagline is **Make every bid count.** See `BRAND.md` for assets and design direction. The logo takes direct inspiration from the supplied rounded, dimensional app-icon reference. Three.js creates a decorative interactive document-ribbon B with reduced-motion support, offscreen pause, resource cleanup, and a static fallback.

EasyUI Alert and Animated Tabs are adapted for the existing Motion package, brand colors, reduced motion, and keyboard navigation. Attribution and MIT terms are in `THIRD_PARTY_NOTICES.md`. Public product guidance is at `/about`; AI-reader context is at `/llms.txt`, `/llm.txt`, and `/llms-full.txt`.

## Bid Anatomy

The Bid Anatomy tab adds an Anatomy-powered SVG inspection bench with six visible stations per page, a clause inspector, source-document disclosures, evidence linking, and local human review records. Its gauge shows the fraction of mandatory clauses with recorded approvals; AI confidence and human review remain separate. Missing responses, unavailable evidence and open compliance flags block approval.

Review decisions create immutable `Human Review` snapshots with local timestamps and an explicit `Local reviewer` attribution. Editing the response, replacing it with an AI draft/fix, or changing evidence links clears that clause's prior review. Restoring a snapshot restores its review state. Reviews are local browser records, without authenticated reviewer identity or a legal eligibility guarantee.

Geometry is precomputed with the vendored Anatomy kit, then lazy-loaded when the tab opens. Run `npm run anatomy:build` to regenerate it and `npm run anatomy:audit` for geometry verification. Upstream source and license details are in `vendor/anatomy/README.md` and `THIRD_PARTY_NOTICES.md`.

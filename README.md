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

## South African tender discovery

Open `/tenders` to search National Treasury's advertised notices. Province, category, buyer, procurement type, closing date, publication date and briefing filters run across the retrieved collection before pagination. Filters are reflected in the URL. No paid data service or Gemini key is required.

The server adapter uses the official portal's public listing JSON, with 15-minute Next.js Data Cache entries, bounded pagination and concurrency, and schema validation. These portal endpoints are undocumented and can change. Up to 8,000 source records are retrieved; an incomplete/changing collection is explicitly identified. Historical awards and closed notices are outside this advertised collection.

The matching documented OCDS feed is checked when opening details, where available. OCIDs are taken only from matched source records. Portal wall-clock dates use South African time; disagreement with OCDS timestamps is shown and must be checked against the source documents. Blank status, missing dates and value placeholders are not treated as verified facts.

Saved opportunities, optional source-detail snapshots and the last three successful result pages are stored in this browser. A failed source refresh retains a matching cached result with a clear label. These are local copies, without cross-device sync or downloaded attachment contents. Clearing site data removes them. Explicit save/import storage failures are reported.

Creating a bid preserves source provenance, uses ZAR and SAST, and starts with no drafted clauses or proposal text. Re-importing a source notice opens its existing workspace without replacing proposal work.

Sources and reuse: [official listings](https://www.etenders.gov.za/Home/opportunities?id=1), [OCDS OpenAPI](https://ocds-api.etenders.gov.za/swagger/v1/swagger.json), [publication policy](https://data.etenders.gov.za/Home/LearnMore). Treasury allows commercial and non-commercial reuse with source attribution, but does not guarantee complete, current or accurate coverage. Live upstream checks are separate from deterministic browser tests in `tests/tender-discovery.spec.ts`.

## South African market defaults

Bidcraft targets South African bid teams: `en-ZA` language and metadata, rand (ZAR), and SAST (`Africa/Johannesburg`) for dates and review history. New bids accept an original bid reference and a SAST closing date/time. Numeric contract values are formatted in rand; explicitly supplied currency or VAT wording is preserved. VAT is never added automatically.

The starter workspaces and evidence are fictional South African demonstrations. They have distinct IDs and explicit labels, including exported proposals. Existing saved bids are not migrated or rewritten. Users with the legacy examples can add the South African examples without replacing their drafts. Old snapshot times without an offset are displayed as SAST; ISO timestamps with an offset retain their actual instant.

The collapsed bidding guide links to the official [CSD](https://secure.csd.gov.za/), [SARS TCS](https://www.sars.gov.za/individuals/manage-your-tax-compliance-status/) and [the dtic B-BBEE](https://www.thedtic.gov.za/financial-and-non-financial-support/b-bbee/) pages (checked 21 October 2026). It explains tender-specific supplier evidence, bid forms, briefings, VAT and submission requirements without treating them as universally mandatory or verifying supplier eligibility. AI prompts use the same South African context, preserve source currencies and terms, and distinguish demonstration evidence from real supplier capabilities.

AI features send supplied clauses, uploaded pages and evidence to Gemini through the server. Users must assess their POPIA obligations; local storage does not provide account access controls, and the app does not claim POPIA compliance or South-African-only processing. See the [Information Regulator](https://inforegulator.org.za/) for official guidance.

## Privacy, legal notices and verified capabilities

Review the public [Legal overview](/legal), [Privacy notice](/privacy), [Terms of use](/terms), [Data sources](/data-sources), and [AI & limitations](/ai-disclosure) pages, linked from every screen. Read [LEGAL_LAUNCH_CHECKLIST.md](LEGAL_LAUNCH_CHECKLIST.md) before public or commercial launch.

- Bidcraft is independent, **not** affiliated with National Treasury or procuring entities.
- Source records and metadata can be incomplete or stale. Tender availability, closing dates, briefings, amendments and eligibility must be independently checked in original procurement documents. Importing a notice does not submit a bid.
- Most bid state is browser-local and may disappear when site data is cleared. This is not an account-based sync or remote backup.
- Explicit AI actions send selected tender clauses, evidence, text and uploaded scans from the browser through the server to Google Gemini. The Google API key stays server-side. **Gemini unpaid-tier submissions may be used by Google for improving services and reviewed by humans; paid-tier terms differ.** The actual deployed billing plan and any cross-border processing agreement must be verified before inviting sensitive uploads. No POPIA or confidentiality guarantee is made.
- AI grades, compliance flags, suggested text and retrieval ranks are review aids, not verified eligibility, credentials, sign-off, legal advice, or certainty of a tender award.
- There are no guaranteed automated background alerts, no user accounts, no in-app tender submissions and no payment/subscription checkout in this release.

### Operator identity is required before public launch

Complete the server-side environment variables `LEGAL_OPERATOR_NAME`, `LEGAL_CONTACT_EMAIL`, `LEGAL_CONTACT_PHONE`, `LEGAL_SERVICE_ADDRESS` and, for registered entities, `LEGAL_REGISTRATION_NUMBER` from **verified** records. The public pages clearly flag missing information. Do not invent an entity, registration number or contact address. Redeploy after setting variables; the pages may be prerendered at build time. Get independent South African legal review of the published details and obligations.

The notices describe the currently reviewed code, not a certificate of POPIA, PAIA, ECTA or CPA compliance. Deployment configurations, third-party logs and Gemini data settings require separate operational verification.

## Tender Reality Check (mobile-first)

Open any result in **Discover** and choose **Check suitability** to assess whether the tender may be worth pursuing. The flow contains a browser-local reusable supplier profile, an explainable qualitative assessment, manually source-linked requirements, a reviewable action checklist, and a Markdown export. Tender entries remain in Discover; **Prepare bid** continues into the existing My bids workspace without claiming to submit to National Treasury.

**Conservative source rules:** The live eTender listing provides title, dates, compulsory-briefing flags, conditions and attachment links. Bidcraft does **not** automatically inspect attached PDFs or validate the authenticity of user-entered excerpts/evidence. The checker only flags a compulsory briefing as mandatory when the official notice reports it. Optional CSD/SARS Good Standing/cidb profile answers are self-reported and never assumed to be universal eligibility requirements. Reported answers are not government certification. No fabricated win percentages, official eligibility checks, background notifications or personal-document uploads.

Source details are fetched on demand; saved local snapshots detect changes to dates, briefing flags, conditions, status and linked-document lists on subsequent checks. A changed or unavailable source conservatively invalidates the displayed assessment until a user reviews it. This is **not** automatic monitoring of tender amendments or PDF contents. All source checks are limited to currently available official fields, with direct links to the procurement source.

**Future phases (not implemented here):** explicitly authorised PDF/OCR source-cited AI extraction, page-level matching, comprehensive addendum versions/diffs, persistent hosted accounts, live system verifications, and dependable alerts. Those require document validation, permission, retention and POPIA safeguards before activation. See `/privacy`, `/data-sources` and `/ai-disclosure`.

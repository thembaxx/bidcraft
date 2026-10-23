# Bidcraft legal and privacy launch checklist

This checklist is an engineering/operational handoff, not a legal opinion or proof of compliance. A South African attorney familiar with POPIA, ECTA and consumer law should review the live service and these notices before commercial launch.

## Release already implemented

- Public notice pages: `/legal`, `/privacy`, `/terms`, `/data-sources`, `/ai-disclosure`.
- Navigation from every page, and contextual disclosures beside AI and Treasury functionality.
- Disclosure of localStorage/service-worker caches; no account sync or automatic off-device backups.
- Disclosure that AI actions transfer selected content, images/PDFs and vault evidence to the Bidcraft server and Google Gemini.
- Explicit difference between unpaid and paid Gemini API processing; billing plan is not assumed.
- Warning that Treasury data may be incomplete and stale; Bidcraft is not endorsed by Treasury.
- AI confidence/grades are not verified eligibility, credentials, audits or tender awards.

## Must complete before treating notices as launch-ready

1. **Identify the actual legal operator.** Confirm whether Bidcraft is operated by a sole proprietor or an incorporated company. Do not use a planned company name before the company exists. Set `LEGAL_OPERATOR_NAME`, `LEGAL_CONTACT_EMAIL`, `LEGAL_CONTACT_PHONE`, `LEGAL_SERVICE_ADDRESS`, and `LEGAL_REGISTRATION_NUMBER` (where applicable), with details verified against legal records. Redeploy after setting these variables because Next.js may prerender policy pages.
2. **Confirm statutory website disclosures.** If sales/subscriptions are offered, review ECTA section 43 and the Consumer Protection Act. Provide required full operator and transaction details, prices including tax, payment, cancellation/refund policy, dispute contact and checkout disclosures _before_ accepting orders. Bidcraft does not currently implement subscriptions or a checkout.
3. **Review POPIA compliance.** Identify the responsible party and Information Officer; register the officer with the Information Regulator as applicable, assess lawful grounds, section 18 notices, adequate security safeguards, handling of data-subject requests and section 22 breach notifications. Check PAIA manual duties/exemptions with counsel and the Regulator.
4. **Verify hosting and third-party processors.** Inspect actual deployment/provider contracts, request logs, cookies, crash reports, CDN analytics, hosting region, retention, access controls, security posture, and transfers beyond South Africa. The code alone cannot establish those facts.
5. **Verify Gemini API plan and data agreement.** Google's Gemini API terms effective March 2026 allow model improvement and human review on unpaid services. Do not enable use with confidential/personal bid documents unless the actual billing account and contractual terms have been reviewed and the user's disclosure/authorisations are sufficient. Paid service is **not** zero retention by default. Document the business's processor agreement and transfer assessment.
6. **Review real workflows.** Test local storage clearing, saved draft export, failed AI calls, source data refresh, cache fallback, deadline time zones, misleading scores, and breach-response procedures. Validate that marketing, metadata and social posts make no unsupported promises.
7. **Source licensing.** Cite the original National Treasury portal, retain direct source links, verify applicable CC BY/PDDL terms and avoid republishing linked bid files as if all attachments were openly licensed.
8. **Keep notices current.** Version amendments and retain a changelog. Update policy text whenever accounts, payments, analytics, persistent alerts, new AI processors, hosted uploads, or new countries are introduced.
9. **Third-party marks and sample evidence.** Do not imply government affiliation, supplier verification or paid partnerships. Keep demo tenders and demo credentials unmistakably fictional.
10. **Independent legal review.** Have a qualified local adviser approve the final identity disclosures, terms and privacy policy. These pages **cannot** contract out of mandatory statutory duties or remedy technical privacy risks.

## Primary official references

- POPIA full Act: https://www.justice.gov.za/legislation/acts/2013-004.pdf
- Information Regulator: https://inforegulator.org.za/
- Information Regulator eServices: https://eservices.inforegulator.org.za/services.aspx
- ECTA (section 43): https://www.saflii.org/za/legis/consol_act/ecata2002427/
- National Treasury transparency and publication policy: https://data.etenders.gov.za/Home/LearnMore
- Gemini API terms: https://ai.google.dev/gemini-api/terms

No payment functionality, user accounts, automated legal eligibility verification, or reliable background tender alert service has been introduced by this change.

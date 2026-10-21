const resources = [
  { title: 'CSD supplier details', text: 'Check that your Central Supplier Database profile and supplier report are current where the bid requires them.', url: 'https://secure.csd.gov.za/', label: 'Central Supplier Database' },
  { title: 'SARS tax compliance', text: 'Follow the bid’s tax-status instructions. A Tax Compliance Status PIN lets an authorised recipient check your current status; it is not a permanent clearance certificate.', url: 'https://www.sars.gov.za/individuals/manage-your-tax-compliance-status/', label: 'SARS TCS guidance' },
  { title: 'B-BBEE & preference evidence', text: 'Read the bid’s stated preference system and specific goals. Supply the requested evidence, including a valid B-BBEE certificate or qualifying sworn affidavit where applicable.', url: 'https://www.thedtic.gov.za/financial-and-non-financial-support/b-bbee/', label: 'the dtic B-BBEE guidance' },
];

export function SouthAfricanBidGuide() {
  return <details className="rounded-2xl border border-neutral-200 bg-white p-5 text-xs leading-6 dark:border-neutral-800 dark:bg-[#161918]">
    <summary className="min-h-11 cursor-pointer font-bold text-[#12695C] dark:text-[#9BDBBE]">South African bidding guide</summary>
    <p className="mt-3 text-neutral-600 dark:text-neutral-400">Start with the bid document. Requirements vary by buyer and tender; these links help you prepare and do not verify your supplier status.</p>
    <ul className="mt-4 space-y-4">
      {resources.map((item) => <li key={item.title}><p className="font-bold">{item.title}</p><p className="text-neutral-600 dark:text-neutral-400">{item.text}</p><a className="inline-flex min-h-11 items-center font-semibold text-[#12695C] underline underline-offset-4 dark:text-[#9BDBBE]" href={item.url} target="_blank" rel="noopener noreferrer">{item.label} <span className="sr-only">(opens in a new tab)</span></a></li>)}
      <li><p className="font-bold">Bid forms, briefings & submission</p><p className="text-neutral-600 dark:text-neutral-400">Check the required SBD or MBD forms, signatures, compulsory briefing or site visit, and any CIDB grading or COIDA letter of good standing requested. Follow the specified submission method and SAST closing time. Confirm whether prices include VAT; Bidcraft does not add it automatically.</p></li>
    </ul>
  </details>;
}

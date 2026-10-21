import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalShell } from '@/components/legal/legal-shell';
import { legal } from '@/lib/legal';

export const metadata: Metadata = { title: 'Legal information and transparency', description: 'Bidcraft legal identity, privacy, terms, tender data provenance and AI limitations.' };
export default function LegalPage() {
  return <LegalShell current="/legal" title="Legal & transparency" subtitle="Understand who runs the service, where information comes from and what Bidcraft can — and cannot — do.">
    <section><h2>Who operates Bidcraft?</h2><p>Bidcraft is a software product. The legal operator is {legal.operator || 'not yet publicly identified — operator identity is pending verification'}. {legal.registration ? `Registration number: ${legal.registration}.` : 'No verified company registration number has been supplied.'}</p><p>Contact: {legal.email ? <a href={`mailto:${legal.email}`}>{legal.email}</a> : 'Business contact email pending'} · {legal.phone || 'Phone pending'}.</p><p>Address for service and correspondence: {legal.address || 'Verified physical/service address pending'}.</p></section>
    <section><h2>What are you agreeing to?</h2><p>Review the <Link href="/terms">terms of use</Link> before relying on Bidcraft. The software assists with preparation; it is not a procuring authority, law firm, compliance certifier or bid-submission service. No tender is submitted on your behalf.</p></section>
    <section><h2>How is data handled?</h2><p>The <Link href="/privacy">privacy notice</Link> explains browser-local storage, server processing and third-party AI requests. No account-based cloud sync or guaranteed background notification service exists in this release.</p></section>
    <section><h2>Which records are official?</h2><p>Our <Link href="/data-sources">data-source statement</Link> describes Treasury eTender data, partial coverage and links to the procuring body's original tender files. Bidcraft is an independent application, not affiliated with or endorsed by National Treasury.</p></section>
    <section><h2>What can AI verify?</h2><p><Link href="/ai-disclosure">AI limitations</Link> distinguish generated drafting suggestions and automated review scores from verified statutory eligibility, real company qualifications and legal advice.</p></section>
    <section><h2>Regulatory contacts</h2><p>In South Africa, the <a href="https://inforegulator.org.za/" target="_blank" rel="noopener noreferrer">Information Regulator</a> oversees POPIA and PAIA. Requests relating to your own data should first be directed to Bidcraft's operator using the published contact information once completed.</p></section>
  </LegalShell>;
}

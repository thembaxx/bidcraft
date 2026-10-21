import { TenderProject, VaultDocument } from './types';
import { deterministicEmbedding } from './search';
import { formatRand } from './locale';

const RAW_VAULT_DOCS: Omit<VaultDocument, 'embedding'>[] = [
  {
    id: 'vault-za-iso-27001',
    title: 'ISO/IEC 27001:2022 & POPIA Security Controls',
    category: 'ISO & Security Cert',
    dateUpdated: '2026-08-14',
    referenceCode: 'DEMO-SEC-27001-ZA',
    excerpt: 'Certified zero-trust cloud infrastructure, AES-256 encryption at rest, TLS 1.3 in transit, and 24/7 security operations monitoring.',
    fullText:
      'Example Infrastructure Systems (Pty) Ltd holds active ISO/IEC 27001:2022 certification (example reference DEMO-ISO-27001) valid through December 2028. All municipal and government telemetry data is encrypted with FIPS 140-3 validated AES-256 modules at rest and TLS 1.3 in transit. The example contract specifies South African data centres. The example security schedule also describes access controls, incident procedures and safeguards for patient information; these must be verified against actual records.',
  },
  {
    id: 'vault-za-past-bid-ethekwini',
    title: 'eThekwini Smart Grid & EV Telemetry Deployment (Example Contract R76M)',
    category: 'Past Winning Bid',
    dateUpdated: '2026-04-22',
    referenceCode: 'DEMO-ETH-EV-2025',
    excerpt: 'Delivered 1,450 OCPP 2.0.1 compliant smart charging nodes across 42 municipal depots with 99.96% measured uptime.',
    fullText:
      'Contract Ref: DEMO-ETH-EV-2025. Successfully engineered, commissioned, and maintained 1,450 dual-socket OCPP 2.0.1 fast chargers and load-balancing edge controllers across 42 municipal sites for eThekwini municipal depot programme. Achieved 99.96% operational availability over 18 consecutive months, exceeding this example contract’s 99.5% SLA requirement. Automated dynamic load shedding reduced depot peak grid draw by 34%.',
  },
  {
    id: 'vault-za-indemnity',
    title: 'Public Liability, Professional Indemnity & Bonding Schedule (R25M)',
    category: 'Statutory & Legal',
    dateUpdated: '2026-09-01',
    referenceCode: 'DEMO-INS-2026-ZA',
    excerpt: 'R25 000 000 Public & Product Liability, R15 000 000 Professional Indemnity, and 10% Performance Bond facility.',
    fullText:
      'Illustrative South African insurance schedule (DEMO-INS-ZA-26): Employer’s Liability R10 000 000 per occurrence; Public & Product Liability R25 000 000 aggregate; Professional Indemnity R15 000 000 any one claim. Includes pre-approved parent company guarantee and on-demand performance bond capacity up to 15% of total contract value for the requirements of this example contract.',
  },
  {
    id: 'vault-za-fin-audit-2025',
    title: 'Example Audited Financial Statements FY2023–2025',
    category: 'Financial Audit',
    dateUpdated: '2026-05-19',
    referenceCode: 'DEMO-FIN-AUD-25',
    excerpt: '3-year audited turnover (R284M FY25), current ratio 2.4x, net positive cash reserves of R62M.',
    fullText:
      'Illustrative audited financial statements for the example company. Annual turnover: FY2023 R198M, FY2024 R241M, FY2025 R284M. EBITDA margin 18.6%. Current liquidity ratio 2.42x with zero long-term debt covenants. The example company reports that 97.4% of SMME supply chain invoices were settled within 24 days.',
  },
  {
    id: 'vault-za-local-development',
    title: 'Environmental Management & Local Enterprise Development Plan',
    category: 'Statutory & Legal',
    dateUpdated: '2026-07-10',
    referenceCode: 'DEMO-LOCAL-2026',
    excerpt: 'Example Scope 1, 2 & 3 baseline with 25% local SMME subcontracting and 14 regional STEM learnerships.',
    fullText:
      'Compliant with the environmental requirements of this example tender and ISO 14001:2015. Verified Scope 1 & 2 emissions reduced by 41% since 2021 baseline. Commits 12.5% of contract value to regional social value initiatives: 14 full-time electrical & software learnerships, 100% electric field service fleet, and minimum 25% tier-2 spend allocated to local micro-SMMEs.',
  },
];

export const INITIAL_VAULT_DOCS: VaultDocument[] = RAW_VAULT_DOCS.map((doc) => ({
  ...doc,
  title: `${doc.title} (demonstration)`,
  fullText: `DEMONSTRATION ONLY — fictional company evidence; not evidence of your organisation’s capabilities. ${doc.fullText}`,
  embedding: deterministicEmbedding(`${doc.title} ${doc.excerpt} ${doc.fullText}`),
}));

const CLAUSES_TENDER_1 = [
  {
    id: 'cl-101',
    code: 'SEC-4.1',
    title: 'Sovereign Cloud Data Residency & ISO 27001 Telemetry Security',
    mandatory: true,
    category: 'Security & ISO' as const,
    originalText:
      'The Contractor MUST maintain valid ISO/IEC 27001:2022 certification and guarantee that all telemetry, ANPR, and grid load data remains exclusively within South African data centres specified in this example contract encrypted with FIPS 140-3 AES-256.',
    proposalSectionTitle: 'Section 4.1 — Sovereign Cloud & Cryptographic Architecture',
    proposalResponseText:
      'Example Infrastructure Systems (Pty) Ltd maintains full ISO/IEC 27001:2022 certification (Ref: DEMO-ISO-27001). All grid and charger telemetry is encrypted at rest using FIPS 140-3 validated AES-256 modules and transmitted over mutually authenticated TLS 1.3 channels. Primary and disaster-recovery clusters reside strictly within South African facilities (Johannesburg & Cape Town) required by this example contract.',
    complianceStatus: 'compliant' as const,
    confidenceScore: 98,
    matchedVaultDocIds: ['vault-za-iso-27001'],
    aiNote: 'Exact match verified against DEMO-ISO-27001 certificate and South African hosting architecture.',
  },
  {
    id: 'cl-102',
    code: 'TEC-2.3',
    title: 'OCPP 2.0.1 Protocol Interoperability & 99.5% Network Uptime SLA',
    mandatory: true,
    category: 'Technical Architecture' as const,
    originalText:
      'All proposed hardware and central management software must natively support OCPP 2.0.1 with ISO 15118 Plug & Charge, guaranteeing a minimum 99.5% quarterly availability SLA across all 850 municipal bays with automated load shedding.',
    proposalSectionTitle: 'Section 2.3 — OCPP 2.0.1 Hardware & High-Availability SLA',
    proposalResponseText:
      'Our platform natively executes OCPP 2.0.1 and ISO 15118-20 Plug & Charge across all 850 municipal bays. Drawing directly from our eThekwini municipal depot programme deployment (1,450 nodes, 99.96% measured availability), we commit to a contractually binding 99.8% quarterly uptime SLA backed by autonomous edge load-balancing.',
    complianceStatus: 'compliant' as const,
    confidenceScore: 95,
    matchedVaultDocIds: ['vault-za-past-bid-ethekwini'],
    aiNote: 'Substantiated with eThekwini Smart Grid past performance (99.96% uptime across 1,450 nodes).',
  },
  {
    id: 'cl-103',
    code: 'LEG-7.2',
    title: 'Statutory Indemnity Limits & 10% On-Demand Performance Bond',
    mandatory: true,
    category: 'Legal & Statutory' as const,
    originalText:
      'Bidders must evidence a minimum R20 000 000 Public Liability policy, R10 000 000 Professional Indemnity cover, and provide an unconditional 10% Performance Bond issued by a surety acceptable under this example tender within 14 days of award.',
    proposalSectionTitle: 'Section 7.2 — Insurance Coverage & Financial Surety',
    proposalResponseText:
      'We maintain comprehensive Public Liability insurance of R15 000 000 and Professional Indemnity cover of R10 000 000. A parent company letter of comfort can be supplied upon contract signature in lieu of a performance bond.',
    complianceStatus: 'non-compliant' as const,
    confidenceScore: 42,
    matchedVaultDocIds: ['vault-za-indemnity'],
    aiNote: 'CRITICAL GAP: Draft states R15M Public Liability and offers a letter of comfort, violating the mandatory R20M threshold and 10% Performance Bond requirement. Vault doc DEMO-INS-2026-ZA records that the example company holds R25M Public Liability and a 15% Bond facility.',
  },
  {
    id: 'cl-104',
    code: 'ENV-9.4',
    title: 'Environmental Plan & 20% Local SMME Subcontracting',
    mandatory: true,
    category: 'Financial & SLA' as const,
    originalText:
      'Under this example tender’s environmental requirements, the Supplier shall submit a board-signed Carbon Reduction Plan committing to Net Zero by 2040 and allocate at least 20% of total installation spend to local SMMEs within Tshwane.',
    proposalSectionTitle: 'Section 9.4 — Environmental Plan & Local Enterprise Development',
    proposalResponseText:
      'Our sustainability charter addresses the example tender’s environmental requirements with a verified Net Zero target of 2035 (5 years ahead of authority mandate). However, local SMME subcontracting percentage is currently listed as TBD pending final civils subcontractor selection.',
    complianceStatus: 'partial' as const,
    confidenceScore: 74,
    matchedVaultDocIds: ['vault-za-local-development'],
    aiNote: 'PARTIAL: The example Net Zero 2035 is compliant, but leaving SMME subcontracting as "TBD" risks technical disqualification. Inject our standard 25% tier-2 SMME commitment from DEMO-LOCAL-2026.',
  },
];

export const INITIAL_TENDERS: TenderProject[] = [
  {
    isDemo: true,
    id: 'demo-za-grid-2026',
    title: 'Tshwane Municipal EV Charging & Grid Infrastructure',
    Authority: 'City of Tshwane (example buyer)',
    rfpNumber: 'DEMO-TSH-2026-884',
    budget: formatRand(85000000),
    deadline: '14 Nov 2026, 17:00 SAST',
    activeDays: 3,
    stage: 'propose',
    leadScore: 90,
    grade: 'Grade A',
    statusLabel: 'Steady',
    ownerName: 'Naledi Mokoena',
    ownerRole: 'Lead Bid Architect',
    AvatarUrl: '/assets/aistudio/IMG_5846_9eff926d.jpeg',
    purchaseTimeframe: 'Award scheduled Q1 2027',
    procurementType: 'Open competitive bid',
    executiveSummary:
      'Example Infrastructure Systems (Pty) Ltd submits this compliant technical and commercial proposal for the Tshwane Autonomous Grid & EV Infrastructure programme (Ref: DEMO-TSH-2026-884). Leveraging our proven deployment of 1,450 OCPP 2.0.1 smart charging nodes in eThekwini (99.96% availability) and South African cloud control plane described in the example ISO/IEC 27001:2022 schedule, we propose delivery within the R85 million capital envelope.',
    clauses: CLAUSES_TENDER_1,
    discrepancies: [
      {
        id: 'disc-1',
        clauseCode: 'LEG-7.2',
        severity: 'critical',
        issueTitle: 'Public Liability Under-Stated (R15M vs R20M) & Missing 10% Bond',
        tenderRequirement: 'Minimum R20M Public Liability, R10M Professional Indemnity, and unconditional 10% Performance Bond.',
        currentProposalText: 'States R15 000 000 Public Liability and proposes a letter of comfort instead of a 10% surety bond.',
        vaultEvidenceCited: 'DEMO-INS-2026-ZA (example South African insurance schedule: R25M Public Liability, R15M Indemnity & 15% Bond Facility)',
        recommendedFix:
          'Example Infrastructure Systems (Pty) Ltd cites the illustrative South African insurance schedule (DEMO-INS-ZA-26), providing R25 000 000 Public & Product Liability (exceeding the R20M mandate) and R15 000 000 Professional Indemnity cover. Furthermore, we confirm an unconditional 10% On-Demand Performance Bond issued within 7 days of contract award.',
        resolved: false,
      },
      {
        id: 'disc-2',
        clauseCode: 'ENV-9.4',
        severity: 'warning',
        issueTitle: 'Unquantified Local SMME Spend ("TBD" vs Mandatory 20% Floor)',
        tenderRequirement: 'Allocate at least 20% of total installation spend to local SMMEs within Tshwane + environmental plan.',
        currentProposalText: 'Local SMME subcontracting percentage is currently listed as TBD pending final civils selection.',
        vaultEvidenceCited: 'DEMO-LOCAL-2026 (Example environmental plan: 25% Tier-2 SMME Spend & 14 Regional Learnerships)',
        recommendedFix:
          'To address this example tender’s environmental requirements and ISO 14001:2015, our board-signed Carbon Reduction Plan commits to Net Zero by 2035. We contractually ring-fence 25% of total installation spend (R21 250 000) for Tshwane micro-SMMEs and fund 14 regional electrical and software learnerships.',
        resolved: false,
      },
    ],
    versions: [
      {
        id: 'ver-3',
        versionNumber: 'v1.3',
        timestamp: '2026-10-21T07:15:00+02:00',
        author: 'Naledi Mokoena',
        triggerType: 'Manual Edit',
        summary: 'Refined OCPP 2.0.1 SLA metrics with eThekwini municipal depot programme reference telemetry.',
        complianceScoreSnapshot: 90,
        executiveSummarySnapshot:
          'Example Infrastructure Systems (Pty) Ltd submits this compliant technical and commercial proposal for the Tshwane Autonomous Grid & EV Infrastructure programme (Ref: DEMO-TSH-2026-884). Leveraging our proven deployment of 1,450 OCPP 2.0.1 smart charging nodes in eThekwini (99.96% availability) and South African cloud control plane described in the example ISO/IEC 27001:2022 schedule, we propose delivery within the R85 million capital envelope.',
        clausesSnapshot: CLAUSES_TENDER_1,
      },
      {
        id: 'ver-2',
        versionNumber: 'v1.2',
        timestamp: '2026-10-20T18:40:00+02:00',
        author: 'Bidcraft AI',
        triggerType: 'OCR Clause Sync',
        summary: 'Imported example Addendum #2; mapped the contract’s South African hosting requirement.',
        complianceScoreSnapshot: 84,
        executiveSummarySnapshot:
          'Initial technical response for Tshwane Municipal EV Charging tender (DEMO-TSH-2026-884). Incorporates South African data centre hosting and OCPP hardware architecture.',
        clausesSnapshot: CLAUSES_TENDER_1.map((c) =>
          c.code === 'TEC-2.3'
            ? {
                ...c,
                proposalResponseText:
                  'Our hardware supports OCPP 2.0.1 and targets a 99.5% availability SLA across municipal bays using cloud load balancing.',
                confidenceScore: 81,
              }
            : c
        ),
      },
      {
        id: 'ver-1',
        versionNumber: 'v1.0',
        timestamp: '2026-10-19T11:05:00+02:00',
        author: 'Bidcraft AI',
        triggerType: 'AI Auto-Draft',
        summary: 'First example proposal draft based on demonstration evidence.',
        complianceScoreSnapshot: 72,
        executiveSummarySnapshot:
          'Baseline auto-generated draft for Tshwane EV Infrastructure tender based on standard corporate boilerplate.',
        clausesSnapshot: CLAUSES_TENDER_1.map((c) =>
          c.code === 'SEC-4.1'
            ? {
                ...c,
                proposalResponseText:
                  'All cloud data is encrypted with AES-256 and hosted in offshore cloud regions with ISO 27001 controls.',
                complianceStatus: 'partial' as const,
                confidenceScore: 68,
              }
            : c
        ),
      },
    ],
  },
  {
    isDemo: true,
    id: 'demo-za-health-2026',
    title: 'Gauteng Clinical Imaging & HL7 FHIR Integration',
    Authority: 'Gauteng Department of Health (example buyer)',
    rfpNumber: 'DEMO-GDH-2026-419',
    budget: formatRand(58000000),
    deadline: '28 Nov 2026, 12:00 SAST',
    activeDays: 6,
    stage: 'develop',
    leadScore: 83,
    grade: 'Grade A-',
    statusLabel: 'Active Audit',
    ownerName: 'Ayesha Naidoo',
    ownerRole: 'Compliance Counsel',
    AvatarUrl: '/assets/aistudio/IMG_5846_9eff926d.jpeg',
    purchaseTimeframe: 'Award scheduled Q1 2027',
    procurementType: 'Request for Proposal',
    executiveSummary:
      'Turnkey clinical data mesh and zero-trust FHIR gateway engineered for Gauteng public hospitals in this example. POPIA safeguards and contractual South African hosting supported by the example security schedule, and sub-50ms diagnostic image routing.',
    clauses: [
      {
        id: 'cl-201',
        code: 'HEALTH-IG-1.1',
        title: 'POPIA Patient Information Safeguards & Contractual Hosting',
        mandatory: true,
        category: 'Security & ISO',
        originalText:
          'This example tender requires documented POPIA safeguards for patient information, access controls and incident procedures, and hosting in South Africa as a contractual requirement.',
        proposalSectionTitle: 'Section 1.1 — POPIA Safeguards & Contractual Data Hosting',
        proposalResponseText:
          'The example security schedule describes access controls, incident procedures and ISO/IEC 27001:2022 controls in South African facilities. The bid team must verify the underlying records.',
        complianceStatus: 'compliant',
        confidenceScore: 96,
        matchedVaultDocIds: ['vault-za-iso-27001'],
        aiNote: 'Matched with ISO 27001 South African security controls.',
      },
      {
        id: 'cl-202',
        code: 'HEALTH-FIN-3.2',
        title: 'Economic & Financial Standing — Minimum R150M Annual Turnover',
        mandatory: true,
        category: 'Financial & SLA',
        originalText:
          'Bidders must demonstrate audited annual turnover exceeding R150 000 000 for each of the past three financial years with a current liquidity ratio above 1.5x.',
        proposalSectionTitle: 'Section 3.2 — Three-Year Audited Financial Standing',
        proposalResponseText:
          'Example audited turnover: FY23 R198M, FY24 R241M, FY25 R284M with a 2.42x current liquidity ratio.',
        complianceStatus: 'compliant',
        confidenceScore: 99,
        matchedVaultDocIds: ['vault-za-fin-audit-2025'],
        aiNote: 'Exceeds R150M turnover threshold across all 3 audited years.',
      },
    ],
    discrepancies: [],
    versions: [
      {
        id: 'ver-health-1',
        versionNumber: 'v1.0',
        timestamp: '2026-10-20T14:20:00+02:00',
        author: 'Ayesha Naidoo',
        triggerType: 'AI Auto-Draft',
        summary: 'Generated example POPIA safeguard and financial standing schedules.',
        complianceScoreSnapshot: 83,
        executiveSummarySnapshot:
          'Turnkey clinical data mesh and zero-trust FHIR gateway engineered for Gauteng public hospitals in this example.',
        clausesSnapshot: [],
      },
    ],
  },
  {
    isDemo: true,
    id: 'demo-za-port-2026',
    title: 'Durban Port Private 5G & Digital Twin Tender',
    Authority: 'Transnet National Ports Authority (example buyer)',
    rfpNumber: 'DEMO-DBN-2026-112',
    budget: formatRand(122000000),
    deadline: '09 Dec 2026, 16:00 SAST',
    activeDays: 11,
    stage: 'qualify',
    leadScore: 72,
    grade: 'Grade B+',
    statusLabel: 'Qualification',
    ownerName: 'Sipho Dlamini',
    ownerRole: 'Principal RF Systems Lead',
    AvatarUrl: '/assets/aistudio/IMG_5846_9eff926d.jpeg',
    purchaseTimeframe: 'Award scheduled Q2 2027',
    procurementType: 'Request for Proposal',
    executiveSummary:
      'High-resilience private standalone 5G network and real-time crane telemetry digital twin for automated container berths, backed by R25M example marine & public liability cover.',
    clauses: [
      {
        id: 'cl-301',
        code: 'MAR-SLA-5.0',
        title: 'Mission-Critical 99.95% Berth Telemetry Availability',
        mandatory: true,
        category: 'Technical Architecture',
        originalText:
          'The private wireless and edge compute fabric must sustain 99.95% availability across all automated quay cranes.',
        proposalSectionTitle: 'Section 5.0 — High-Availability Edge Fabric',
        proposalResponseText:
          'Engineered with dual-redundant core routing and proven 99.96% operational availability from our eThekwini municipal telemetry network.',
        complianceStatus: 'compliant',
        confidenceScore: 92,
        matchedVaultDocIds: ['vault-za-past-bid-ethekwini'],
        aiNote: 'Cross-referenced with eThekwini 99.96% availability evidence.',
      },
    ],
    discrepancies: [],
    versions: [
      {
        id: 'ver-mar-1',
        versionNumber: 'v1.0',
        timestamp: '2026-10-18T09:30:00+02:00',
        author: 'Sipho Dlamini',
        triggerType: 'AI Auto-Draft',
        summary: 'Initial qualification matrix and SLA cross-reference.',
        complianceScoreSnapshot: 72,
        executiveSummarySnapshot:
          'High-resilience private standalone 5G network and real-time crane telemetry digital twin for automated container berths.',
        clausesSnapshot: [],
      },
    ],
  },
];

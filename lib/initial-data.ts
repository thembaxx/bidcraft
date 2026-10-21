import { TenderProject, VaultDocument } from './types';
import { deterministicEmbedding } from './search';

const RAW_VAULT_DOCS: Omit<VaultDocument, 'embedding'>[] = [
  {
    id: 'vault-iso-27001',
    title: 'ISO/IEC 27001:2022 & SOC2 Type II Information Security Certificate',
    category: 'ISO & Security Cert',
    dateUpdated: '2026-08-14',
    referenceCode: 'CERT-SEC-27001-UK',
    excerpt: 'Certified zero-trust cloud infrastructure, AES-256 encryption at rest, TLS 1.3 in transit, and 24/7 sovereign SOC monitoring.',
    fullText:
      'Bidcraft Infrastructure Systems Ltd holds active ISO/IEC 27001:2022 Certification (Cert No. BSI-884920) valid through December 2028. All municipal and government telemetry data is encrypted with FIPS 140-3 validated AES-256 modules at rest and TLS 1.3 in transit. Data residency is strictly enforced within UK & EU sovereign data centers with zero third-party sub-processor transfer.',
  },
  {
    id: 'vault-past-bid-bristol',
    title: 'Bristol Smart Grid & EV Telemetry Deployment (Won Bid £3.8M)',
    category: 'Past Winning Bid',
    dateUpdated: '2026-04-22',
    referenceCode: 'BID-2025-BRS-09',
    excerpt: 'Delivered 1,450 OCPP 2.0.1 compliant smart charging nodes across 42 municipal depots with 99.96% measured uptime.',
    fullText:
      'Contract Ref: BCC-EV-2025. Successfully engineered, commissioned, and maintained 1,450 dual-socket OCPP 2.0.1 fast chargers and load-balancing edge controllers across 42 municipal sites for Bristol City Council. Achieved 99.96% operational availability over 18 consecutive months, exceeding the statutory 99.5% SLA requirement. Automated dynamic load shedding reduced depot peak grid draw by 34%.',
  },
  {
    id: 'vault-statutory-indemnity',
    title: 'Public Liability, Professional Indemnity & Bonding Schedule (£25M)',
    category: 'Statutory & Legal',
    dateUpdated: '2026-09-01',
    referenceCode: 'LEG-INS-2026-LLOYDS',
    excerpt: '£25,000,000 Public & Product Liability, £15,000,000 Professional Indemnity, and 10% Performance Bond facility.',
    fullText:
      'Underwritten by Lloyd’s Syndicate 2987 (Policy #LL-994021-26): Employer’s Liability £10,000,000 per occurrence; Public & Product Liability £25,000,000 aggregate; Professional Indemnity £15,000,000 any one claim. Includes pre-approved parent company guarantee and on-demand performance bond capacity up to 15% of total contract value for UK Public Contracts Regulations 2015 compliance.',
  },
  {
    id: 'vault-fin-audit-2025',
    title: 'Audited Financial Statements FY2023–2025 & Dun & Bradstreet 5A1 Rating',
    category: 'Financial Audit',
    dateUpdated: '2026-05-19',
    referenceCode: 'FIN-AUD-KPMG-25',
    excerpt: '3-year audited turnover (£28.4M FY25), current ratio 2.4x, net positive cash reserves of £6.2M.',
    fullText:
      'Independent audit certified by KPMG LLP. Annual turnover: FY2023 £19.8M, FY2024 £24.1M, FY2025 £28.4M. EBITDA margin 18.6%. Current liquidity ratio 2.42x with zero long-term debt covenants. Prompt Payment Code signatory with 97.4% of SME supply chain invoices settled within 24 days.',
  },
  {
    id: 'vault-social-value-netzero',
    title: 'PPN 06/21 Carbon Reduction Plan & Social Value Charter (Net Zero 2035)',
    category: 'Statutory & Legal',
    dateUpdated: '2026-07-10',
    referenceCode: 'ENV-PPN0621-2026',
    excerpt: 'PPN 06/21 compliant Scope 1, 2 & 3 baseline with 22% local SME subcontracting and 14 regional STEM apprenticeships.',
    fullText:
      'Compliant with UK Procurement Policy Note PPN 06/21 and ISO 14001:2015. Verified Scope 1 & 2 emissions reduced by 41% since 2021 baseline. Commits 12.5% of contract value to regional social value initiatives: 14 full-time Level 4 electrical & software apprenticeships, 100% electric field service fleet, and minimum 25% tier-2 spend allocated to local micro-SMEs.',
  },
];

export const INITIAL_VAULT_DOCS: VaultDocument[] = RAW_VAULT_DOCS.map((doc) => ({
  ...doc,
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
      'The Contractor MUST maintain valid ISO/IEC 27001:2022 certification and guarantee that all telemetry, ANPR, and grid load data remains exclusively within UK sovereign data centers encrypted with FIPS 140-3 AES-256.',
    proposalSectionTitle: 'Section 4.1 — Sovereign Cloud & Cryptographic Architecture',
    proposalResponseText:
      'Bidcraft Infrastructure Systems maintains full ISO/IEC 27001:2022 certification (Ref: BSI-884920). All grid and charger telemetry is encrypted at rest using FIPS 140-3 validated AES-256 modules and transmitted over mutually authenticated TLS 1.3 channels. Primary and disaster-recovery clusters reside strictly within UK sovereign facilities (London & Manchester Tier-IV).',
    complianceStatus: 'compliant' as const,
    confidenceScore: 98,
    matchedVaultDocIds: ['vault-iso-27001'],
    aiNote: 'Exact match verified against BSI-884920 certificate and UK sovereign hosting architecture.',
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
      'Our platform natively executes OCPP 2.0.1 and ISO 15118-20 Plug & Charge across all 850 municipal bays. Drawing directly from our Bristol City Council deployment (1,450 nodes, 99.96% measured availability), we commit to a contractually binding 99.8% quarterly uptime SLA backed by autonomous edge load-balancing.',
    complianceStatus: 'compliant' as const,
    confidenceScore: 95,
    matchedVaultDocIds: ['vault-past-bid-bristol'],
    aiNote: 'Substantiated with Bristol Smart Grid past performance (99.96% uptime across 1,450 nodes).',
  },
  {
    id: 'cl-103',
    code: 'LEG-7.2',
    title: 'Statutory Indemnity Limits & 10% On-Demand Performance Bond',
    mandatory: true,
    category: 'Legal & Statutory' as const,
    originalText:
      'Bidders must evidence a minimum £20,000,000 Public Liability policy, £10,000,000 Professional Indemnity cover, and provide an unconditional 10% Performance Bond issued by an A-rated UK surety within 14 days of award.',
    proposalSectionTitle: 'Section 7.2 — Insurance Coverage & Financial Surety',
    proposalResponseText:
      'We maintain comprehensive Public Liability insurance of £15,000,000 and Professional Indemnity cover of £10,000,000. A parent company letter of comfort can be supplied upon contract signature in lieu of a performance bond.',
    complianceStatus: 'non-compliant' as const,
    confidenceScore: 42,
    matchedVaultDocIds: ['vault-statutory-indemnity'],
    aiNote: 'CRITICAL GAP: Draft states £15M Public Liability and offers a letter of comfort, violating the mandatory £20M threshold and 10% Performance Bond requirement. Vault doc LEG-INS-2026-LLOYDS proves we hold £25M Public Liability and a 15% Bond facility.',
  },
  {
    id: 'cl-104',
    code: 'ENV-9.4',
    title: 'PPN 06/21 Carbon Reduction Plan & 20% Local SME Subcontracting',
    mandatory: true,
    category: 'Financial & SLA' as const,
    originalText:
      'In accordance with PPN 06/21, the Supplier shall submit a board-signed Carbon Reduction Plan committing to Net Zero by 2040 and allocate at least 20% of total installation spend to local SMEs within Greater Manchester.',
    proposalSectionTitle: 'Section 9.4 — PPN 06/21 Net Zero & Regional Social Value',
    proposalResponseText:
      'Our sustainability charter aligns with PPN 06/21 with a verified Net Zero target of 2035 (5 years ahead of authority mandate). However, local SME subcontracting percentage is currently listed as TBD pending final civils subcontractor selection.',
    complianceStatus: 'partial' as const,
    confidenceScore: 74,
    matchedVaultDocIds: ['vault-social-value-netzero'],
    aiNote: 'PARTIAL: PPN 06/21 Net Zero 2035 is compliant, but leaving SME subcontracting as "TBD" risks technical disqualification. Inject our standard 25% tier-2 SME commitment from ENV-PPN0621-2026.',
  },
];

export const INITIAL_TENDERS: TenderProject[] = [
  {
    id: 'tender-uk-grid-2026',
    title: 'Greater Manchester Autonomous Grid & EV Infrastructure RFP',
    Authority: 'Transport for Greater Manchester (TfGM)',
    rfpNumber: 'TFGM-PROC-2026-884',
    budget: '£4,250,000.00',
    deadline: '2026-11-14 17:00 GMT',
    activeDays: 3,
    stage: 'propose',
    leadScore: 90,
    grade: 'Grade A',
    statusLabel: 'Steady',
    ownerName: 'Gabriela Christiansen',
    ownerRole: 'Lead Bid Architect',
    AvatarUrl: '/assets/aistudio/IMG_5846_9eff926d.jpeg',
    purchaseTimeframe: 'Award scheduled Q1 2027',
    procurementType: 'UK Open Procedure (PCR 2015)',
    executiveSummary:
      'Bidcraft Infrastructure Systems submits this compliant technical and commercial proposal for the Greater Manchester Autonomous Grid & EV Infrastructure programme (Ref: TFGM-PROC-2026-884). Leveraging our proven deployment of 1,450 OCPP 2.0.1 smart charging nodes in Bristol (99.96% availability) and ISO/IEC 27001:2022 certified UK sovereign cloud control plane, we deliver zero-risk turnkey execution within the £4.25M capital envelope.',
    clauses: CLAUSES_TENDER_1,
    discrepancies: [
      {
        id: 'disc-1',
        clauseCode: 'LEG-7.2',
        severity: 'critical',
        issueTitle: 'Public Liability Under-Stated (£15M vs £20M) & Missing 10% Bond',
        tenderRequirement: 'Minimum £20M Public Liability, £10M Professional Indemnity, and unconditional 10% Performance Bond.',
        currentProposalText: 'States £15,000,000 Public Liability and proposes a letter of comfort instead of a 10% surety bond.',
        vaultEvidenceCited: 'LEG-INS-2026-LLOYDS (Lloyd’s Syndicate 2987 Policy: £25M Public Liability, £15M Indemnity & 15% Bond Facility)',
        recommendedFix:
          'Bidcraft Infrastructure Systems evidences full statutory compliance underwritten by Lloyd’s Syndicate 2987 (Policy #LL-994021-26), providing £25,000,000 Public & Product Liability (exceeding the £20M mandate) and £15,000,000 Professional Indemnity cover. Furthermore, we confirm an unconditional 10% On-Demand Performance Bond issued within 7 days of contract award.',
        resolved: false,
      },
      {
        id: 'disc-2',
        clauseCode: 'ENV-9.4',
        severity: 'warning',
        issueTitle: 'Unquantified Local SME Spend ("TBD" vs Mandatory 20% Floor)',
        tenderRequirement: 'Allocate at least 20% of total installation spend to local SMEs within Greater Manchester + PPN 06/21 plan.',
        currentProposalText: 'Local SME subcontracting percentage is currently listed as TBD pending final civils selection.',
        vaultEvidenceCited: 'ENV-PPN0621-2026 (PPN 06/21 Charter: 25% Tier-2 SME Spend & 14 Regional Apprenticeships)',
        recommendedFix:
          'In full compliance with PPN 06/21 and ISO 14001:2015, our board-signed Carbon Reduction Plan commits to Net Zero by 2035. We contractually ring-fence 25% of total installation spend (£1,062,500) for Greater Manchester micro-SMEs and fund 14 regional Level 4 electrical and software apprenticeships.',
        resolved: false,
      },
    ],
    versions: [
      {
        id: 'ver-3',
        versionNumber: 'v1.3',
        timestamp: '2026-10-21 07:15',
        author: 'Gabriela Christiansen',
        triggerType: 'Manual Edit',
        summary: 'Refined OCPP 2.0.1 SLA metrics with Bristol City Council reference telemetry.',
        complianceScoreSnapshot: 90,
        executiveSummarySnapshot:
          'Bidcraft Infrastructure Systems submits this compliant technical and commercial proposal for the Greater Manchester Autonomous Grid & EV Infrastructure programme (Ref: TFGM-PROC-2026-884). Leveraging our proven deployment of 1,450 OCPP 2.0.1 smart charging nodes in Bristol (99.96% availability) and ISO/IEC 27001:2022 certified UK sovereign cloud control plane, we deliver zero-risk turnkey execution within the £4.25M capital envelope.',
        clausesSnapshot: CLAUSES_TENDER_1,
      },
      {
        id: 'ver-2',
        versionNumber: 'v1.2',
        timestamp: '2026-10-20 18:40',
        author: 'Bidcraft AI',
        triggerType: 'OCR Clause Sync',
        summary: 'Ingested Addendum #2 scanned PDF via Vision OCR; mapped ISO 27001 sovereign residency clause.',
        complianceScoreSnapshot: 84,
        executiveSummarySnapshot:
          'Initial technical response for Greater Manchester Autonomous Grid RFP (TFGM-PROC-2026-884). Incorporates UK sovereign data center hosting and OCPP hardware architecture.',
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
        timestamp: '2026-10-19 11:05',
        author: 'Bidcraft AI',
        triggerType: 'AI Auto-Draft',
        summary: 'First zero-shot proposal draft synthesized from 5 corporate vault documents.',
        complianceScoreSnapshot: 72,
        executiveSummarySnapshot:
          'Baseline auto-generated draft for TfGM EV Infrastructure tender based on standard corporate boilerplate.',
        clausesSnapshot: CLAUSES_TENDER_1.map((c) =>
          c.code === 'SEC-4.1'
            ? {
                ...c,
                proposalResponseText:
                  'All cloud data is encrypted with AES-256 and hosted in European cloud regions with ISO 27001 controls.',
                complianceStatus: 'partial' as const,
                confidenceScore: 68,
              }
            : c
        ),
      },
    ],
  },
  {
    id: 'tender-nhs-diagnostic-2026',
    title: 'NHS Trust Sovereign Clinical Imaging & HL7 FHIR Data Mesh',
    Authority: 'NHS England — London Digital Transformation',
    rfpNumber: 'NHSE-LDN-2026-419',
    budget: '£2,890,000.00',
    deadline: '2026-11-28 12:00 GMT',
    activeDays: 6,
    stage: 'develop',
    leadScore: 83,
    grade: 'Grade A-',
    statusLabel: 'Active Audit',
    ownerName: 'Halle Griffiths',
    ownerRole: 'Compliance Counsel',
    AvatarUrl: '/assets/aistudio/IMG_5846_9eff926d.jpeg',
    purchaseTimeframe: 'Award scheduled Q1 2027',
    procurementType: 'Competitive Flexible Procedure',
    executiveSummary:
      'Turnkey clinical data mesh and zero-trust FHIR gateway engineered for NHS England London Trusts. Full DSP Toolkit compliance, ISO 27001:2022 certified UK sovereign storage, and sub-50ms diagnostic image routing.',
    clauses: [
      {
        id: 'cl-201',
        code: 'NHS-IG-1.1',
        title: 'NHS Data Security & Protection Toolkit (DSPT) & UK GDPR Sovereignty',
        mandatory: true,
        category: 'Security & ISO',
        originalText:
          'Suppliers must exceed Standards Met on the NHS DSPT and ensure zero patient identifiable data transits outside UK sovereign jurisdiction.',
        proposalSectionTitle: 'Section 1.1 — NHS DSPT & Sovereign Data Enclave',
        proposalResponseText:
          'Verified Standards Exceeded on NHS DSPT (2025/26) paired with BSI ISO/IEC 27001:2022 UK sovereign enclaves.',
        complianceStatus: 'compliant',
        confidenceScore: 96,
        matchedVaultDocIds: ['vault-iso-27001'],
        aiNote: 'Matched with ISO 27001 UK sovereign security controls.',
      },
      {
        id: 'cl-202',
        code: 'NHS-FIN-3.2',
        title: 'Economic & Financial Standing — Minimum £15M Annual Turnover',
        mandatory: true,
        category: 'Financial & SLA',
        originalText:
          'Bidders must demonstrate audited annual turnover exceeding £15,000,000 for each of the past three financial years with a current liquidity ratio above 1.5x.',
        proposalSectionTitle: 'Section 3.2 — Three-Year Audited Financial Standing',
        proposalResponseText:
          'KPMG-audited turnover: FY23 £19.8M, FY24 £24.1M, FY25 £28.4M with a 2.42x current liquidity ratio.',
        complianceStatus: 'compliant',
        confidenceScore: 99,
        matchedVaultDocIds: ['vault-fin-audit-2025'],
        aiNote: 'Exceeds £15M turnover threshold across all 3 audited years.',
      },
    ],
    discrepancies: [],
    versions: [
      {
        id: 'ver-nhs-1',
        versionNumber: 'v1.0',
        timestamp: '2026-10-20 14:20',
        author: 'Halle Griffiths',
        triggerType: 'AI Auto-Draft',
        summary: 'Generated initial NHS DSPT and financial standing schedules.',
        complianceScoreSnapshot: 83,
        executiveSummarySnapshot:
          'Turnkey clinical data mesh and zero-trust FHIR gateway engineered for NHS England London Trusts.',
        clausesSnapshot: [],
      },
    ],
  },
  {
    id: 'tender-port-rotterdam-2026',
    title: 'North Sea Maritime Logistics Private 5G & Digital Twin Tender',
    Authority: 'Port of Felixstowe & Harwich Haven Consortium',
    rfpNumber: 'PFH-5G-2026-112',
    budget: '£6,100,000.00',
    deadline: '2026-12-09 16:00 GMT',
    activeDays: 11,
    stage: 'qualify',
    leadScore: 72,
    grade: 'Grade B+',
    statusLabel: 'Qualification',
    ownerName: 'Josiah Love',
    ownerRole: 'Principal RF Systems Lead',
    AvatarUrl: '/assets/aistudio/IMG_5846_9eff926d.jpeg',
    purchaseTimeframe: 'Award scheduled Q2 2027',
    procurementType: 'Negotiated Utility Tender',
    executiveSummary:
      'High-resilience private 5G SA network and real-time crane telemetry digital twin for automated container berths, backed by £25M Lloyd’s marine & public liability cover.',
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
          'Engineered with dual-redundant core routing and proven 99.96% operational availability from our Bristol municipal telemetry network.',
        complianceStatus: 'compliant',
        confidenceScore: 92,
        matchedVaultDocIds: ['vault-past-bid-bristol'],
        aiNote: 'Cross-referenced with Bristol 99.96% availability evidence.',
      },
    ],
    discrepancies: [],
    versions: [
      {
        id: 'ver-mar-1',
        versionNumber: 'v1.0',
        timestamp: '2026-10-18 09:30',
        author: 'Josiah Love',
        triggerType: 'AI Auto-Draft',
        summary: 'Initial qualification matrix and SLA cross-reference.',
        complianceScoreSnapshot: 72,
        executiveSummarySnapshot:
          'High-resilience private 5G SA network and real-time crane telemetry digital twin for automated container berths.',
        clausesSnapshot: [],
      },
    ],
  },
];

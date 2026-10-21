import { NextRequest, NextResponse } from 'next/server';
import { Type } from '@google/genai';
import { getGeminiClient, cosineSimilarity, deterministicEmbedding } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const ai = getGeminiClient();

    if (action === 'compliance_audit') {
      const { tenderTitle, clauses, vaultDocs } = payload;

      const prompt = `You are a Principal Government Procurement & Legal Compliance Auditor.
Analyze the following Tender Clauses and current Proposal Responses against our Corporate Vector Vault evidence for "${tenderTitle}".
Identify compliance status, confidence score (0-100), and concrete discrepancies with exact recommended wording that cites our Vault Evidence reference codes.

TENDER CLAUSES & CURRENT PROPOSAL:
${JSON.stringify(clauses, null, 2)}

CORPORATE VAULT EVIDENCE:
${JSON.stringify(
  vaultDocs.map((d: { id: string; referenceCode: string; title: string; fullText: string }) => ({
    id: d.id,
    referenceCode: d.referenceCode,
    title: d.title,
    fullText: d.fullText,
  })),
  null,
  2
)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallComplianceScore: {
                type: Type.NUMBER,
                description: 'Overall compliance score from 0 to 100.',
              },
              grade: {
                type: Type.STRING,
                description: 'Letter grade such as Grade A, Grade A+, or Grade B.',
              },
              auditSummary: {
                type: Type.STRING,
                description: 'Concise executive audit finding summary.',
              },
              discrepancies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    clauseCode: { type: Type.STRING },
                    severity: {
                      type: Type.STRING,
                      description: 'critical, warning, or verified',
                    },
                    issueTitle: { type: Type.STRING },
                    tenderRequirement: { type: Type.STRING },
                    currentProposalText: { type: Type.STRING },
                    vaultEvidenceCited: { type: Type.STRING },
                    recommendedFix: { type: Type.STRING },
                  },
                  required: [
                    'clauseCode',
                    'severity',
                    'issueTitle',
                    'tenderRequirement',
                    'currentProposalText',
                    'vaultEvidenceCited',
                    'recommendedFix',
                  ],
                },
              },
            },
            required: ['overallComplianceScore', 'grade', 'auditSummary', 'discrepancies'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return NextResponse.json({ result: parsed });
    }

    if (action === 'draft_clause') {
      const { clause, vaultDocs, mode } = payload;

      const prompt = `You are a Senior Bid & RFP Proposal Architect.
Rewrite and strengthen the Proposal Response for clause "${clause.code}: ${clause.title}".
Mode requested: "${mode || 'strict-compliance'}" (options: strict-compliance, executive-concise, technical-depth).

MANDATORY TENDER REQUIREMENT:
${clause.originalText}

CURRENT DRAFT RESPONSE:
${clause.proposalResponseText}

COMPANY VAULT EVIDENCE TO CITE:
${vaultDocs
  .map(
    (d: { referenceCode: string; title: string; fullText: string }) =>
      `[${d.referenceCode}] ${d.title}: ${d.fullText}`
  )
  .join('\n\n')}

Return JSON with the upgraded proposalResponseText, updated confidenceScore (92-100), and a brief aiNote explaining what evidence was cited.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              proposalResponseText: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER },
              aiNote: { type: Type.STRING },
              versionSummary: { type: Type.STRING },
            },
            required: ['proposalResponseText', 'confidenceScore', 'aiNote', 'versionSummary'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return NextResponse.json({ result: parsed });
    }

    if (action === 'ocr_extract') {
      const { base64Data, mimeType, rawText, vaultDocs } = payload;

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      if (base64Data && mimeType) {
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      }
      parts.push({
        text: `Extract all mandatory tender requirements or clauses from this scanned tender document / text, and immediately draft a compliant proposal response cross-referenced with our Corporate Vault:
${rawText ? `EXTRACTED TEXT / NOTES:\n${rawText}\n` : ''}
CORPORATE VAULT:
${JSON.stringify(
  vaultDocs.map((d: { id: string; referenceCode: string; title: string; fullText: string }) => ({
    id: d.id,
    referenceCode: d.referenceCode,
    title: d.title,
    fullText: d.fullText,
  }))
)}`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedRawText: { type: Type.STRING },
              clause: {
                type: Type.OBJECT,
                properties: {
                  code: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    description:
                      'One of: Legal & Statutory, Technical Architecture, Financial & SLA, Security & ISO',
                  },
                  originalText: { type: Type.STRING },
                  proposalSectionTitle: { type: Type.STRING },
                  proposalResponseText: { type: Type.STRING },
                  confidenceScore: { type: Type.NUMBER },
                  matchedVaultDocIds: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  aiNote: { type: Type.STRING },
                },
                required: [
                  'code',
                  'title',
                  'category',
                  'originalText',
                  'proposalSectionTitle',
                  'proposalResponseText',
                  'confidenceScore',
                  'matchedVaultDocIds',
                  'aiNote',
                ],
              },
            },
            required: ['extractedRawText', 'clause'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return NextResponse.json({ result: parsed });
    }

    if (action === 'vector_search') {
      const { query, vaultDocs } = payload;

      let queryVector: number[] = [];
      let docVectors: Record<string, number[]> = {};
      let usedLiveEmbedding = false;

      try {
        const embedRes = await ai.models.embedContent({
          model: 'gemini-embedding-2-preview',
          contents: [
            query,
            ...vaultDocs.map(
              (d: { title: string; excerpt: string; fullText: string }) =>
                `${d.title}. ${d.excerpt}. ${d.fullText}`
            ),
          ],
        });

        if (embedRes.embeddings && embedRes.embeddings.length === vaultDocs.length + 1) {
          queryVector = embedRes.embeddings[0].values || [];
          vaultDocs.forEach((d: { id: string }, idx: number) => {
            docVectors[d.id] = embedRes.embeddings?.[idx + 1]?.values || [];
          });
          usedLiveEmbedding = true;
        }
      } catch {
        // Fallback to deterministic vector similarity if embedding model is unavailable
        queryVector = deterministicEmbedding(query);
        vaultDocs.forEach((d: { id: string; title: string; excerpt: string; fullText: string }) => {
          docVectors[d.id] = deterministicEmbedding(`${d.title} ${d.excerpt} ${d.fullText}`);
        });
      }

      const ranked = vaultDocs
        .map((doc: { id: string; title: string; fullText: string }) => {
          const vec = docVectors[doc.id] || [];
          const rawSim = cosineSimilarity(queryVector, vec);
          // Boost keyword overlap for crystal-clear UX ranking
          const qWords = query
            .toLowerCase()
            .split(/\W+/)
            .filter((w: string) => w.length > 3);
          const docText = `${doc.title} ${doc.fullText}`.toLowerCase();
          const matches = qWords.filter((w: string) => docText.includes(w)).length;
          const lexicalBoost = qWords.length > 0 ? (matches / qWords.length) * 0.25 : 0;
          const score = Math.min(0.99, Math.max(0.45, rawSim + lexicalBoost));
          return {
            id: doc.id,
            similarityScore: Number(score.toFixed(4)),
          };
        })
        .sort(
          (a: { similarityScore: number }, b: { similarityScore: number }) =>
            b.similarityScore - a.similarityScore
        );

      return NextResponse.json({
        result: {
          ranked,
          usedLiveEmbedding,
          dimensions: queryVector.length || 64,
        },
      });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server AI processing error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

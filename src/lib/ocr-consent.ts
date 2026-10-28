export type DocumentEvidence = { page: number; text: string; source: 'pdf-text' | 'ocr' };
export function requiresHumanReview(evidence: DocumentEvidence): boolean {
  return !Number.isInteger(evidence.page) || evidence.page < 1 || !evidence.text.trim() || evidence.source === 'ocr';
}
export function canSendDocumentToOcr(consented: boolean, hasEmbeddedText: boolean): boolean {
  return consented && !hasEmbeddedText;
}

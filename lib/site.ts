export const site = {
  name: 'Bidcraft',
  title: 'Bidcraft — AI Tender & Proposal Workspace',
  description: 'Make every bid count. Organize tenders, draft evidence-backed proposals, compare requirements, review compliance, and keep every version in one workspace.',
};

export function getSiteUrl(): URL | undefined {
  try {
    const url = new URL(process.env.APP_URL || '');
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.') || url.hostname === 'localhost') return undefined;
    return new URL(url.origin);
  } catch { return undefined; }
}

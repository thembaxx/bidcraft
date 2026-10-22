export const ONBOARDING_STORAGE_KEY = 'bidcraft_onboarding_v1';
export const ONBOARDING_REPLAY_EVENT = 'bidcraft:replay-onboarding';

export type OnboardingGoal = 'discover' | 'prepare' | 'both';
export type OnboardingProfile = {
  goal: OnboardingGoal | null;
  province: string;
  keyword: string;
};
export type OnboardingRecord = OnboardingProfile & { status: 'completed' | 'skipped'; version: 1 };

export const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
] as const;

export const emptyOnboardingProfile: OnboardingProfile = {
  goal: null, province: '', keyword: '',
};

export function readOnboarding(): OnboardingRecord | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const record = data as Partial<OnboardingRecord>;
    if (record.version !== 1 || !['completed', 'skipped'].includes(record.status ?? '')) return null;
    if (record.goal !== null && record.goal !== 'discover' && record.goal !== 'prepare' && record.goal !== 'both') return null;
    if (typeof record.province !== 'string' || (record.province !== '' && !PROVINCES.some((p) => p === record.province))) return null;
    if (typeof record.keyword !== 'string' || record.keyword.length > 72) return null;
    return record as OnboardingRecord;
  } catch {
    return null;
  }
}

export function saveOnboarding(status: OnboardingRecord['status'], profile: OnboardingProfile): void {
  const record: OnboardingRecord = {
    version: 1, status,
    goal: profile.goal,
    province: PROVINCES.find((p) => p === profile.province) ?? '',
    keyword: profile.keyword.trim().slice(0, 72),
  };
  try { localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(record)); }
  catch { /* Storage may be unavailable. The flow still closes for this session. */ }
}

export function onboardingDestination(profile: OnboardingProfile): string {
  if (profile.goal === 'prepare') return '/#bid-studio';
  const params = new URLSearchParams();
  if (profile.province) params.set('province', profile.province);
  if (profile.keyword.trim()) params.set('q', profile.keyword.trim());
  return '/tenders' + (params.size ? '?' + params.toString() : '');
}

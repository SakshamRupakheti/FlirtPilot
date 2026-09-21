export type FeedbackEvent = {
  type: string;
  tier?: string;
  at: string;
  anonymousId: string;
  consent: "local_only";
};
export function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`flirtpilot:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function setLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(`flirtpilot:${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function trackFeedback(type: string, tier?: string) {
  let id = getLocal<string>("anonymousId", "");
  if (!id) {
    id = crypto.randomUUID();
    setLocal("anonymousId", id);
  }
  const existing = getLocal<FeedbackEvent[]>("feedback", []);
  setLocal("feedback", [
    ...(Array.isArray(existing) ? existing : []).slice(-199),
    {
      type,
      tier,
      at: new Date().toISOString(),
      anonymousId: id,
      consent: "local_only",
    },
  ]);
}

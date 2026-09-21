// A bounded per-isolate guard. Add a shared edge limiter before a public launch.
const buckets = new Map<string, { count: number; until: number }>();
export function allowRequest(key: string, now = Date.now()) {
  for (const [id, value] of buckets) {
    if (value.until <= now) buckets.delete(id);
  }
  const bucket = buckets.get(key);
  if (bucket) {
    if (bucket.count >= 15) return false;
    bucket.count++;
    return true;
  }
  if (buckets.size >= 10000) return false;
  buckets.set(key, { count: 1, until: now + 60000 });
  return true;
}

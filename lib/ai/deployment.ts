// A hosted process cannot reach the user's laptop through its own localhost.
// Keep the Vercel preview honest until an explicitly selected cloud provider is configured.
export function isHostedPreview() {
  return (
    process.env.VERCEL === "1" &&
    !(
      process.env.AI_PROVIDER === "openai" &&
      process.env.AI_API_KEY &&
      process.env.AI_MODEL
    )
  );
}

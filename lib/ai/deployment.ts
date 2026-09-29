// A hosted process cannot reach the user's laptop through its own localhost.
// Enable hosted inference only when the selected provider has its own credentials.
export function isHostedPreview() {
  return (
    process.env.VERCEL === "1" &&
    !(
      (process.env.AI_PROVIDER === "groq" &&
        (process.env.GROQ_API_KEY || process.env.Groq)) ||
      (process.env.AI_PROVIDER === "openai" &&
        process.env.AI_API_KEY &&
        process.env.AI_MODEL)
    )
  );
}

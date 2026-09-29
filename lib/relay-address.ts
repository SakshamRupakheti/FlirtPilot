export function relayAddress(value: string): string {
  const url = new URL(value.trim());
  if (
    url.protocol !== "https:" ||
    !/^[a-z0-9-]+\.trycloudflare\.com$/.test(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error(
      "Use the https://…trycloudflare.com address from your laptop.",
    );
  }
  return url.origin;
}
export type LaptopConnection = { url: string; token: string };

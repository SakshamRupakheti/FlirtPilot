"use client";
import { useState } from "react";
import { z } from "zod";
import { relayAddress, type LaptopConnection } from "@/lib/relay-address";

export function LaptopConnector({
  connection,
  onChange,
  disabled,
}: {
  connection: LaptopConnection | null;
  onChange: (connection: LaptopConnection | null) => void;
  disabled: boolean;
}) {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  async function connect(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setChecking(true);
    try {
      const address = relayAddress(url);
      const code = token.trim();
      if (!/^[a-f0-9]{64}$/.test(code))
        throw new Error("Copy the full connection code from your laptop.");
      const response = await fetch(address + "/health", {
        headers: { Authorization: `Bearer ${code}` },
        redirect: "error",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok)
        throw new Error(
          "Check the connection code and make sure your laptop is running.",
        );
      const data = z
        .object({
          service: z.literal("flirtpilot-local"),
          ready: z.literal(true),
        })
        .safeParse(await response.json());
      if (!data.success)
        throw new Error(
          "Start Ollama and download the model on your laptop first.",
        );
      onChange({ url: address, token: code });
      setToken("");
    } catch (error) {
      setError(
        error instanceof TypeError
          ? "Couldn’t reach your laptop. Check its tunnel address and internet connection."
          : error instanceof Error
            ? error.message
            : "Connection failed. Try again.",
      );
    } finally {
      setChecking(false);
    }
  }
  return (
    <section className="mb-6 rounded-2xl border border-pink-400/30 bg-pink-500/10 p-5 text-sm">
      <h2 className="mb-2 font-semibold text-pink-100">
        {connection ? "Your laptop is connected" : "Connect your free wingman"}
      </h2>
      <p className="mb-3 text-zinc-300">
        Replies run on your laptop’s Ollama model. Keep the laptop awake.
        Messages travel through Cloudflare’s encrypted tunnel; no paid AI API is
        used.
      </p>
      {connection ? (
        <button
          disabled={disabled}
          className="text-button"
          onClick={() => onChange(null)}
        >
          Disconnect laptop
        </button>
      ) : (
        <form onSubmit={connect} className="grid gap-3">
          <p className="text-zinc-400">
            Use the address and private code in your laptop’s{" "}
            <code>work/phone-connection.txt</code>. The code stays in this tab’s
            memory. Only connect a laptop you trust.
          </p>
          <label className="grid gap-1">
            Laptop tunnel address
            <input
              required
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-tunnel.trycloudflare.com"
              className="rounded-xl border border-white/20 bg-black/30 p-3"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </label>
          <label className="grid gap-1">
            Private connection code
            <input
              required
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="rounded-xl border border-white/20 bg-black/30 p-3"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
            />
          </label>
          <button className="primary" disabled={checking || disabled}>
            {checking ? "Connecting…" : "Connect my laptop"}
          </button>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-3 text-pink-200">
          {error}
        </p>
      )}
    </section>
  );
}

"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="app-shell" style={{ paddingTop: 100, paddingBottom: 100 }}>
      <p className="eyebrow">FLIRTPILOT</p>
      <h1>
        Lost the thread
        <br />
        for a second.
      </h1>
      <p className="muted">
        Something didn’t load properly. Let’s try that again.
      </p>
      <button className="primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}

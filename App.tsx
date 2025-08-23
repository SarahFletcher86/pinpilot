// src/App.tsx (overwrite your current file with this)

import React from "react";

// Simple conditional debug card – only shows if you add ?debug=1 to the URL
function DebugPanel() {
  const search = typeof window !== "undefined" ? window.location.search : "";
  const isDebug = new URLSearchParams(search).get("debug") === "1";
  const [server, setServer] = React.useState<{ ok: boolean; serverEnv?: any } | null>(null);

  React.useEffect(() => {
    if (!isDebug) return;
    fetch("/api/debug/status")
      .then((r) => r.json())
      .then((d) => setServer(d))
      .catch(() => setServer({ ok: false }));
  }, [isDebug]);

  if (!isDebug) return null;

  const ok = server?.ok && server?.serverEnv;
  return (
    <section className="pp-card" style={{ marginTop: 16 }}>
      <div className="pp-card-pad">
        <h3 className="card-title">Debug Panel</h3>
        {!ok ? (
          <p className="card-copy">Loading… or no server vars found.</p>
        ) : (
          <>
            <p className="card-copy">Environment keys loaded:</p>
            <ul style={{ lineHeight: 1.8 }}>
              <li>API Key: {server.serverEnv.API_KEY ? "✅ Found" : "❌ Missing"}</li>
              <li>Pinterest Client ID: {server.serverEnv.PINTEREST_CLIENT_ID ? "✅ Found" : "❌ Missing"}</li>
              <li>Pinterest Secret: {server.serverEnv.PINTEREST_CLIENT_SECRET ? "✅ Found" : "❌ Missing"}</li>
              <li>Pinterest Redirect URI: {server.serverEnv.PINTEREST_REDIRECT_URI ? "✅ Found" : "❌ Missing"}</li>
              <li>Stripe secret: {server.serverEnv.STRIPE_SECRET_KEY ? "✅ Found" : "❌ Missing"}</li>
              <li>Stripe webhook secret: {server.serverEnv.STRIPE_WEBHOOK_SECRET ? "✅ Found" : "❌ Missing"}</li>
              <li>Founder Monthly price: {server.serverEnv.PRICE_FOUNDER_MONTHLY ? "✅ Found" : "❌ Missing"}</li>
              <li>Standard Monthly price: {server.serverEnv.PRICE_STANDARD_MONTHLY ? "✅ Found" : "❌ Missing"}</li>
              <li>Standard Yearly price: {server.serverEnv.PRICE_STANDARD_YEARLY ? "✅ Found" : "❌ Missing"}</li>
            </ul>
          </>
        )}
      </div>
    </section>
  );
}

export default function App() {
  return (
    <main className="pp-wrap">
      {/* Header */}
      <header className="pp-header">
        <div className="pp-brand">
          <img
            src="/logo.svg"
            alt="Pin Pilot logo"
            className="pp-logo"
            width={36}
            height={36}
          />
          <span className="pp-title">Pin Pilot</span>
        </div>

        {/* Tagline */}
        <p className="pp-tagline">Pin Better. Grow Faster.</p>
      </header>

      {/* Free banner + actions */}
      <section className="pp-hero">
        <p className="pp-copy">
          You’re on the <strong>Free</strong> version. Upgrade to unlock Pinterest connect and auto-scheduling.
        </p>
        <div className="actions">
          {/* keep your existing behavior for these two links */}
          <a className="pp-btn primary" href="/?pro=1">Enable Pro (preview)</a>
          <a className="pp-btn ghost" href="/plans">See plans</a>
        </div>
      </section>

      {/* Feature cards */}
      <section className="feature-grid">
        {/* Connect Pinterest */}
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Connect Pinterest</h3>
            <p className="card-copy">
              Secure OAuth flow to fetch boards and post on your behalf.
            </p>
            <button
              className="pp-btn pp-btn-primary"
              onClick={() => {
                // this is the important line that kicks off OAuth
                window.location.href = "/api/auth/start";
              }}
            >
              Connect
            </button>
          </div>
        </article>

        {/* AI Assistant */}
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">AI-Optimized Keywords & Descriptions</h3>
            <p className="card-copy">
              Generate SEO-friendly titles, descriptions and tags.
            </p>
            <a className="pp-btn ghost" href="/assistant">Open AI Assistant</a>
          </div>
        </article>

        {/* Smart Scheduler */}
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Smart Scheduler</h3>
            <p className="card-copy">
              Paste an image URL, choose a time — we’ll handle the rest.
            </p>
            <a className="pp-btn ghost" href="/scheduler">Open Scheduler</a>
          </div>
        </article>

        {/* (Optional) Templates – keep or remove */}
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Pinterest-Ready Templates</h3>
            <p className="card-copy">
              Polished layouts for 1000×1500 &amp; 1000×1800.
            </p>
            <a className="pp-btn ghost" href="/templates">Browse Templates</a>
          </div>
        </article>
      </section>

      {/* Hidden unless you add ?debug=1 */}
      <DebugPanel />

      {/* Footer */}
      <footer className="pp-footer">© {new Date().getFullYear()} Pin Pilot</footer>
    </main>
  );
}
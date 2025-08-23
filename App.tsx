// App.tsx — Pin Pilot demo UI for Pinterest review
import React from "react";

export default function App() {
  return (
    <main className="pp-wrap">
      {/* Header */}
      <header className="pp-header">
        <div className="logo-row">
          <img src="/logo.svg" alt="Pin Pilot logo" className="pp-logo" />
          <h1 className="pp-title">Pin Pilot</h1>
        </div>
        <p className="text-emerald-400 font-semibold mt-1">Pin Better. Grow Faster.</p>
      </header>

      {/* Notice */}
      <section className="notice">
        <p>
          You’re on the <strong>Free</strong> version. Pinterest connect and scheduling are
          enabled in Pro after Pinterest upgrades our app access.
        </p>
        <div className="actions">
          {/* Hidden for now while we wait for Pinterest upgrade */}
          {/* <a className="pp-btn primary" href="/plans">Enable Pro</a> */}
          {/* <a className="pp-btn ghost" href="/plans">See plans</a> */}
        </div>
      </section>

      {/* Feature cards */}
      <section className="feature-grid">
        {/* Connect Pinterest */}
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Connect Pinterest</h3>
            <p className="card-copy">
              Secure OAuth flow to fetch boards and (after approval) post on your behalf.
            </p>

            <button
              className="pp-btn pp-btn-primary"
              onClick={() => (window.location.href = "/api/auth/start")}
            >
              Connect
            </button>

            <div style={{ marginTop: 10 }}>
              <button
                className="pp-btn ghost"
                onClick={async () => {
                  try {
                    const r = await fetch("/api/pinterest/boards");
                    const j = await r.json();
                    if (!j.ok) {
                      alert("Pinterest API error: " + JSON.stringify(j.error));
                      return;
                    }
                    const names = (j.boards || []).map((b: any) => b.name || b.id);
                    alert(
                      names.length ? `Boards:\n- ${names.join("\n- ")}` : "No boards returned."
                    );
                  } catch {
                    alert("Failed to fetch boards.");
                  }
                }}
              >
                Test Pinterest (list boards)
              </button>
            </div>
          </div>
        </article>

        {/* AI Assistant (placeholder) */}
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">AI-Optimized Keywords & Descriptions</h3>
            <p className="card-copy">Generate SEO-friendly titles, descriptions and tags.</p>
            <button className="pp-btn ghost" disabled title="Coming soon">
              Open AI Assistant
            </button>
          </div>
        </article>

        {/* Scheduler (placeholder) */}
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Smart Scheduler</h3>
            <p className="card-copy">
              Paste an image URL, choose a time — we’ll handle the rest (Pro after approval).
            </p>
            <button className="pp-btn ghost" disabled title="Pro after approval">
              Open Scheduler
            </button>
          </div>
        </article>

        {/* Templates (placeholder) */}
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Pinterest-Ready Templates</h3>
            <p className="card-copy">1000×1500 & 1000×1800 best-practice sizes.</p>
            <button className="pp-btn ghost" disabled title="Coming soon">
              Browse Templates
            </button>
          </div>
        </article>
      </section>

      <footer className="pp-footer">© {new Date().getFullYear()} Pin Pilot</footer>
    </main>
  );
}
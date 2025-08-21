import React from "react";

export default function App() {
  return (
    <main className="app-shell">
      {/* Header */}
      <header className="site-header">
        <img src="/logo.svg" alt="Pin Pilot logo" className="logo" />
        <h1 className="site-title">Pin Pilot</h1>
      </header>

      {/* Welcome / Free notice */}
      <section className="pp-card">
        <div className="pp-card-pad">
          <h2 className="section-title">Welcome 👋</h2>
          <p className="lead">
            You’re on the <strong>Free</strong> version. Upgrade to unlock Pinterest
            connect and auto-scheduling.
          </p>
          <div className="actions">
            <a className="pp-btn primary" href="/?pro=1">Enable Pro (preview)</a>
            <a className="pp-btn ghost" href="/plans">See plans</a>
          </div>
        </div>
      </section>

      {/* Feature cards (feel free to keep/remove) */}
      <section className="feature-grid">
        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Connect Pinterest</h3>
            <p className="card-copy">Secure OAuth flow to fetch boards and post on your behalf.</p>
            <button className="pp-btn primary">Connect</button>
          </div>
        </article>

        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">AI-Optimized Keywords & Descriptions</h3>
            <p className="card-copy">Generate SEO-friendly titles, descriptions and tags.</p>
            <button className="pp-btn ghost">Open AI Assistant</button>
          </div>
        </article>

        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Smart Scheduler</h3>
            <p className="card-copy">Paste an image URL, choose a time — we’ll handle the rest.</p>
            <button className="pp-btn primary">Open Scheduler</button>
          </div>
        </article>

        <article className="pp-card">
          <div className="pp-card-pad">
            <h3 className="card-title">Pinterest-Ready Templates</h3>
            <p className="card-copy">Polished layouts for 1000×1500 & 1000×1800.</p>
            <button className="pp-btn ghost">Browse Templates</button>
          </div>
        </article>
      </section>

      <footer className="site-footer">© {new Date().getFullYear()} Pin Pilot</footer>
    </main>
  );
}
import React, { useMemo } from "react";

function Logo() {
  return (
    <div className="brand">
      <img src="/logo.svg" alt="Pin Pilot" width={36} height={36} />
      <div className="brand-title">Pin Pilot</div>
      <span className="badge">Beta</span>
    </div>
  );
}

export default function App() {
  // simple flag to show Pro section when ?pro=1 is in the URL
  const isPro = useMemo(() => {
    return new URLSearchParams(window.location.search).get("pro") === "1";
  }, []);

  return (
    <div className="app-shell">
      <header className="container header">
        <Logo />
        <nav style={{display:"flex", gap:"10px"}}>
          <a className="pp-btn ghost" href="https://pinpilotapp.com" target="_blank" rel="noreferrer">Website</a>
          <button className="pp-btn primary" onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}>Reset All</button>
        </nav>
      </header>

      <main className="container" style={{paddingBottom:"40px"}}>
        {/* Free notice (keeps your current copy) */}
        {!isPro && (
          <div className="pp-card pp-card-pad" style={{marginBottom:"20px"}}>
            <p style={{margin:0}}>
              You’re on the free version. To unlock Pinterest connect & scheduling, open the Pro link:&nbsp;
              <a href="/?pro=1" style={{color:"var(--pp-primary)", fontWeight:600}}>
                Enable Pro features (temporary preview)
              </a>
            </p>
          </div>
        )}

        {/* Cards */}
        <section className="cards-grid">
          {/* Connect Pinterest */}
          <article className="pp-card">
            <div className="pp-card-pad">
              <h3 className="pp-card-title">Connect Pinterest</h3>
              <p className="pp-card-sub">
                Secure OAuth flow to fetch your boards and let Pin Pilot post on your behalf.
              </p>
              <div style={{display:"flex", gap:"10px", flexWrap:"wrap"}}>
                <a className="pp-btn primary" href="/api/auth/start">Connect with Pinterest</a>
                <a className="pp-btn ghost" href="https://developers.pinterest.com" target="_blank" rel="noreferrer">
                  Learn about permissions
                </a>
              </div>
            </div>
          </article>

          {/* AI Keywords & Descriptions (Gemini) */}
          <article className="pp-card">
            <div className="pp-card-pad">
              <h3 className="pp-card-title">AI-Optimized Keywords & Descriptions</h3>
              <p className="pp-card-sub">
                Use Gemini to generate SEO-friendly titles, descriptions, and tags that match Pinterest search intent.
              </p>
              <div style={{display:"flex", gap:"10px", flexWrap:"wrap"}}>
                <a className="pp-btn primary" href="/?pro=1#ai">Open AI Assistant</a>
                <button className="pp-btn ghost" onClick={() => alert("Coming soon: inline AI text panel")}>
                  Preview
                </button>
              </div>
            </div>
          </article>

          {/* Scheduler */}
          <article className="pp-card">
            <div className="pp-card-pad">
              <h3 className="pp-card-title">Smart Scheduler</h3>
              <p className="pp-card-sub">
                Pick a board, paste an image URL, choose a time — we’ll handle the rest. (Pro feature)
              </p>
              <div style={{display:"flex", gap:"10px", flexWrap:"wrap"}}>
                <a className="pp-btn primary" href="#schedule">Open Scheduler</a>
                <a className="pp-btn ghost" href="/?pro=1">Unlock Pro</a>
              </div>
            </div>
          </article>

          {/* Templates */}
          <article className="pp-card">
            <div className="pp-card-pad">
              <h3 className="pp-card-title">Pinterest-Ready Templates</h3>
              <p className="pp-card-sub">
                Start with polished layouts that fit 1000×1500 and 1000×1800 best-practice sizes.
              </p>
              <button className="pp-btn primary" onClick={() => alert("Coming soon: template picker")}>
                Browse Templates
              </button>
            </div>
          </article>
        </section>

        {/* Anchor target for Scheduler (keeps page simple for now) */}
        <div id="schedule" style={{marginTop:"24px"}}>
          <div className="pp-card">
            <div className="pp-card-pad">
              <h3 className="pp-card-title">Schedule a Pin</h3>
              <p className="pp-card-sub">Quick demo form (wires into your existing API route).</p>
              <form onSubmit={(e) => { e.preventDefault(); alert("Submit to /api/schedule"); }}>
                <input className="pp-input" placeholder="Board ID" style={{marginBottom:"10px"}} />
                <input className="pp-input" placeholder="Title" style={{marginBottom:"10px"}} />
                <textarea className="pp-input" placeholder="Description" rows={3} style={{marginBottom:"10px"}} />
                <input className="pp-input" placeholder="Destination Link (optional)" style={{marginBottom:"10px"}} />
                <input className="pp-input" placeholder="Image URL" style={{marginBottom:"10px"}} />
                <input className="pp-input" type="datetime-local" style={{marginBottom:"12px"}} />
                <button className="pp-btn primary" type="submit">Schedule Pin</button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer container">© 2025 Pin Pilot</footer>
    </div>
  );
}
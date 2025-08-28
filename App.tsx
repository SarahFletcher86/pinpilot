import React from "react";

function App() {
  return (
    <div className="pp-wrap">
      {/* Header */}
      <header className="pp-header">
        <div className="pp-brand">
          <img src="/logo.png" alt="Pin Pilot" className="pp-logo" />
          <div className="pp-title">Pin Pilot</div>
        </div>
        <div className="pp-tagline">Your AI Pinterest Pin Generator ✨</div>
      </header>

      {/* A simple card so we SEE something immediately */}
      <section className="pp-card">
        <h2>We’re Live ✅</h2>
        <p>
          If you can see this card, the app mounted correctly. Next, we can plug
          back the full UI (uploader, branding, generation, Pinterest connect).
        </p>

        <div className="pp-footer">
          <a className="pp-btn-secondary" href="javascript:location.reload()">
            Hard Refresh
          </a>
          <a
            className="pp-btn"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              alert("Buttons are alive. We can wire actions next.");
            }}
          >
            Test Button
          </a>
        </div>
      </section>
    </div>
  );
}

export default App;
// components/ConnectPinterest.tsx
import React from "react";

export default function ConnectPinterest() {
  const isPro = new URLSearchParams(window.location.search).get("pro") === "1";

  return (
    <div className="pp-form" style={{ marginTop: 26, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
      <div className="pp-row">
        <div className="pp-label">Pinterest Connect</div>
        {!isPro ? (
          <div className="pp-input" style={{ padding: 12 }}>
            This is a <strong>Pro</strong> feature. For testing, add <code>?pro=1</code> to your URL.
          </div>
        ) : (
          <div className="pp-actions">
            <a className="pp-btn pp-btn--primary" href="/api/auth/start">Connect Pinterest</a>
            <a className="pp-btn" href="https://developers.pinterest.com/docs/getting-started/getting-access/" target="_blank" rel="noreferrer">Access guide</a>
          </div>
        )}
      </div>
    </div>
  );
}
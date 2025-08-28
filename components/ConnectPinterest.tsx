// components/ConnectPinterest.tsx
import React from "react";

export default function ConnectPinterest() {
  const isPro = new URLSearchParams(window.location.search).get("pro") === "1";

  if (!isPro) {
    return (
      <div className="pp-form" style={{ marginTop: 22 }}>
        <div className="pp-row">
          <div className="pp-label">Pinterest Connect (Pro)</div>
          <div className="pp-input" style={{ padding: 12 }}>
            This feature unlocks in <strong>Pro</strong>. Add <code>?pro=1</code> to your URL to simulate Pro
            while testing (e.g. <code>?pro=1</code>).
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-form" style={{ marginTop: 22 }}>
      <div className="pp-row">
        <div className="pp-label">Pinterest</div>
        <div className="pp-actions">
          <a className="pp-btn pp-btn--primary" href="/api/auth/start">Connect Pinterest</a>
          <a
            className="pp-btn"
            href="https://developers.pinterest.com/docs/getting-started/getting-access/"
            target="_blank" rel="noreferrer"
          >
            How access works
          </a>
        </div>
      </div>
    </div>
  );
}
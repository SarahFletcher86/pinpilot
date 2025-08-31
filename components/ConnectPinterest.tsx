// components/ConnectPinterest.tsx
import React, { useState, useEffect } from "react";

export default function ConnectPinterest() {
  const isPro = new URLSearchParams(window.location.search).get("pro") === "1";
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Check if we have Pinterest access (OAuth token or direct token)
    const checkAccess = async () => {
      try {
        const response = await fetch('/api/pinterest/boards');
        const data = await response.json();
        if (data.ok && data.boards) {
          setHasAccess(true);
        }
      } catch (e) {
        // If boards API fails, we don't have access
        setHasAccess(false);
      }
    };

    if (isPro) {
      checkAccess();
    }
  }, [isPro]);

  return (
    <div className="pp-form" style={{ marginTop: 26, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
      <div className="pp-row">
        <div className="pp-label">Pinterest Connect</div>
        {!isPro ? (
          <div className="pp-input" style={{ padding: 12 }}>
            This is a <strong>Pro</strong> feature. For testing, add <code>?pro=1</code> to your URL.
          </div>
        ) : hasAccess ? (
          <div className="pp-input" style={{ padding: 12, color: '#10b981' }}>
            ✅ <strong>Pinterest Connected!</strong> Your account is linked and ready to use.
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
// components/ConnectPinterest.tsx
import React, { useState, useEffect } from "react";

export default function ConnectPinterest() {
  const isPro = new URLSearchParams(window.location.search).get("pro") === "1";
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have Pinterest OAuth access
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/pinterest/boards');
        const data = await response.json();
        if (data.ok && data.boards) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (e) {
        // If boards API fails, we don't have access
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (isPro) {
      checkAccess();
    } else {
      setIsLoading(false);
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
        ) : isLoading ? (
          <div className="pp-input" style={{ padding: 12, color: '#666' }}>
            🔄 Checking Pinterest connection...
          </div>
        ) : hasAccess ? (
          <div className="pp-input" style={{ padding: 12, color: '#10b981' }}>
            ✅ <strong>Pinterest Connected!</strong> Your account is linked and ready to use.
          </div>
        ) : (
          <div className="pp-actions">
            <a className="pp-btn pp-btn--primary" href="/api/auth/start">
              Connect Pinterest Account
            </a>
            <a className="pp-btn" href="https://developers.pinterest.com/docs/getting-started/getting-access/" target="_blank" rel="noreferrer">Access guide</a>
          </div>
        )}
      </div>
    </div>
  );
}
// components/ConnectPinterest.tsx
import React from "react";

export default function ConnectPinterest() {
  const onConnect = () => {
    const w = 600, h = 700;
    const y = window.top!.outerHeight / 2 + window.top!.screenY - (h / 2);
    const x = window.top!.outerWidth / 2 + window.top!.screenX - (w / 2);
    const popup = window.open(
      "/api/auth/generate",
      "pinpilot_pinterest",
      `width=${w},height=${h},left=${x},top=${y}`
    );

    const handler = (ev: MessageEvent) => {
      const d: any = ev.data || {};
      if (d.type === "pinpilot-token" && d.access_token) {
        localStorage.setItem("pinterestAccessToken", d.access_token);
        window.dispatchEvent(new CustomEvent("pinpilot:token"));
        if (popup && !popup.closed) popup.close();
        window.removeEventListener("message", handler);
        alert("Pinterest connected!");
      }
    };
    window.addEventListener("message", handler);
  };

  return (
    <button
      onClick={onConnect}
      className="px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium"
    >
      Connect Pinterest
    </button>
  );
}
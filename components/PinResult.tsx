// components/PinResult.tsx
import React from "react";

type Props = {
  previewUrl: string;
  fileName: string;
  result: { title: string; description: string; tags: string[] };
};

export default function PinResult({ previewUrl, fileName, result }: Props) {
  function copy(txt: string) {
    navigator.clipboard?.writeText(txt);
  }

  function download() {
    // For images we had a data URL; for videos we had object URL. Either way, we fetch & save.
    fetch(previewUrl)
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = fileName || "pin";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      });
  }

  const tagsStr = result.tags.map(t => `#${t}`).join(" ");

  return (
    <div className="pp-form" style={{ marginTop: 18 }}>
      <div className="pp-row">
        <label className="pp-label">Preview</label>
        <div className="pp-input" style={{ padding: 0 }}>
          {/* Image or video preview */}
          {previewUrl.endsWith(".mp4") || previewUrl.includes("blob:") ? (
            <video src={previewUrl} controls style={{ width: "100%", borderRadius: 10 }} />
          ) : (
            <img src={previewUrl} alt="preview" style={{ width: "100%", borderRadius: 10 }} />
          )}
        </div>
        <div className="pp-actions">
          <button className="pp-btn" onClick={download}>Download Media</button>
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Title</label>
        <div className="pp-input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, overflowWrap: "anywhere" }}>{result.title}</div>
          <button className="pp-btn" onClick={() => copy(result.title)}>Copy</button>
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Description</label>
        <div className="pp-input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, overflowWrap: "anywhere" }}>{result.description}</div>
          <button className="pp-btn" onClick={() => copy(result.description)}>Copy</button>
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Tags</label>
        <div className="pp-input" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, overflowWrap: "anywhere" }}>{tagsStr}</div>
          <button className="pp-btn" onClick={() => copy(tagsStr)}>Copy</button>
        </div>
      </div>
    </div>
  );
}
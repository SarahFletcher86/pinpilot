// components/PinResult.tsx
import React from "react";

type Branding = {
  overlayText: string;
  brandColor: string;
  accentColor: string;
  font: string;
  logoDataUrl: string; // may be empty
  template: string;
};

type Props = {
  previewUrl: string;
  fileName: string;
  result: { title: string; description: string; tags: string[] };
  branding?: Branding;
};

export default function PinResult({ previewUrl, fileName, result, branding }: Props) {
  function copy(txt: string) {
    navigator.clipboard?.writeText(txt);
  }

  function downloadRaw() {
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

  async function downloadBranded() {
    if (!branding) return downloadRaw();

    const base = await loadImage(previewUrl);
    const canvas = document.createElement("canvas");
    const W = base.width;
    const H = base.height;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(base, 0, 0, W, H);

    // overlay band (bottom)
    const bandH = Math.max(64, Math.round(H * 0.12));
    ctx.fillStyle = hex(branding.brandColor, 0.85);
    ctx.fillRect(0, H - bandH, W, bandH);

    // text
    const pad = Math.round(bandH * 0.3);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.round(bandH * 0.45)}px ${branding.font}, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText(branding.overlayText || "", pad, H - bandH / 2);

    // logo (right)
    if (branding.logoDataUrl) {
      const logo = await loadImage(branding.logoDataUrl);
      const maxH = Math.round(bandH * 0.6);
      const scale = maxH / logo.height;
      const lw = Math.round(logo.width * scale);
      const lh = Math.round(logo.height * scale);
      const lx = W - lw - pad;
      const ly = H - bandH / 2 - lh / 2;
      ctx.drawImage(logo, lx, ly, lw, lh);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = addSuffix(fileName || "pin.jpg", "-branded");
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }, "image/jpeg", 0.95);
  }

  const tagsStr = result.tags.map(t => `#${t}`).join(" ");

  return (
    <div className="pp-form" style={{ marginTop: 18 }}>
      <div className="pp-row">
        <label className="pp-label">Preview</label>
        <div className="pp-input" style={{ padding: 0 }}>
          <img src={previewUrl} alt="preview" style={{ width: "100%", borderRadius: 10 }} />
        </div>
        <div className="pp-actions">
          <button className="pp-btn" onClick={downloadRaw}>Download Original</button>
          <button className="pp-btn pp-btn--primary" onClick={downloadBranded}>Download Branded Image</button>
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Title</label>
        <div className="pp-input _flex">
          <div className="_grow">{result.title}</div>
          <button className="pp-btn" onClick={() => copy(result.title)}>Copy</button>
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Description</label>
        <div className="pp-input _flex">
          <div className="_grow">{result.description}</div>
          <button className="pp-btn" onClick={() => copy(result.description)}>Copy</button>
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Tags</label>
        <div className="pp-input _flex">
          <div className="_grow">{tagsStr}</div>
          <button className="pp-btn" onClick={() => copy(tagsStr)}>Copy</button>
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function addSuffix(name: string, sfx: string) {
  const i = name.lastIndexOf(".");
  if (i < 0) return name + sfx + ".jpg";
  return name.slice(0, i) + sfx + name.slice(i);
}

function hex(hexColor: string, alpha = 1) {
  // turns #rrggbb + alpha into rgba()
  const h = hexColor.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
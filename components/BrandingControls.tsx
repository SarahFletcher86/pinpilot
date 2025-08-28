// components/BrandingControls.tsx
import React, { useRef } from "react";

type Props = {
  template: string;
  setTemplate: (v: string) => void;

  overlayText: string;
  setOverlayText: (v: string) => void;

  brandColor: string;
  setBrandColor: (v: string) => void;

  accentColor: string;
  setAccentColor: (v: string) => void;

  font: string;
  setFont: (v: string) => void;

  logoDataUrl: string;                // <— NEW
  setLogoDataUrl: (v: string) => void;// <— NEW
};

export default function BrandingControls(props: Props) {
  const {
    template, setTemplate,
    overlayText, setOverlayText,
    brandColor, setBrandColor,
    accentColor, setAccentColor,
    font, setFont,
    logoDataUrl, setLogoDataUrl
  } = props;

  const logoInput = useRef<HTMLInputElement | null>(null);

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoDataUrl(String(reader.result || ""));
    reader.readAsDataURL(f);
  }

  return (
    <div className="pp-form">
      <div className="pp-row">
        <label className="pp-label">Template</label>
        <div className="pp-input">
          <select className="pp-select" value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="standard">Standard</option>
            <option value="text-overlay">Text Overlay</option>
          </select>
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Text Overlay</label>
        <input
          className="pp-input"
          value={overlayText}
          onChange={(e) => setOverlayText(e.target.value)}
          placeholder="Your Catchy Title Here"
        />
      </div>

      <div className="pp-row">
        <label className="pp-label">Brand Color (hex)</label>
        <div className="pp-input" style={{ display: "flex", gap: 8 }}>
          <input className="pp-input" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
          <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Accent Color (hex)</label>
        <div className="pp-input" style={{ display: "flex", gap: 8 }}>
          <input className="pp-input" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Font</label>
        <div className="pp-input">
          <select className="pp-select" value={font} onChange={(e) => setFont(e.target.value)}>
            <option value="Poppins">Poppins</option>
            <option value="Inter">Inter</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Lato">Lato</option>
          </select>
        </div>
      </div>

      {/* Logo uploader */}
      <div className="pp-row">
        <label className="pp-label">Logo</label>
        <div className="pp-input" style={{ padding: 12 }}>
          {!logoDataUrl ? (
            <>
              <button
                className="pp-btn"
                onClick={(e) => {
                  e.preventDefault();
                  logoInput.current?.click();
                }}
              >
                Upload Logo
              </button>
              <input
                ref={logoInput}
                type="file"
                accept="image/png,image/jpeg, image/svg+xml"
                style={{ display: "none" }}
                onChange={onPickLogo}
              />
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <img src={logoDataUrl} alt="logo" style={{ height: 36 }} />
              <button className="pp-btn" onClick={() => setLogoDataUrl("")}>Remove</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
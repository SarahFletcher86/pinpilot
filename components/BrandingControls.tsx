// components/BrandingControls.tsx
import React from "react";

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
};

const FONTS = ["Poppins", "Inter", "Montserrat", "Lato", "Roboto"];

export default function BrandingControls({
  template, setTemplate,
  overlayText, setOverlayText,
  brandColor, setBrandColor,
  accentColor, setAccentColor,
  font, setFont
}: Props) {
  // Allow pasting hex with or without '#'
  const normalizeHex = (v: string) => {
    const x = v.trim();
    if (!x) return "";
    return x.startsWith("#") ? x : `#${x}`;
  };

  return (
    <div className="pp-form" style={{ marginTop: 16 }}>
      <div className="pp-row pp-row--cols">
        <div className="pp-row">
          <label className="pp-label">Template</label>
          <select
            className="pp-select"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            <option value="standard">Standard</option>
            <option value="text-overlay">Text Overlay</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <div className="pp-row">
          <label className="pp-label">Text Overlay</label>
          <input
            className="pp-input"
            placeholder="Your Catchy Title Here"
            value={overlayText}
            onChange={(e) => setOverlayText(e.target.value)}
          />
        </div>
      </div>

      <div className="pp-row pp-row--cols">
        <div className="pp-row">
          <label className="pp-label">Brand Color (Hex)</label>
          <div className="pp-row pp-row--cols">
            <input
              className="pp-input"
              placeholder="#635bff"
              value={brandColor}
              onChange={(e) => setBrandColor(normalizeHex(e.target.value))}
            />
            <input
              className="pp-color"
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              title="Pick brand color"
            />
          </div>
        </div>

        <div className="pp-row">
          <label className="pp-label">Accent Color (Hex)</label>
          <div className="pp-row pp-row--cols">
            <input
              className="pp-input"
              placeholder="#10b981"
              value={accentColor}
              onChange={(e) => setAccentColor(normalizeHex(e.target.value))}
            />
            <input
              className="pp-color"
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              title="Pick accent color"
            />
          </div>
        </div>
      </div>

      <div className="pp-row">
        <label className="pp-label">Font</label>
        <select
          className="pp-select"
          value={font}
          onChange={(e) => setFont(e.target.value)}
        >
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      <div className="pp-preview" style={{
        // give you a live color strip using your chosen colors
        background: `linear-gradient(90deg, ${brandColor} 0%, ${accentColor} 100%)`
      }} />
    </div>
  );
}
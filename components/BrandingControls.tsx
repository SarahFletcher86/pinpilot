import React, { useRef } from "react";

type Branding = {
  overlayText: string;
  colors: { text: string; accent: string };
  font: string;
  logoDataUrl: string | null;
  includeLogo: boolean;
  template: "standard" | "bottomBar";
};

export default function BrandingControls({
  value,
  onChange,
}: {
  value: Branding;
  onChange: (v: Branding) => void;
}) {
  const logoInput = useRef<HTMLInputElement | null>(null);

  const set = <K extends keyof Branding>(k: K, v: Branding[K]) =>
    onChange({ ...value, [k]: v });

  const setColor = (k: "text" | "accent", hex: string) => {
    onChange({ ...value, colors: { ...value.colors, [k]: hex } });
  };

  const chooseLogo = (file?: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = () => onChange({ ...value, logoDataUrl: r.result as string });
    r.readAsDataURL(file);
  };

  return (
    <div className="pp-stack">
      <label>
        Text Overlay
        <input
          type="text"
          value={value.overlayText}
          onChange={(e) => set("overlayText", e.target.value)}
          placeholder="Your Catchy Title Here"
        />
      </label>

      <div className="pp-grid-2">
        <label>
          Brand Color (hex)
          <div className="pp-colorrow">
            <input
              type="text"
              value={value.colors.text}
              onChange={(e) => setColor("text", e.target.value)}
              placeholder="#111827"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <input
              type="color"
              value={value.colors.text}
              onChange={(e) => setColor("text", e.target.value)}
            />
          </div>
        </label>

        <label>
          Accent Color (hex)
          <div className="pp-colorrow">
            <input
              type="text"
              value={value.colors.accent}
              onChange={(e) => setColor("accent", e.target.value)}
              placeholder="#2dd4bf"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
            />
            <input
              type="color"
              value={value.colors.accent}
              onChange={(e) => setColor("accent", e.target.value)}
            />
          </div>
        </label>
      </div>

      <div className="pp-grid-2">
        <label>
          Font
          <select
            value={value.font}
            onChange={(e) => set("font", e.target.value)}
          >
            <option value="Poppins">Poppins</option>
            <option value="Inter">Inter</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Lato">Lato</option>
          </select>
        </label>

        <label>
          Template
          <select
            value={value.template}
            onChange={(e) =>
              set("template", e.target.value as Branding["template"])
            }
          >
            <option value="bottomBar">Bottom Bar</option>
            <option value="standard">Standard</option>
          </select>
        </label>
      </div>

      <div className="pp-grid-2">
        <div>
          <div className="pp-label">Logo</div>
          {value.logoDataUrl ? (
            <div className="pp-logo-preview">
              <img src={value.logoDataUrl} alt="logo" />
              <button
                className="pp-btn tiny ghost"
                onClick={() => onChange({ ...value, logoDataUrl: null })}
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              className="pp-btn ghost"
              onClick={() => logoInput.current?.click()}
            >
              Upload Logo
            </button>
          )}
          <input
            ref={logoInput}
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => chooseLogo(e.currentTarget.files?.[0])}
          />
        </div>

        <label className="pp-checkbox">
          <input
            type="checkbox"
            checked={value.includeLogo}
            onChange={(e) => set("includeLogo", e.target.checked)}
          />
          Include logo on the image
        </label>
      </div>
    </div>
  );
}
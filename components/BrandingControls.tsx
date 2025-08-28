import React, { useRef } from "react";
import type { BrandingOptions } from "../types";

export default function BrandingControls({
  options,
  setOptions,
}: {
  options: BrandingOptions;
  setOptions: (o: BrandingOptions) => void;
}) {
  const logoRef = useRef<HTMLInputElement>(null);

  const set = (patch: Partial<BrandingOptions>) => setOptions({ ...options, ...patch });
  const setColors = (patch: Partial<BrandingOptions["colors"]>) =>
    setOptions({ ...options, colors: { ...options.colors, ...patch } });

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      set({ logo: f as any, logoDataUrl: reader.result as string, logoScalePct: options.logoScalePct ?? 150 });
    };
    reader.readAsDataURL(f);
  };

  return (
    <div className="form">
      <div className="grid two sm">
        <label className="field">
          <div className="label">Template</div>
          <div className="seg">
            <button
              className={`seg-btn ${options.template === "standard" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); set({ template: "standard" }); }}
            >Standard</button>
            <button
              className={`seg-btn ${options.template === "bottomBar" ? "active" : ""}`}
              onClick={(e) => { e.preventDefault(); set({ template: "bottomBar" }); }}
            >Bottom Bar</button>
          </div>
        </label>

        <label className="field">
          <div className="label">Text Overlay</div>
          <input
            className="input"
            value={options.overlayText}
            onChange={(e) => set({ overlayText: e.target.value })}
            placeholder="Your Catchy Title Here"
          />
        </label>
      </div>

      <div className="grid two sm">
        <label className="field">
          <div className="label">Brand Color (hex)</div>
          <div className="input-row">
            <input
              className="input"
              value={options.colors.text}
              onChange={(e) => setColors({ text: e.target.value })}
              placeholder="#ffffff"
            />
            <input
              className="swatch"
              type="color"
              value={options.colors.text}
              onChange={(e) => setColors({ text: e.target.value })}
            />
          </div>
        </label>

        <label className="field">
          <div className="label">Accent Color (hex)</div>
          <div className="input-row">
            <input
              className="input"
              value={options.colors.accent}
              onChange={(e) => setColors({ accent: e.target.value })}
              placeholder="#10b981"
            />
            <input
              className="swatch"
              type="color"
              value={options.colors.accent}
              onChange={(e) => setColors({ accent: e.target.value })}
            />
          </div>
        </label>
      </div>

      <div className="grid two sm">
        <label className="field">
          <div className="label">Font</div>
          <select
            className="input"
            value={options.font}
            onChange={(e) => set({ font: e.target.value })}
          >
            <option>Poppins</option>
            <option>Inter</option>
            <option>Montserrat</option>
            <option>Raleway</option>
          </select>
        </label>

        <label className="field">
          <div className="label">Logo</div>
          <div className="row">
            <button className="btn" onClick={(e)=>{e.preventDefault(); logoRef.current?.click();}}>
              Upload Logo
            </button>
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogo}/>
            {options.logoDataUrl && (
              <img
                src={options.logoDataUrl}
                alt="logo"
                className="logo-thumb"
                style={{ width: Math.max(64, (options.logoScalePct ?? 150) / 1.6), height: "auto" }}
              />
            )}
          </div>
        </label>
      </div>
    </div>
  );
}
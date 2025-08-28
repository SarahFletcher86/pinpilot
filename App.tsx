// App.tsx
import React, { useState } from "react";
import "./index.css";

import ImageUploader from "./components/ImageUploader";
import BrandingControls from "./components/BrandingControls";
import ConnectPinterest from "./components/ConnectPinterest";
import PinResult from "./components/PinResult";

// If you already have this service, we’ll use it.
// (It expects base64 (no prefix), mime, and a boards string.)
import { generatePinContent } from "./services/geminiService";

type GenResult = {
  title: string;
  description: string;
  tags: string[];
};

export default function App() {
  // Header text only — style is in CSS (small + subtle).
  const TAGLINE = "Pin better. Grow faster.";

  // Branding controls (used by free tier too)
  const [template, setTemplate] = useState("standard");
  const [overlayText, setOverlayText] = useState("Your Catchy Title Here");
  const [brandColor, setBrandColor] = useState("#635bff");
  const [accentColor, setAccentColor] = useState("#10b981");
  const [font, setFont] = useState("Poppins");

  // Upload + generate state (FREE)
  const [file, setFile] = useState<File | null>(null);
  const [fileMime, setFileMime] = useState<string>("");
  const [fileBase64, setFileBase64] = useState<string>(""); // WITHOUT data: prefix
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const [boards, setBoards] = useState("Home Decor, DIY Projects, Recipes, Fashion");
  const [isLoading, setIsLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<GenResult | null>(null);

  const isPro = new URLSearchParams(window.location.search).get("pro") === "1";

  async function onGenerate() {
    if (!fileBase64 || !fileMime) {
      setGenError("Please upload an image or video first.");
      return;
    }
    setIsLoading(true);
    setGenError(null);
    setGenResult(null);

    try {
      // This service was already in your project; we reuse it.
      const result = await generatePinContent(fileBase64, fileMime, boards);

      // Normalize to our simple shape
      const normalized: GenResult = {
        title: result.title || "Untitled Pin",
        description: result.description || "",
        tags: (result.keywords || result.tags || [])
          .map((t: string) => t.replace(/^#/, ""))
          .slice(0, 15),
      };
      setGenResult(normalized);
    } catch (err: any) {
      setGenError(
        err?.message ||
          "Generation failed. Check your API key in Vercel (API_KEY) and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="pp-wrap">
      {/* Header (small, no giant black text) */}
      <header className="pp-header">
        <div className="pp-brand">
          <img src="/logo.png" className="pp-logo" alt="Pin Pilot" />
          <div className="pp-title">Pin Pilot</div>
        </div>
        <div className="pp-tagline">{TAGLINE}</div>
      </header>

      {/* Main card */}
      <main className="pp-card">
        <h2 className="pp-section">Design & Brand</h2>

        <ImageUploader
          onPick={(f, mime, base64NoPrefix, preview) => {
            setFile(f);
            setFileMime(mime);
            setFileBase64(base64NoPrefix);
            setPreviewUrl(preview);
          }}
        />

        <div className="pp-form">
          <div className="pp-row">
            <label className="pp-label">Boards to target (comma-separated)</label>
            <input
              className="pp-input"
              value={boards}
              onChange={(e) => setBoards(e.target.value)}
              placeholder="Home Decor, DIY Projects, Recipes, Fashion"
            />
          </div>
        </div>

        <BrandingControls
          template={template}
          setTemplate={setTemplate}
          overlayText={overlayText}
          setOverlayText={setOverlayText}
          brandColor={brandColor}
          setBrandColor={setBrandColor}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          font={font}
          setFont={setFont}
        />

        <div className="pp-actions" style={{ marginTop: 16 }}>
          <button
            className="pp-btn pp-btn--primary"
            onClick={onGenerate}
            disabled={isLoading || !fileBase64}
            title={!fileBase64 ? "Upload an image or video first" : "Generate"}
          >
            {isLoading ? "Generating…" : "Generate Pin Content"}
          </button>
          <button
            className="pp-btn"
            onClick={() => {
              setGenResult(null);
              setGenError(null);
              setFile(null);
              setFileMime("");
              setFileBase64("");
              setPreviewUrl("");
            }}
          >
            Reset
          </button>
        </div>

        {genError && (
          <div className="pp-input" style={{ marginTop: 12, borderColor: "#ef4444", color: "#991b1b" }}>
            {genError}
          </div>
        )}

        {genResult && (
          <PinResult
            previewUrl={previewUrl}
            fileName={file?.name || "pin.jpg"}
            result={genResult}
          />
        )}

        {/* Pro-only connect (clearly separated) */}
        <ConnectPinterest />
      </main>
    </div>
  );
}
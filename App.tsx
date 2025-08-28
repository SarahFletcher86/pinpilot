// App.tsx
import React, { useState } from "react";
import "./index.css";

// Components (below we also give you full overwrites for each)
import ImageUploader from "./components/ImageUploader";
import BrandingControls from "./components/BrandingControls";
import ConnectPinterest from "./components/ConnectPinterest";

export default function App() {
  // Safe defaults so nothing crashes
  const [template, setTemplate] = useState<string>("standard");
  const [overlayText, setOverlayText] = useState<string>("Your Catchy Title Here");
  const [brandColor, setBrandColor] = useState<string>("#635bff"); // purple
  const [accentColor, setAccentColor] = useState<string>("#10b981"); // aqua
  const [font, setFont] = useState<string>("Poppins");

  return (
    <div className="pp-wrap">
      {/* Header */}
      <header className="pp-header">
        <div className="pp-brand">
          <img src="/logo.png" className="pp-logo" alt="Pin Pilot" />
          <div className="pp-title">Pin Pilot</div>
        </div>
        <div className="pp-tagline">Your AI Pinterest Pin Generator ✨</div>
      </header>

      {/* Main Card */}
      <main className="pp-card">
        <h2 className="pp-section">Design & Brand</h2>

        <ImageUploader />

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

        <ConnectPinterest />
      </main>
    </div>
  );
}
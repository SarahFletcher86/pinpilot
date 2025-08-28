import React, { useState } from "react";
import ConnectPinterest from "./components/ConnectPinterest";
import ScheduleForm from "./components/ScheduleForm";
import BrandingControls from "./components/BrandingControls";
import PinResultCard from "./components/PinResultCard";
import ImageUploader from "./components/ImageUploader";
import LoadingSpinner from "./components/LoadingSpinner";

function App() {
  // Pro flag check
  const isPro = new URLSearchParams(window.location.search).get("pro") === "1";

  const [brandingOptions, setBrandingOptions] = useState({});
  const [frameForAI, setFrameForAI] = useState(null);
  const [designedImageBase64, setDesignedImageBase64] = useState(null);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [error, setError] = useState(null);
  const [postError, setPostError] = useState(null);
  const [postSuccess, setPostSuccess] = useState(null);
  const [scheduleError, setScheduleError] = useState(null);
  const [scheduleSuccess, setScheduleSuccess] = useState(null);
  const [postingProgress, setPostingProgress] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);

  const resetAll = (fullReset: boolean = false) => {
    setFrameForAI(null);
    setDesignedImageBase64(null);
    setGeneratedPin(null);
    setError(null);
    setPostError(null);
    setPostSuccess(null);
    setScheduleError(null);
    setScheduleSuccess(null);
    setPostingProgress(null);
    setCurrentStep(1);
    setBrandingOptions({});
    if (fullReset) {
      localStorage.removeItem("branding");
    }
  };

  return (
    <div className="pp-wrap">
      {/* Header with logo + tagline */}
      <header className="pp-header">
        <div className="pp-brand">
          <img src="/logo.png" alt="Pin Pilot" className="pp-logo" />
          <div className="pp-title">Pin Pilot</div>
        </div>
        <div className="pp-tagline">Your AI Pinterest Pin Generator ✨</div>
      </header>

      {/* Upload + design area */}
      <section className="pp-card">
        <h2>Design & Brand</h2>
        <ImageUploader
          onUpload={(file: any) => {
            setFrameForAI(file);
          }}
        />
        <BrandingControls
          brandingOptions={brandingOptions}
          setBrandingOptions={setBrandingOptions}
        />
      </section>

      {/* Generate Pin */}
      <section className="pp-card">
        <button
          className="pp-btn"
          onClick={() => {
            setPostingProgress("Generating...");
          }}
        >
          Generate Pin Content
        </button>
        {postingProgress && <LoadingSpinner message={postingProgress} />}
        {error && <div className="pp-error">{error}</div>}
      </section>

      {/* Results */}
      {generatedPin && (
        <PinResultCard
          generatedPin={generatedPin}
          postSuccess={postSuccess}
          postError={postError}
          scheduleSuccess={scheduleSuccess}
          scheduleError={scheduleError}
        />
      )}

      {/* Pro-only features */}
      {isPro ? (
        <section className="pp-card">
          <h2>Pro Tools</h2>
          <ConnectPinterest />
          <ScheduleForm />
        </section>
      ) : (
        <section className="pp-card">
          <p>Upgrade to Pro to unlock Pinterest scheduling 🚀</p>
        </section>
      )}

      {/* Footer */}
      <footer className="pp-footer">
        <button className="pp-btn-secondary" onClick={() => resetAll(true)}>
          Reset All
        </button>
      </footer>
    </div>
  );
}

export default App;
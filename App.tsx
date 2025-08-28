import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import BrandingControls from './components/BrandingControls';
import PinResultCard from './components/PinResultCard';
import ConnectPinterest from './components/ConnectPinterest';
import ScheduleForm from './components/ScheduleForm';

type GeneratedPin = {
  title: string;
  description: string;
  tags?: string[];
};

function App() {
  // Pro flag via URL: https://yourapp/?pro=1
  const isPro = new URLSearchParams(window.location.search).get('pro') === '1';

  const [file, setFile] = useState<File | null>(null);
  const [brandingOptions, setBrandingOptions] = useState<any>({});
  const [generatedPin, setGeneratedPin] = useState<GeneratedPin | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetAll = () => {
    setFile(null);
    setBrandingOptions({});
    setGeneratedPin(null);
    setError(null);
  };

  return (
    <div className="pp-wrap">
      {/* Header (subtle, not huge/black) */}
      <header className="pp-header">
        <div className="pp-brand">
          <img src="/logo.png" alt="Pin Pilot" className="pp-logo" />
          <div className="pp-meta">
            <div className="pp-title">Pin Pilot</div>
            <div className="pp-tagline">Your AI Pinterest Pin Generator ✨</div>
          </div>
        </div>
        <button className="pp-reset" onClick={resetAll} title="Reset">
          ↺ Reset
        </button>
      </header>

      {/* Main card */}
      <main className="pp-card">
        <h2 className="pp-section-title">Design & Brand</h2>

        <div className="pp-stack">
          {/* Uploader */}
          <div className="pp-block">
            <ImageUploader onUpload={setFile} />
          </div>

          {/* Branding */}
          <div className="pp-block">
            <BrandingControls
              brandingOptions={brandingOptions}
              setBrandingOptions={setBrandingOptions}
            />
          </div>

          {/* Generate (placeholder hook-up; swap with your Gemini service when ready) */}
          <button
            className="pp-button"
            onClick={() => {
              if (!file) {
                setError('Please upload an image (or video) first.');
                return;
              }
              // TODO: integrate your real generatePinContent(...) call here.
              setGeneratedPin({
                title: 'Generated Pin Title',
                description:
                  'This is a placeholder result. Wire up Gemini to populate this.',
                tags: ['pinterest', 'ai', 'branding'],
              });
              setError(null);
            }}
          >
            Generate Pin Content
          </button>

          {error && <div className="pp-error">{error}</div>}

          {/* Result */}
          {generatedPin && (
            <div className="pp-block">
              <PinResultCard pin={generatedPin} onReset={resetAll} />
            </div>
          )}

          {/* Pro / Free area */}
          <div className="pp-divider" />

          {isPro ? (
            <div className="pp-pro-grid">
              <ConnectPinterest />
              <ScheduleForm />
            </div>
          ) : (
            <div className="pp-upgrade">
              🚀 <strong>Upgrade to Pro</strong> to unlock Pinterest connect &
              scheduling. (Until Pinterest grants elevated access, Pro users can
              still copy the content and post manually. Your subscription keeps
              working and auto-posting switches on once Pinterest approves.)
            </div>
          )}
        </div>
      </main>

      <footer className="pp-footer">
        <span>© {new Date().getFullYear()} Pin Pilot</span>
        <span>Powered by Gemini & Pinterest API</span>
      </footer>
    </div>
  );
}

export default App;
import React, { useState, useEffect, useCallback } from 'react';
import { PinData, PinterestBoard, BrandingOptions, SchedulePinPayload } from './types';
import { generatePinContent } from './services/geminiService';
import { fetchBoards, createPin } from './services/pinterestService';
import ConnectPinterest from './components/ConnectPinterest';
import ScheduleForm from './components/ScheduleForm';
import PinResultCard from './components/PinResultCard';
import MediaUploader from './components/ImageUploader';
import BrandingControls from './components/BrandingControls';
import DesignPreview from './components/DesignPreview';
import LoadingSpinner from './components/LoadingSpinner';
import { LogoIcon, SparklesIcon, ErrorIcon, PinterestIcon, CheckCircleIcon, RefreshIcon } from './components/Icons';

// Default branding
const initialBranding: BrandingOptions = {
  overlayText: 'Your Catchy Title Here',
  colors: { text: '#FFFFFF', accent: '#000000' },
  font: 'Poppins',
  logo: null,
  template: 'standard',
};

function App() {
  // Pro flag (from URL)
  const isPro = new URLSearchParams(window.location.search).get('pro') === '1';

  // Core state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [frameForAI, setFrameForAI] = useState<string | null>(null);
  const [designedImageBase64, setDesignedImageBase64] = useState<string | null>(null);

  // Workflow state
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedPin, setGeneratedPin] = useState<PinData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pinterest state
  const [pinterestToken, setPinterestToken] = useState<string | null>(localStorage.getItem('pinterestAccessToken'));
  const [userBoards, setUserBoards] = useState<PinterestBoard[]>([]);
  const [isFetchingBoards, setIsFetchingBoards] = useState(false);
  const [fetchBoardsError, setFetchBoardsError] = useState<string | null>(null);

  // Branding
  const [brandingOptions, setBrandingOptions] = useState<BrandingOptions>(() => {
    const saved = localStorage.getItem('brandingOptions');
    return saved ? JSON.parse(saved) : initialBranding;
  });

  // Reset
  const resetAll = () => {
    setMediaFile(null);
    setMediaPreviewUrl(null);
    setFrameForAI(null);
    setDesignedImageBase64(null);
    setGeneratedPin(null);
    setError(null);
    setCurrentStep(1);
  };

  // Media upload
  const handleMediaUpload = useCallback((file: File) => {
    resetAll();
    setMediaFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setMediaPreviewUrl(result);
      setFrameForAI(result);
      setCurrentStep(2);
    };
    reader.readAsDataURL(file);
  }, []);

  // Generate pin
  const handleGeneratePin = async () => {
    if (!designedImageBase64) return setError("Please finalize your design first.");
    setIsLoading(true);
    try {
      const base64Data = designedImageBase64.split(',')[1];
      const result = await generatePinContent(base64Data, 'image/jpeg', 'DIY, Fashion');
      setGeneratedPin(result);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to generate content.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch boards
  const handleFetchBoards = async () => {
    if (!pinterestToken) return;
    setIsFetchingBoards(true);
    try {
      const boards = await fetchBoards(pinterestToken);
      setUserBoards(boards);
    } catch (err: any) {
      setFetchBoardsError(err.message);
    } finally {
      setIsFetchingBoards(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6">
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <LogoIcon className="h-10 w-10" />
          <h1 className="text-3xl font-bold">Pin Pilot</h1>
        </div>
        <button
          onClick={resetAll}
          className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-slate-50"
        >
          <RefreshIcon className="h-4 w-4 inline-block mr-2" /> Reset
        </button>
      </header>

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <MediaUploader onMediaUpload={handleMediaUpload} onFrameCapture={() => {}} />
      )}

      {/* Step 2: Design */}
      {currentStep === 2 && frameForAI && (
        <>
          <BrandingControls options={brandingOptions} setOptions={setBrandingOptions} />
          <button
            onClick={handleGeneratePin}
            className="mt-4 w-full bg-slate-800 text-white py-2 rounded-lg"
          >
            <SparklesIcon className="h-5 w-5 inline mr-2" />
            Generate Pin Content
          </button>
        </>
      )}

      {/* Step 3: Results */}
      {currentStep === 3 && generatedPin && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-3">Generated Pin</h2>
          {isPro ? (
            <>
              <ConnectPinterest />
              <ScheduleForm
                userBoards={userBoards}
                onFetchBoards={handleFetchBoards}
                isFetchingBoards={isFetchingBoards}
                error={fetchBoardsError}
              />
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Upgrade to Pro to unlock posting & scheduling.
            </p>
          )}
          <PinResultCard
            finalPinImageUrl={designedImageBase64}
            pinData={generatedPin}
            userBoards={userBoards}
          />
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-600 rounded">{error}</div>
      )}
    </div>
  );
}

export default App;
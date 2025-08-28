import React, { useState, useCallback, useEffect } from 'react';
import { PinData, PinterestBoard, BrandingOptions, SchedulePinPayload } from './types';
import { generatePinContent } from './services/geminiService';
import { fetchBoards, createPin, createVideoPin } from './services/pinterestService';

import MediaUploader from './components/ImageUploader';
import BrandingControls from './components/BrandingControls';
import DesignPreview from './components/DesignPreview';
import BoardInput from './components/BoardInput';
import LoadingSpinner from './components/LoadingSpinner';
import PinResult from './components/PinResult';
import ConnectPinterest from './components/ConnectPinterest';

import {
  LogoIcon,
  SparklesIcon,
  ErrorIcon,
  PinterestIcon,
  CheckCircleIcon,
  RefreshIcon,
  QuestionMarkCircleIcon,
  ImageIcon,
  FilmIcon,
} from './components/Icons';

const initialBranding: BrandingOptions = {
  overlayText: 'Your Catchy Title Here',
  colors: { text: '#FFFFFF', accent: '#000000' },
  font: 'Poppins',
  logo: null,                 // your component may store File | null here
  template: 'standard',
  // the next two are optional; BrandingControls can fill them in
  // @ts-ignore
  logoDataUrl: undefined,     // string | undefined (data URL)
  // @ts-ignore
  logoScalePct: 100,          // number (1–300)
};

function App() {
  const isPro = new URLSearchParams(window.location.search).get('pro') === '1';

  // Core state
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [frameForAI, setFrameForAI] = useState<string | null>(null);
  const [designedImageBase64, setDesignedImageBase64] = useState<string | null>(null);

  // Workflow state
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Upload, 2: Design, 3: Generate, 4: Post
  const [generatedPin, setGeneratedPin] = useState<PinData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Branding state
  const [brandingOptions, setBrandingOptions] = useState<BrandingOptions>(() => {
    try {
      const saved = localStorage.getItem('brandingOptions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.colors && parsed.font) return parsed;
      }
    } catch {}
    return initialBranding;
  });

  const [boards, setBoards] = useState<string>('Home Decor, DIY Projects, Recipes, Fashion');

  // Pinterest state
  const [pinterestToken, setPinterestToken] = useState<string>(() => localStorage.getItem('pinterestAccessToken') || '');
  const [userBoards, setUserBoards] = useState<PinterestBoard[]>([]);
  const [isFetchingBoards, setIsFetchingBoards] = useState<boolean>(false);
  const [fetchBoardsError, setFetchBoardsError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [postingProgress, setPostingProgress] = useState<string | null>(null);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Persist branding
  useEffect(() => {
    localStorage.setItem('brandingOptions', JSON.stringify(brandingOptions));
  }, [brandingOptions]);

  const handlePinterestTokenChange = (token: string) => {
    setPinterestToken(token);
    if (token) localStorage.setItem('pinterestAccessToken', token);
    else localStorage.removeItem('pinterestAccessToken');
  };

  // Auto-fetch boards if token already in storage on first load
  useEffect(() => {
    if (pinterestToken) handleFetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch boards when token appears after generation
  useEffect(() => {
    if (pinterestToken && generatedPin && userBoards.length === 0 && !isFetchingBoards) {
      handleFetchBoards();
    }
  }, [pinterestToken, generatedPin, userBoards.length, isFetchingBoards]);

  const resetState = (fullReset = false) => {
    setMediaFile(null);
    setMediaType(null);
    setMediaPreviewUrl(null);
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
    if (fullReset) {
      setBrandingOptions(initialBranding);
      localStorage.removeItem('brandingOptions');
    }
  };

  const handleMediaUpload = useCallback((file: File, type: 'image' | 'video') => {
    resetState();
    setMediaFile(file);
    setMediaType(type);

    if (type === 'image') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setMediaPreviewUrl(result);
        setFrameForAI(result);
        setCurrentStep(2);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleFrameCapture = useCallback((base64Frame: string) => {
    setFrameForAI(base64Frame);
    setCurrentStep(2);
  }, []);

  const handleDesignChange = (newDesignedImage: string) => {
    setDesignedImageBase64(newDesignedImage);
  };

  const handleGeneratePin = async () => {
    if (!designedImageBase64) {
      setError('Please finalize your design before generating content.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedPin(null);
    setPostError(null);
    setPostSuccess(null);
    setScheduleError(null);
    setScheduleSuccess(null);
    setCurrentStep(3);

    try {
      const base64Data = designedImageBase64.split(',')[1];
      const mimeType = 'image/jpeg';
      const result = await generatePinContent(base64Data, mimeType, boards);
      setGeneratedPin(result);
    } catch (err: any) {
      console.error(err);
      if (err?.status === 401) {
        setError("API Key invalid or suspended. Check your Vercel project setting `VITE_GEMINI_API_KEY` (or API_KEY) and redeploy.");
      } else if (typeof err?.message === 'string' && err.message.includes('quota')) {
        setError('Gemini free tier quota reached. Swap in a fresh key or upgrade the Google account.');
      } else {
        setError(err?.message || 'An unknown error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchBoards = async () => {
    if (!pinterestToken) {
      setFetchBoardsError('Please enter your Access Token.');
      return;
    }
    setIsFetchingBoards(true);
    setFetchBoardsError(null);
    setUserBoards([]);
    try {
      const boards = await fetchBoards(pinterestToken);
      setUserBoards(boards);
      if (boards.length > 0) setCurrentStep(4);
    } catch (err) {
      setFetchBoardsError(err instanceof Error ? err.message : 'Failed to fetch boards.');
    } finally {
      setIsFetchingBoards(false);
    }
  };

  const handlePostPin = async (boardId: string, title: string, description: string) => {
    if (!pinterestToken || !mediaFile) {
      setPostError("Missing data required for posting.");
      return;
    }
    setIsPosting(true);
    setPostError(null);
    setPostSuccess(null);
    setScheduleError(null);
    setScheduleSuccess(null);
    setPostingProgress('');

    try {
      if (mediaType === 'image' && designedImageBase64) {
        setPostingProgress('Posting pin to Pinterest...');
        const base64Data = designedImageBase64.split(',')[1];
        const contentType = mediaFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        await createPin(pinterestToken, {
          board_id: boardId,
          title,
          description,
          media_source: {
            source_type: 'image_base64',
            content_type: contentType,
            data: base64Data,
          },
        });
      } else if (mediaType === 'video') {
        await createVideoPin(
          pinterestToken,
          { board_id: boardId, title, description },
          mediaFile,
          (message: string) => setPostingProgress(message)
        );
      } else {
        throw new Error("Unsupported media type or missing file.");
      }
      setPostSuccess("Successfully posted to Pinterest!");
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'An unknown error occurred while posting.');
    } finally {
      setIsPosting(false);
      setPostingProgress(null);
    }
  };

  const handleSchedulePin = async (boardId: string, title: string, description: string, scheduledAt: string) => {
    if (!designedImageBase64 || !pinterestToken) {
      setScheduleError("Missing data required for scheduling.");
      return;
    }

    setIsScheduling(true);
    setScheduleError(null);
    setScheduleSuccess(null);
    setPostError(null);
    setPostSuccess(null);

    const payload: SchedulePinPayload = {
      pinterestAccessToken: pinterestToken,
      boardId,
      title,
      description,
      imageBase64: designedImageBase64,
      scheduledAt,
    };

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Scheduling failed.');
      }

      const result = await response.json();
      setScheduleSuccess(result.message || `Pin successfully scheduled for ${new Date(scheduledAt).toLocaleString()}!`);
    } catch (err) {
      setScheduleError(err instanceof Error ? err.message : 'An unknown error occurred while scheduling.');
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="pp-wrap">
      {/* Header with larger logo + aqua tagline */}
      <header className="pp-header">
        <div className="pp-brand">
          {/* Put /public/logo.png in your repo */}
          <img src="/logo.png" className="pp-logo" alt="Pin Pilot" />
        </div>
        <div className="pp-tagline">Pin better. Grow faster.</div>
        <div className="pp-spacer" />
        <button
          className="pp-iconbtn"
          title="Help"
          onClick={() => setShowHelp(true)}
        >
          <QuestionMarkCircleIcon className="h-4 w-4" />
          <span>Help</span>
        </button>
        <button
          className="pp-iconbtn"
          title="Start a new pin"
          disabled={currentStep === 1 && !mediaFile}
          onClick={() => resetState(true)}
        >
          <RefreshIcon className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </header>

      <main className="pp-main">
        <section className="pp-card">
          {/* Step 1: Upload */}
          <h3 className="pp-step">
            <span className="pp-stepnum">1</span> Upload Image or Video
          </h3>

          {!mediaFile ? (
            <MediaUploader onMediaUpload={handleMediaUpload} onFrameCapture={handleFrameCapture} />
          ) : (
            <div className="pp-filepill">
              {mediaType === 'image' && mediaPreviewUrl && (
                <img src={mediaPreviewUrl} alt="Preview" className="pp-thumb" />
              )}
              {mediaType === 'video' && mediaPreviewUrl && (
                <video src={mediaPreviewUrl} muted playsInline className="pp-thumb" />
              )}
              <div className="pp-filemeta">
                <div className="pp-filename">{mediaFile.name}</div>
                <div className="pp-filesize">
                  {mediaType === 'image' ? 'Image' : 'Video'} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)
                </div>
              </div>
              <button className="pp-linkbtn" onClick={() => resetState(false)}>Change</button>
            </div>
          )}

          {/* Step 2: Design */}
          {currentStep >= 2 && frameForAI && (
            <>
              <BrandingControls options={brandingOptions} setOptions={setBrandingOptions} />
              <BoardInput value={boards} onChange={setBoards} />

              <button
                onClick={handleGeneratePin}
                disabled={isLoading || !designedImageBase64}
                className="pp-primary"
              >
                {isLoading ? (
                  <LoadingSpinner className="h-5 w-5" />
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    Generate Pin Content
                  </>
                )}
              </button>
            </>
          )}
        </section>

        {/* Preview / Result */}
        <section className="pp-card">
          <h3 className="pp-step">
            <span className="pp-stepnum">{currentStep < 3 ? '2' : '3'}</span>
            {currentStep < 3 ? 'Design Preview' : 'Generated Pin'}
          </h3>

          <div className="pp-previewbox">
            {currentStep === 2 && frameForAI && (
              <DesignPreview
                baseImage={frameForAI}
                options={brandingOptions}
                onDesignChange={handleDesignChange}
              />
            )}

            {currentStep === 3 && isLoading && (
              <div className="pp-center muted">
                <LoadingSpinner className="h-8 w-8" />
                <p className="mt-3">Generating your pin…</p>
              </div>
            )}

            {error && (
              <div className="pp-error">
                <ErrorIcon className="h-6 w-6" />
                <div>
                  <div className="pp-errtitle">Generation Failed</div>
                  <div className="pp-errbody">{error}</div>
                </div>
              </div>
            )}

            {currentStep < 2 && !mediaFile && (
              <div className="pp-empty">
                <div className="pp-emptyicons">
                  <ImageIcon className="h-14 w-14" />
                  <FilmIcon className="h-14 w-14" />
                </div>
                <p>Upload a file to start designing.</p>
              </div>
            )}

            {generatedPin && (
              <PinResult
                finalPinImageUrl={designedImageBase64}
                mediaPreviewUrl={mediaPreviewUrl}
                mediaType={mediaType}
                pinData={generatedPin}
                branding={brandingOptions}
                onPostPin={handlePostPin}
                isPosting={isPosting}
                postError={postError}
                postSuccess={postSuccess}
                postingProgress={postingProgress}
                isConnected={isPro && userBoards.length > 0}
                userBoards={isPro ? userBoards : []}
                isPro={isPro}
                onSchedulePin={handleSchedulePin}
                isScheduling={isScheduling}
                scheduleError={scheduleError}
                scheduleSuccess={scheduleSuccess}
              />
            )}
          </div>

          {/* Pro connect block */}
          {generatedPin && (
            <div className="pp-connectblock">
              {isPro ? (
                <>
                  <p className="muted">Connected features</p>
                  <ConnectPinterest />
                  <button
                    className="pp-secondary"
                    onClick={handleFetchBoards}
                    disabled={isFetchingBoards || !pinterestToken}
                  >
                    {isFetchingBoards ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <>
                        <PinterestIcon className="h-4 w-4 mr-2" />
                        Fetch My Boards
                      </>
                    )}
                  </button>
                  {fetchBoardsError && <p className="pp-errtext">{fetchBoardsError}</p>}
                  {userBoards.length > 0 && !isFetchingBoards && (
                    <div className="pp-successpill">
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Successfully fetched {userBoards.length} boards! You can now post your pin.
                    </div>
                  )}
                </>
              ) : (
                <div className="pp-upgrade">
                  This is a Pro feature. To test locally add <code>?pro=1</code> to your URL.
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {showHelp && (
        <div className="pp-modal" onClick={() => setShowHelp(false)} role="dialog" aria-modal="true">
          <div className="pp-modalcard" onClick={(e) => e.stopPropagation()}>
            <div className="pp-modalhdr">
              <h2>Getting Started & Troubleshooting</h2>
              <button className="pp-close" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="pp-modalbody">
              <p>• If you see a quota error from Google, swap to a fresh Gemini key.</p>
              <p>• Pro features (Pinterest connect & scheduling) unlock when <code>?pro=1</code> is in the URL.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
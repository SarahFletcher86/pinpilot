


import React, { useState, useCallback, useEffect } from 'react';
import { PinData, PinterestBoard, Template } from './types';
import { generatePinContent } from './services/geminiService';
import { fetchBoards, createPin, createVideoPin } from './services/pinterestService';
import MediaUploader from './components/ImageUploader';
import BrandingControls from './components/BrandingControls';
import DesignPreview from './components/DesignPreview';
import BoardInput from './components/BoardInput';
import PinResultCard from './components/PinResultCard';
import LoadingSpinner from './components/LoadingSpinner';
import { LogoIcon, SparklesIcon, ErrorIcon, PinterestIcon, CheckCircleIcon, UploadIcon, FilmIcon, ImageIcon, RefreshIcon, QuestionMarkCircleIcon } from './components/Icons';

function App() {
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
  const [boards, setBoards] = useState<string>('Home Decor, DIY Projects, Recipes, Fashion');
  const [overlayText, setOverlayText] = useState('Your Catchy Title Here');
  const [brandColors, setBrandColors] = useState({ text: '#FFFFFF', accent: '#000000' });
  const [brandFont, setBrandFont] = useState('Poppins');
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template>('standard');

  // Pinterest state
  const [pinterestToken, setPinterestToken] = useState<string>(() => localStorage.getItem('pinterestAccessToken') || '');
  const [userBoards, setUserBoards] = useState<PinterestBoard[]>([]);
  const [isFetchingBoards, setIsFetchingBoards] = useState<boolean>(false);
  const [fetchBoardsError, setFetchBoardsError] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [postingProgress, setPostingProgress] = useState<string | null>(null);

  const handlePinterestTokenChange = (token: string) => {
    setPinterestToken(token);
    if (token) {
        localStorage.setItem('pinterestAccessToken', token);
    } else {
        localStorage.removeItem('pinterestAccessToken');
    }
  };

  // Auto-fetch boards if token exists on load
  useEffect(() => {
    if (pinterestToken) {
      handleFetchBoards();
    }
  }, []); // Empty dependency array ensures this runs only once on mount

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
    setPostingProgress(null);
    setCurrentStep(1);
    // Keep branding and pinterest token on partial reset
    if(fullReset) {
        setBrandLogo(null);
        setOverlayText('Your Catchy Title Here');
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
        setFrameForAI(result); // For images, preview and AI frame are the same
        setCurrentStep(2);
      };
      reader.readAsDataURL(file);
    } else {
      setMediaPreviewUrl(URL.createObjectURL(file));
      // Frame capture will be handled by the MediaUploader component's onLoadedData
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
    setCurrentStep(3);

    try {
      const base64Data = designedImageBase64.split(',')[1];
      const mimeType = 'image/jpeg';
      const result = await generatePinContent(base64Data, mimeType, boards);
      setGeneratedPin(result);
    } catch (err: any) {
      console.error(err);
      if (err.status === 401) {
          setError("API Key is invalid or has been suspended. Please check your key in the Vercel project settings.");
      } else {
         setError(err.message || 'An unknown error occurred. Please try again.');
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
      if(boards.length > 0) setCurrentStep(4);
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
            data: base64Data
          }
        });
      } else if (mediaType === 'video') {
         await createVideoPin(pinterestToken, {
           board_id: boardId,
           title,
           description
         }, mediaFile, (message: string) => setPostingProgress(message));
      } else {
        throw new Error("Unsupported media type or missing file.");
      }
      setPostSuccess("Successfully posted to Pinterest!");
    } catch(err) {
      setPostError(err instanceof Error ? err.message : 'An unknown error occurred while posting.');
    } finally {
      setIsPosting(false);
      setPostingProgress(null);
    }
  };
  
  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between mb-8">
        <div className="flex items-center">
            <LogoIcon className="h-10 w-10 text-slate-700" />
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 ml-3 tracking-tight">AI Pin Generator</h1>
        </div>
        <div className="flex items-center space-x-2">
            <button 
                onClick={() => setShowHelp(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                title="Help"
            >
                <QuestionMarkCircleIcon className="h-4 w-4" />
                <span>Help</span>
            </button>
            <button 
                onClick={() => resetState(true)}
                disabled={currentStep === 1 && !mediaFile}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Start a new pin"
            >
                <RefreshIcon className="h-4 w-4" />
                <span>Start Over</span>
            </button>
        </div>
      </header>
      
      <main className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col space-y-6">
          {/* Step 1: Upload */}
          <div className={`${currentStep >= 1 ? 'opacity-100' : 'opacity-40'}`}>
             <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-4"><span className="bg-slate-800 text-white rounded-full h-6 w-6 text-sm flex items-center justify-center mr-3">1</span> Upload Image or Video</h3>
            {!mediaFile ? (
                 <MediaUploader onMediaUpload={handleMediaUpload} onFrameCapture={handleFrameCapture} />
            ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center space-x-4 animate-fade-in">
                    {mediaType === 'image' && mediaPreviewUrl && <img src={mediaPreviewUrl} alt="Preview" className="w-16 h-16 rounded-md object-cover" />}
                    {mediaType === 'video' && mediaPreviewUrl && <video src={mediaPreviewUrl} muted playsInline className="w-16 h-16 rounded-md object-cover bg-black" />}
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{mediaFile.name}</p>
                        <p className="text-xs text-slate-500">{mediaType === 'image' ? 'Image' : 'Video'} ({(mediaFile.size / 1024 / 1024).toFixed(2)} MB)</p>
                    </div>
                    <button onClick={() => resetState(false)} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                        Change
                    </button>
                </div>
            )}
          </div>

          {/* Step 2: Design */}
          {currentStep >= 2 && frameForAI && (
             <div className="animate-fade-in">
                <BrandingControls
                    logo={brandLogo}
                    template={selectedTemplate}
                    onTemplateChange={setSelectedTemplate}
                    text={overlayText}
                    onTextChange={setOverlayText}
                    colors={brandColors}
                    onColorChange={setBrandColors}
                    font={brandFont}
                    onFontChange={setBrandFont}
                    onLogoUpload={setBrandLogo}
                />
             </div>
          )}

          {currentStep >= 2 && (
            <>
              <BoardInput value={boards} onChange={setBoards} />
              <button
                onClick={handleGeneratePin}
                disabled={isLoading || !designedImageBase64}
                className="w-full bg-slate-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-black disabled:bg-slate-400 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <LoadingSpinner className="h-5 w-5 text-white" />
                ) : (
                  <>
                    <SparklesIcon className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                    Generate Pin Content
                  </>
                )}
              </button>
            </>
          )}

          {/* Step 4: Post */}
          {generatedPin && (
            <div className="border-t pt-6 animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center mb-4"><span className="bg-slate-800 text-white rounded-full h-6 w-6 text-sm flex items-center justify-center mr-3">3</span>Connect & Post</h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-500 mb-2">
                    To post pins, get your Access Token from the <a href="https://developers.pinterest.com/docs/getting-started/getting-access/" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-900">Pinterest Developer site</a>.
                  </p>
                  <input 
                    type="password"
                    value={pinterestToken}
                    onChange={e => handlePinterestTokenChange(e.target.value)}
                    placeholder="Paste your Pinterest Access Token here"
                    className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500"
                  />
                  <button
                    onClick={handleFetchBoards}
                    disabled={isFetchingBoards || !pinterestToken}
                    className="mt-2 w-full bg-slate-600 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center transition-all duration-300 ease-in-out hover:bg-slate-700 disabled:bg-slate-400"
                  >
                    {isFetchingBoards ? <LoadingSpinner className="h-5 w-5"/> : <><PinterestIcon className="h-5 w-5 mr-2" /> Fetch My Boards</>}
                  </button>
                  {fetchBoardsError && <p className="text-xs text-red-600 mt-2">{fetchBoardsError}</p>}
                  {userBoards.length > 0 && !isFetchingBoards && <div className="mt-3 flex items-center text-sm text-green-700 bg-green-100 p-3 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 mr-2"/> Successfully fetched {userBoards.length} boards! You can now post your pin.
                  </div>}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 flex flex-col justify-center items-center min-h-[400px] lg:min-h-[700px] sticky top-8">
          <h2 className="text-2xl font-semibold mb-4 text-center text-slate-800">
            {currentStep < 3 ? 'Design Preview' : 'Generated Pin'}
          </h2>

          <div className="w-full max-w-sm mx-auto">
            {currentStep === 2 && frameForAI && (
              <DesignPreview
                baseImage={frameForAI}
                template={selectedTemplate}
                text={overlayText}
                colors={brandColors}
                font={brandFont}
                logo={brandLogo}
                onDesignChange={handleDesignChange}
              />
            )}
            
            {currentStep === 3 && isLoading && (
              <div className="flex flex-col items-center text-slate-500">
                <LoadingSpinner className="h-8 w-8 text-slate-500"/>
                <p className="mt-4 text-center">Generating your pin... this might take a moment.</p>
              </div>
            )}
            {error && (
              <div className="flex flex-col items-center text-red-600 bg-red-100 p-4 rounded-lg">
                <ErrorIcon className="h-8 w-8 mb-2"/>
                <p className="font-medium">Generation Failed</p>
                <p className="text-sm text-center">{error}</p>
              </div>
            )}
            {currentStep < 2 && !mediaFile && (
               <div className="text-center text-slate-400 flex flex-col items-center">
                 <div className="flex -space-x-2 mb-4">
                    <ImageIcon className="h-16 w-16 text-slate-300 bg-white rounded-full border-4 border-white"/>
                    <FilmIcon className="h-16 w-16 text-slate-300 bg-white rounded-full border-4 border-white"/>
                 </div>
                <p>Upload a file to start designing.</p>
              </div>
            )}
            {generatedPin && (
              <PinResultCard 
                finalPinImageUrl={designedImageBase64}
                mediaPreviewUrl={mediaPreviewUrl}
                mediaType={mediaType}
                pinData={generatedPin}
                userBoards={userBoards}
                onPostPin={handlePostPin}
                isPosting={isPosting}
                postError={postError}
                postSuccess={postSuccess}
                postingProgress={postingProgress}
                isConnected={userBoards.length > 0}
              />
            )}
          </div>
        </div>
      </main>

      <footer className="w-full max-w-5xl mx-auto text-center text-slate-500 mt-8 text-sm">
        <p>Powered by Google Gemini & Pinterest API. Designed for inspiration.</p>
      </footer>
      
      {showHelp && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setShowHelp(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-title"
        >
            <div 
                className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 id="help-title" className="text-2xl font-bold text-slate-800 flex items-center">
                       <QuestionMarkCircleIcon className="h-7 w-7 mr-3 text-slate-600" />
                       Getting Started & Troubleshooting
                    </h2>
                    <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600 transition-colors text-3xl leading-none">&times;</button>
                </div>
                <div className="space-y-6 text-slate-600">
                    
                    <div>
                       <h3 className="font-bold text-lg text-slate-800 mb-2 border-b pb-2">Step 1: Get Your Keys & Tokens</h3>
                       <p className="text-sm mb-4">This app needs two separate keys to work. It's best to get these first.</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h4 className="font-semibold text-slate-800 mb-1 flex items-center"><SparklesIcon className="w-4 h-4 mr-2"/>Google Gemini API Key</h4>
                                <p className="text-xs mb-2">This key allows the AI to generate content.</p>
                                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-sm w-full block text-center bg-blue-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">Get from AI Studio</a>
                           </div>
                           <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                <h4 className="font-semibold text-slate-800 mb-1 flex items-center"><PinterestIcon className="w-4 h-4 mr-2"/>Pinterest Access Token</h4>
                                <p className="text-xs mb-2">This token lets the app post to your account.</p>
                                <a href="https://developers.pinterest.com/docs/getting-started/getting-access/" target="_blank" rel="noopener noreferrer" className="text-sm w-full block text-center bg-red-500 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-600 transition-colors">Get from Pinterest Developers</a>
                           </div>
                       </div>
                    </div>

                    <div>
                       <h3 className="font-bold text-lg text-slate-800 mb-2 border-b pb-2">Step 2: Deploy on Vercel</h3>
                       <p className="text-sm mb-2">Use the Vercel Hobby (free) plan to start. During setup, you must add your Google Gemini API Key.</p>
                       <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                           <h4 className="font-semibold text-slate-800 mb-1">Add an Environment Variable</h4>
                           <p className="text-sm">In Vercel's "Configure Project" settings, find the Environment Variables section and add the following:</p>
                           <div className="mt-2 p-2 bg-slate-200 rounded font-mono text-sm">
                               <strong>Name:</strong> <code className="text-slate-800">API_KEY</code><br/>
                               <strong>Value:</strong> <code className="text-slate-800">[Paste your Google Gemini Key here]</code>
                           </div>
                       </div>
                    </div>

                    <div>
                       <h3 className="font-bold text-lg text-slate-800 mb-2 border-b pb-2">Step 3: Troubleshooting Common Issues</h3>
                       <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-800">
                           <h4 className="font-semibold mb-2">Problem: "Failed to generate API key" or Billing Account Suspended</h4>
                           <p className="text-sm mb-2">This is usually a problem with Google's automated security systems, not your fault. It's often triggered by new accounts or certain types of debit cards.</p>
                           <p className="font-bold text-sm">Solution: The "Bypass" Method</p>
                           <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
                               <li>Create a **brand new, separate Google Account**.</li>
                               <li>Use the new account to get a free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google AI Studio</a>.</li>
                               <li>Use this new, working key in your Vercel Environment Variables.</li>
                               <li>You can try to fix your original Google account by contacting <a href="https://support.google.com/pay/gethelp" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Pay Support</a>, but use the new key to keep your project moving.</li>
                           </ol>
                       </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default App;

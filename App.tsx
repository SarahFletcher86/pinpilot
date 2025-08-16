import React, { useState } from 'react';
import ConnectPinterest from './components/ConnectPinterest';
import ScheduleForm from './components/ScheduleForm';
import BoardSelect from './components/BoardSelect';

function App() {
  // Pro flag from URL: https://your-site/?pro=1
  const isPro = new URLSearchParams(window.location.search).get('pro') === '1';

  // Existing state you already had
  const [brandingOptions, setBrandingOptions] = useState<Record<string, any>>({});
  const [frameForAI, setFrameForAI] = useState<string | null>(null);
  const [designedImageBase64, setDesignedImageBase64] = useState<string | null>(null);
  const [generatedPin, setGeneratedPin] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
  const [postingProgress, setPostingProgress] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // New: boards + selection for posting/scheduling
  const [userBoards, setUserBoards] = useState<any[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');

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
    setUserBoards([]);
    setSelectedBoardId('');

    if (fullReset) {
      localStorage.removeItem('branding');
      localStorage.removeItem('pinterestAccessToken');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-6">
      <header className="max-w-3xl mx-auto mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pin Pilot</h1>
        <button
          onClick={() => resetAll(true)}
          className="px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
        >
          Reset All
        </button>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        {!isPro && (
          <div className="p-4 rounded-lg border bg-white">
            <p>
              You’re on the free version. To unlock Pinterest connect & scheduling, open the Pro link:
            </p>
            <p className="mt-2">
              <a
                href={`${window.location.pathname}?pro=1`}
                className="text-indigo-600 underline"
              >
                Enable Pro features (temporary preview)
              </a>
            </p>
          </div>
        )}

        {isPro && (
          <>
            {/* 1) Connect to Pinterest (OAuth or paste token). When boards load, we store them. */}
            <ConnectPinterest onBoardsFetched={setUserBoards} />

            {/* 2) Choose a board once we have them */}
            {userBoards.length > 0 && (
              <div className="p-4 rounded-lg border bg-white">
                <BoardSelect
                  boards={userBoards}
                  value={selectedBoardId}
                  onChange={setSelectedBoardId}
                />
                {selectedBoardId === '' && (
                  <p className="text-xs text-slate-500 mt-1">Select a board to enable scheduling.</p>
                )}
              </div>
            )}

            {/* 3) Schedule form uses the selected board id (auto-filled, read-only inside) */}
            <div className="p-4 rounded-lg border bg-white">
              <ScheduleForm selectedBoardId={selectedBoardId} />
            </div>
          </>
        )}

        {/* (Your free features / designer could live here too) */}
      </main>

      <footer className="max-w-3xl mx-auto mt-10 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Pin Pilot</p>
      </footer>
    </div>
  );
}

export default App;

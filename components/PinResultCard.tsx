import React, { useMemo, useState } from 'react';
import { PinData, PinterestBoard } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { CheckCircleIcon, ErrorIcon, PinterestIcon, CalendarIcon } from './Icons';

type Props = {
  // visuals
  finalPinImageUrl: string | null;
  mediaPreviewUrl?: string | null;
  mediaType?: 'image' | 'video' | null;

  // generated content
  pinData: PinData;

  // boards and actions
  userBoards: PinterestBoard[];
  onPostPin?: (boardId: string, title: string, description: string) => Promise<void>;
  onSchedulePin?: (boardId: string, title: string, description: string, scheduledAt: string) => Promise<void>;

  // action states
  isPosting?: boolean;
  postError?: string | null;
  postSuccess?: string | null;
  postingProgress?: string | null;

  isScheduling?: boolean;
  scheduleError?: string | null;
  scheduleSuccess?: string | null;

  // connection + gating
  isConnected?: boolean;          // true when boards are fetched
  isPro?: boolean;                // pro/founders plan
  autoPostingEnabled?: boolean;   // feature flag (env)
};

const PinResultCard: React.FC<Props> = ({
  finalPinImageUrl,
  mediaPreviewUrl,
  mediaType,
  pinData,
  userBoards,
  onPostPin,
  onSchedulePin,
  isPosting = false,
  postError,
  postSuccess,
  postingProgress,
  isScheduling = false,
  scheduleError,
  scheduleSuccess,
  isConnected = false,
  isPro = false,
  autoPostingEnabled = false,
}) => {
  const [boardId, setBoardId] = useState<string>(userBoards[0]?.id || '');
  const [title, setTitle] = useState<string>(pinData.title || '');
  const [description, setDescription] = useState<string>(pinData.description || '');
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const canPost = isPro && autoPostingEnabled && isConnected && !!onPostPin;
  const canSchedule = isPro && autoPostingEnabled && isConnected && !!onSchedulePin;

  const previewSrc = useMemo(() => {
    if (finalPinImageUrl) return finalPinImageUrl;
    if (mediaType === 'image') return mediaPreviewUrl || '';
    return ''; // videos are uploaded at post-time
  }, [finalPinImageUrl, mediaPreviewUrl, mediaType]);

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl shadow p-4 space-y-4">
      {/* Image preview */}
      {previewSrc ? (
        <img
          src={previewSrc}
          alt="Pin preview"
          className="w-full aspect-square object-cover rounded-lg border"
        />
      ) : (
        <div className="w-full aspect-square bg-slate-100 rounded-lg grid place-items-center text-slate-400">
          No preview
        </div>
      )}

      {/* Editable fields */}
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="Enter a catchy title…"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-slate-500"
            placeholder="Add a helpful description…"
          />
        </label>

        {/* Boards */}
        <label className="block">
          <span className="text-xs font-semibold text-slate-600">Select Board</span>
          <select
            value={boardId}
            onChange={(e) => setBoardId(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            {userBoards.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Pro gate / status messaging */}
      {!isPro && (
        <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          Auto-posting & scheduling are <strong>Pro</strong> features. Upgrade to unlock.
        </div>
      )}

      {isPro && !autoPostingEnabled && (
        <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-sm">
          Auto-posting unlocks automatically once our Pinterest app upgrade is approved.
          You can still design and export now.
        </div>
      )}

      {isPro && autoPostingEnabled && !isConnected && (
        <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-sm">
          Connect Pinterest and fetch your boards to enable posting.
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Post now */}
        <button
          disabled={!canPost || isPosting || !boardId || !title}
          onClick={() => onPostPin && onPostPin(boardId, title, description)}
          className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold text-white
                     disabled:opacity-50 disabled:cursor-not-allowed
                     bg-red-600 hover:bg-red-700 transition"
          title={!canPost ? 'Posting disabled' : 'Post to Pinterest'}
        >
          {isPosting ? (
            <>
              <LoadingSpinner className="h-5 w-5 mr-2 text-white" /> Posting…
            </>
          ) : (
            <>
              <PinterestIcon className="h-5 w-5 mr-2" /> Post to Pinterest
            </>
          )}
        </button>

        {/* Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Schedule (local time)</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </label>
          <button
            disabled={!canSchedule || isScheduling || !boardId || !title || !scheduledAt}
            onClick={() => onSchedulePin && onSchedulePin(boardId, title, description, scheduledAt)}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold text-white
                       disabled:opacity-50 disabled:cursor-not-allowed
                       bg-slate-800 hover:bg-black transition"
            title={!canSchedule ? 'Scheduling disabled' : 'Schedule Pin'}
          >
            {isScheduling ? (
              <>
                <LoadingSpinner className="h-5 w-5 mr-2 text-white" /> Scheduling…
              </>
            ) : (
              <>
                <CalendarIcon className="h-5 w-5 mr-2" /> Schedule
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status + errors */}
      {!!postingProgress && (
        <div className="text-xs text-slate-600">{postingProgress}</div>
      )}

      {!!postSuccess && (
        <div className="mt-2 text-green-700 bg-green-100 border border-green-200 p-3 rounded-md text-sm flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" /> {postSuccess}
        </div>
      )}
      {!!postError && (
        <div className="mt-2 text-red-700 bg-red-100 border border-red-200 p-3 rounded-md text-sm flex items-center">
          <ErrorIcon className="h-5 w-5 mr-2" /> {postError}
        </div>
      )}

      {!!scheduleSuccess && (
        <div className="mt-2 text-green-700 bg-green-100 border border-green-200 p-3 rounded-md text-sm flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2" /> {scheduleSuccess}
        </div>
      )}
      {!!scheduleError && (
        <div className="mt-2 text-red-700 bg-red-100 border border-red-200 p-3 rounded-md text-sm flex items-center">
          <ErrorIcon className="h-5 w-5 mr-2" /> {scheduleError}
        </div>
      )}
    </div>
  );
};

export default PinResultCard;
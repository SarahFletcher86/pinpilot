import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import { PinterestIcon } from './Icons';

type Props = {
  userBoards: { id: string; name: string }[];
  onFetchBoards: () => void;
  isFetchingBoards: boolean;
  error: string | null;
};

const ScheduleForm: React.FC<Props> = ({ userBoards, onFetchBoards, isFetchingBoards, error }) => {
  return (
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 mt-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-700">
          {userBoards.length ? (
            <>Boards connected: <strong>{userBoards.length}</strong></>
          ) : (
            <>No boards fetched yet.</>
          )}
        </div>

        <button
          onClick={onFetchBoards}
          disabled={isFetchingBoards}
          className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white
                     bg-slate-700 hover:bg-slate-800 disabled:opacity-50"
        >
          {isFetchingBoards ? (
            <>
              <LoadingSpinner className="h-4 w-4 mr-2 text-white" /> Fetching…
            </>
          ) : (
            <>
              <PinterestIcon className="h-4 w-4 mr-2" /> Fetch My Boards
            </>
          )}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <p className="mt-3 text-xs text-slate-500">
        Choose your board and use the Schedule box in the card below to set the date/time.
      </p>
    </div>
  );
};

export default ScheduleForm;
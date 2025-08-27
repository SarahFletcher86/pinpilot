import React from 'react';
import { PinterestIcon } from './Icons';

const ConnectPinterest: React.FC = () => {
  const base = import.meta.env.VITE_APP_BASE_URL || window.location.origin;
  const connectUrl = `${base}/api/auth/connect`;

  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <button
        onClick={() => (window.location.href = connectUrl)}
        className="w-full inline-flex items-center justify-center rounded-lg px-4 py-2 font-semibold text-white
                   bg-red-600 hover:bg-red-700 transition"
      >
        <PinterestIcon className="h-5 w-5 mr-2" />
        Connect Pinterest
      </button>

      <p className="text-xs text-slate-500">
        After connecting, return here and click “Fetch My Boards”.
      </p>
    </div>
  );
};

export default ConnectPinterest;
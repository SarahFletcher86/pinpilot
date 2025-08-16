import React, { useEffect, useState } from 'react';
import { fetchBoards } from '../services/pinterestService';
import type { PinterestBoard } from '../types';

type Props = {
  onBoardsFetched?: (boards: PinterestBoard[]) => void;
};

export default function ConnectPinterest({ onBoardsFetched }: Props) {
  const [accessToken, setAccessToken] = useState<string>(() => localStorage.getItem('pinterestAccessToken') || '');
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [boards, setBoards] = useState<PinterestBoard[]>([]);

  // Try to load boards whenever we have a token
  useEffect(() => {
    const load = async () => {
      if (!accessToken) return;
      try {
        setStatus('loading');
        setError(null);
        const list = await fetchBoards(accessToken);
        setBoards(list);
        setStatus('ok');
        onBoardsFetched?.(list);
      } catch (e: any) {
        setStatus('error');
        setError(e?.message || 'Failed to fetch boards.');
      }
    };
    load();
  }, [accessToken, onBoardsFetched]);

  const startOAuth = () => {
    // This hits your serverless route: api/auth/start.ts
    window.location.href = '/api/auth/start';
  };

  const saveToken = () => {
    const t = accessToken.trim();
    if (!t) return;
    localStorage.setItem('pinterestAccessToken', t);
    // useEffect above will auto-fetch boards
  };

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-slate-800">Pinterest Connection</h4>
          <p className="text-xs text-slate-500">Connect your Pinterest to fetch boards and post/schedule pins.</p>
        </div>
        <button
          onClick={startOAuth}
          className="px-3 py-2 rounded-md bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
        >
          Connect with Pinterest
        </button>
      </div>

      <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <label className="block text-xs font-medium text-slate-700 mb-1">Or paste an Access Token (fallback)</label>
        <div className="flex gap-2">
          <input
            type="password"
            className="flex-1 p-2 border border-slate-300 rounded-md"
            placeholder="Paste token…"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
          />
          <button
            onClick={saveToken}
            className="px-3 py-2 rounded-md bg-slate-700 text-white text-sm font-semibold hover:bg-black"
          >
            Save
          </button>
        </div>
        <p className="text-[11px] text-slate-500 mt-1">
          Stored in your browser (localStorage) for testing. OAuth is preferred.
        </p>
      </div>

      <div className="mt-3">
        {status === 'loading' && <p className="text-sm text-slate-500">Fetching boards…</p>}
        {status === 'ok' && (
          <p className="text-sm text-green-700">
            Connected! Found {boards.length} board{boards.length === 1 ? '' : 's'}.
          </p>
        )}
        {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}

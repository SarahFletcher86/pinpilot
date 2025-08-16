import React from 'react';
import { PinterestBoard } from '../types';

type Props = {
  boards: PinterestBoard[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
};

export default function BoardSelect({ boards, value, onChange, disabled }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700">Choose Board</label>
      <select
        className="w-full p-2 border border-slate-300 rounded-md bg-white text-slate-900"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || boards.length === 0}
      >
        <option value="" disabled>
          {boards.length ? 'Select a board…' : 'No boards found'}
        </option>
        {boards.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500">This is the board your pin will be posted/scheduled to.</p>
    </div>
  );
}

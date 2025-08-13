import React from 'react';

interface BoardInputProps {
  value: string;
  onChange: (value: string) => void;
}

const BoardInput: React.FC<BoardInputProps> = ({ value, onChange }) => {
  return (
    <div>
      <label htmlFor="boards" className="block text-sm font-medium text-slate-700 mb-2">
        Optional: Your Existing Boards
      </label>
      <textarea
        id="boards"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-slate-600 focus:border-slate-600 transition duration-150 ease-in-out"
        placeholder="e.g., Summer Recipes, DIY Crafts, Home Office Ideas"
      />
      <p className="text-xs text-slate-500 mt-1">Separate board names with commas. This helps the AI make better suggestions.</p>
    </div>
  );
};

export default BoardInput;
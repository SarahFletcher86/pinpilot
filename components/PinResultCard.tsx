import React, { useState, useEffect } from 'react';
import { PinData, PinterestBoard } from '../types';
import { TagIcon, PinterestIcon, ErrorIcon, CheckCircleIcon, ClipboardIcon, ClipboardCheckIcon } from './Icons';
import LoadingSpinner from './LoadingSpinner';

interface PinResultCardProps {
  finalPinImageUrl: string | null;
  mediaPreviewUrl: string | null;
  mediaType: 'image' | 'video' | null;
  pinData: PinData;
  userBoards: PinterestBoard[];
  onPostPin: (boardId: string, title: string, description: string) => void;
  isPosting: boolean;
  postError: string | null;
  postSuccess: string | null;
  postingProgress: string | null;
  isConnected: boolean;
}

const PinResultCard: React.FC<PinResultCardProps> = ({ 
  finalPinImageUrl,
  mediaPreviewUrl,
  mediaType,
  pinData, 
  userBoards, 
  onPostPin,
  isPosting,
  postError,
  postSuccess,
  postingProgress,
  isConnected
}) => {
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [editableTitle, setEditableTitle] = useState(pinData.title);
  const [editableDescription, setEditableDescription] = useState(pinData.description);
  const [copiedState, setCopiedState] = useState<{field: string | null, timerId: number | null}>({ field: null, timerId: null });

  useEffect(() => {
    setEditableTitle(pinData.title);
    setEditableDescription(pinData.description);
    
    const suggestedBoard = userBoards.find(b => b.name.toLowerCase() === pinData.board.toLowerCase());
    if (suggestedBoard) {
      setSelectedBoardId(suggestedBoard.id);
    } else if (userBoards.length > 0) {
      setSelectedBoardId(userBoards[0].id);
    }
  }, [pinData, userBoards]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (copiedState.timerId) {
        clearTimeout(copiedState.timerId);
      }
    };
  }, [copiedState.timerId]);

  const handleCopy = (text: string, fieldName: 'title' | 'description') => {
    navigator.clipboard.writeText(text).then(() => {
        if (copiedState.timerId) {
            clearTimeout(copiedState.timerId);
        }
        const newTimerId = window.setTimeout(() => {
            setCopiedState({ field: null, timerId: null });
        }, 2000);
        setCopiedState({ field: fieldName, timerId: newTimerId });
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
  };

  const handlePostClick = () => {
    if (selectedBoardId) {
        onPostPin(selectedBoardId, editableTitle, editableDescription);
    }
  }

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 ease-in-out animate-fade-in">
      <div className="bg-slate-200">
        {mediaType === 'image' && finalPinImageUrl && (
          <img src={finalPinImageUrl} alt="Generated Pin Preview" className="w-full h-auto object-cover" />
        )}
        {mediaType === 'video' && mediaPreviewUrl && (
          <video src={mediaPreviewUrl} controls muted loop playsInline className="w-full h-auto object-cover" />
        )}
      </div>

      <div className="p-5">
        <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="title" className="block text-xs font-medium text-slate-500">Title</label>
                <button 
                    onClick={() => handleCopy(editableTitle, 'title')} 
                    title="Copy title" 
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
                >
                    {copiedState.field === 'title' ? <ClipboardCheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
                </button>
            </div>
            <input 
              id="title"
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="w-full font-bold text-xl text-slate-800 leading-tight border-b-2 border-transparent focus:border-slate-400 focus:outline-none bg-transparent p-0"
            />
        </div>
        <div className="mb-4">
             <div className="flex justify-between items-center mb-1">
                <label htmlFor="description" className="block text-xs font-medium text-slate-500">Description</label>
                <button 
                    onClick={() => handleCopy(editableDescription, 'description')} 
                    title="Copy description"
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 transition-colors"
                >
                    {copiedState.field === 'description' ? <ClipboardCheckIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
                </button>
            </div>
            <textarea 
              id="description"
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              rows={4}
              className="w-full text-slate-600 text-sm border-b-2 border-transparent focus:border-slate-400 focus:outline-none bg-transparent p-0 resize-none"
            />
        </div>
        <div className="mb-4">
            <p className="block text-xs font-medium text-slate-500 mb-1">Tags</p>
            <div className="flex flex-wrap gap-2">
                {pinData.tags.map((tag, index) => (
                    <span key={index} className="flex items-center bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        <TagIcon className="h-3 w-3 mr-1 text-slate-500" />
                        {tag}
                    </span>
                ))}
            </div>
        </div>

        {isConnected && (
            <div className="mt-6 border-t pt-4">
                <label htmlFor="board-select" className="block text-sm font-medium text-slate-700 mb-2">
                    Post to Board
                </label>
                 <select
                    id="board-select"
                    value={selectedBoardId}
                    onChange={(e) => setSelectedBoardId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500"
                >
                    <option value="" disabled>Select a board...</option>
                    {userBoards.map((board) => (
                        <option key={board.id} value={board.id}>{board.name}</option>
                    ))}
                     <option value="" disabled>---</option>
                    <option value="new_board" disabled>Suggested: "{pinData.board}" (Create manually)</option>
                </select>
                <button
                    onClick={handlePostClick}
                    disabled={isPosting || !selectedBoardId}
                    className="mt-4 w-full bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors hover:bg-black disabled:bg-slate-400 disabled:cursor-not-allowed"
                >
                    {isPosting ? (
                        <div className="flex items-center justify-center">
                           <LoadingSpinner className="h-5 w-5 mr-3" />
                           <span className="text-sm">{postingProgress || 'Posting...'}</span>
                        </div>
                    ) : (
                        <><PinterestIcon className="h-5 w-5 mr-2" /> Post to Pinterest</>
                    )}
                </button>
                {postSuccess && (
                    <div className="mt-3 flex items-center text-sm text-green-700 bg-green-100 p-3 rounded-lg">
                        <CheckCircleIcon className="h-5 w-5 mr-2"/> {postSuccess}
                    </div>
                )}
                 {postError && (
                    <div className="mt-3 flex items-center text-sm text-red-600 bg-red-100 p-3 rounded-lg">
                        <ErrorIcon className="h-5 w-5 mr-2"/> {postError}
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

// Add keyframes for animation in a style tag for simplicity in this setup
const style = document.createElement('style');
style.innerHTML = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}
`;
document.head.appendChild(style);

export default PinResultCard;
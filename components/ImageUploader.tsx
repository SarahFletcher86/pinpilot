import React, { useRef, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface MediaUploaderProps {
  onMediaUpload: (file: File, fileType: 'image' | 'video') => void;
  onFrameCapture: (base64Frame: string) => void;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ onMediaUpload, onFrameCapture }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      onMediaUpload(file, type);
    }
    // Reset file input value to allow re-uploading the same file
    if(event.target) {
        event.target.value = '';
    }
  };
  
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      const type = file.type.startsWith('image/') ? 'image' : 'video';
      onMediaUpload(file, type);
    }
  };

  const captureFrame = useCallback((e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = e.currentTarget;
    if (videoElement) {
        // Ensure video is seekable
        setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = videoElement.videoWidth;
            canvas.height = videoElement.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                onFrameCapture(dataUrl);
            }
        }, 100); // Small delay to ensure the frame is ready
    }
  }, [onFrameCapture]);

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const triggerFileSelect = (e: React.MouseEvent) => {
      e.preventDefault();
      fileInputRef.current?.click();
  }

  return (
    <div>
        <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="relative flex justify-center items-center w-full h-48 px-4 transition bg-white border-2 border-slate-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-slate-400 focus:outline-none"
        >
            <div className="text-center">
            <UploadIcon className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium text-slate-700 underline hover:text-slate-800" onClick={triggerFileSelect}>Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-slate-500">Image (PNG, JPG) or Video (MP4)</p>
            </div>
            <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/quicktime"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </label>
        {/* Hidden video element for frame capture */}
        <video 
            ref={videoRef}
            onLoadedData={captureFrame}
            muted
            playsInline
            src={videoRef.current?.src}
            className="hidden"
        />
    </div>
  );
};

export default MediaUploader;

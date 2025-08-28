import React, { useRef } from "react";

export default function ImageUploader({
  onMediaUpload,
}: {
  onMediaUpload: (file: File, type: "image" | "video") => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const type: "image" | "video" = f.type.startsWith("video") ? "video" : "image";
    onMediaUpload(f, type);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    const type: "image" | "video" = f.type.startsWith("video") ? "video" : "image";
    onMediaUpload(f, type);
  };

  return (
    <div
      className="uploader"
      onClick={openPicker}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,video/mp4"
        onChange={onChange}
        hidden
      />
      <div className="uploader-inner">
        <strong>Click to upload</strong> or drag and drop
        <div className="subtle">Image (PNG/JPG) or Video (MP4)</div>
      </div>
    </div>
  );
}
// components/ImageUploader.tsx
import React, { useRef } from "react";

type Props = {
  onPick: (file: File, mime: string, base64NoPrefix: string, previewUrl: string) => void;
};

export default function ImageUploader({ onPick }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);

  function readFile(file: File) {
    const mime = file.type.startsWith("image/") ? file.type : file.type; // supports video too
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || "");
      const [, base64] = dataUrl.split(",");
      const preview = file.type.startsWith("image/")
        ? dataUrl
        : URL.createObjectURL(file);
      onPick(file, mime, base64 || "", preview);
    };
    reader.readAsDataURL(file);
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) readFile(f);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) readFile(f);
  }

  return (
    <div className="pp-form" style={{ marginTop: 6 }}>
      <div
        className="pp-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div style={{ marginBottom: 8 }}>
          <strong>Click to upload</strong> or drag and drop
        </div>
        <div style={{ fontSize: 12 }}>Image (PNG/JPG) or Video (MP4)</div>
        <div style={{ marginTop: 12 }}>
          <button
            className="pp-btn"
            onClick={(e) => {
              e.preventDefault();
              ref.current?.click();
            }}
          >
            Choose File
          </button>
        </div>
        <input
          ref={ref}
          type="file"
          style={{ display: "none" }}
          accept="image/png,image/jpeg,video/mp4"
          onChange={onChange}
        />
      </div>
    </div>
  );
}
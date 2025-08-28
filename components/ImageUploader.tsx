// components/ImageUploader.tsx
import React, { useRef, useState } from "react";

export default function ImageUploader() {
  const ref = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");

  function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setFileName(f ? `${f.name} (${Math.round(f.size/1024)} KB)` : "");
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (ref.current && f) {
      const dt = new DataTransfer();
      dt.items.add(f);
      ref.current.files = dt.files;
      setFileName(`${f.name} (${Math.round(f.size/1024)} KB)`);
    }
  }

  return (
    <div className="pp-form">
      <div
        className="pp-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div style={{ marginBottom: 8 }}>
          <strong>Click to upload</strong> or drag and drop
        </div>
        <div style={{ fontSize: 12 }}>
          Image (PNG/JPG) or Video (MP4)
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="pp-btn" onClick={(e) => { e.preventDefault(); ref.current?.click(); }}>
            Choose File
          </button>
        </div>
        <input
          ref={ref}
          type="file"
          style={{ display: "none" }}
          accept="image/png,image/jpeg,video/mp4"
          onChange={onSelect}
        />
      </div>

      {fileName && (
        <div className="pp-row">
          <div className="pp-label">Selected file</div>
          <div className="pp-input" style={{ paddingTop: 8, paddingBottom: 8 }}>
            {fileName}
          </div>
        </div>
      )}
    </div>
  );
}
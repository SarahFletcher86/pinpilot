import React, { useCallback, useRef } from 'react';

export function ImageDropzone({
  onFile,
  accept = 'image/*',
  label = 'Click to upload or drag and drop',
}:{
  onFile: (file: File)=>void;
  accept?: string;
  label?: string;
}){
  const inputRef = useRef<HTMLInputElement|null>(null);
  const open = () => inputRef.current?.click();

  const onChange = (e: React.ChangeEvent<HTMLInputElement>)=>{
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent)=>{
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  },[onFile]);

  return (
    <div
      onClick={open}
      onDragOver={(e)=>{e.preventDefault();}}
      onDrop={onDrop}
      style={{cursor:'pointer'}}
      className="pp-input"
    >
      {label}
      <input ref={inputRef} type="file" accept={accept} onChange={onChange} hidden/>
    </div>
  );
}
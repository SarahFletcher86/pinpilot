import React, { useEffect, useState } from 'react';
import './index.css';
import UploadBrandPanel from './components/UploadBrandPanel';
import PreviewContentPanel from './components/PreviewContentPanel';
import { BrandingOptions } from './types';
import { fileToDataUrl, resizeToPin } from './services/image';

const DEFAULTS: BrandingOptions = {
  overlayText: '',
  colors: { brand:'#7c3aed', accent:'#10b981', text:'#111827', bar:'#ffffff' },
  font: 'Poppins',
  template: 'bottomBar',
  showOverlay: true,
  logoDataUrl: null,
  logoEnabled: true,
  logoSize: 0.16,
  logoPos: { x: 0.86, y: 0.86 },
  textPos: { x: 0.5, y: 0.12 },
};

function useLocal<T>(key:string, initial:T){
  const [val, setVal] = useState<T>(()=> {
    try{ const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw) as T; }catch{}
    return initial;
  });
  useEffect(()=>{ try{ localStorage.setItem(key, JSON.stringify(val)); }catch{} }, [key, val]);
  return [val, setVal] as const;
}

export default function App(){
  const [options, setOptionsRaw] = useLocal<BrandingOptions>('pp_branding', DEFAULTS);
  const setOptions = (u: Partial<BrandingOptions>) => setOptionsRaw({...options, ...u});

  const [imageName, setImageName] = useState<string|null>(null);
  const [pinBase, setPinBase] = useState<string|null>(null);

  async function onImageFile(f: File){
    setImageName(f.name);
    const data = await fileToDataUrl(f);
    const pin = await resizeToPin(data, 1000, 1500);
    setPinBase(pin);
  }
  async function onLogoFile(f: File){
    const data = await fileToDataUrl(f);
    setOptions({ logoDataUrl: data });
  }

  // header tagline (match site)
  return (
    <div className="pp-wrap">
      <header className="pp-header">
        <div className="pp-brand">
          <img className="pp-logo" src="/logo.png" alt="Pin Pilot"/>
          <div>
            <div className="pp-title">Pin Pilot</div>
            <div className="pp-tagline">Your AI Pinterest Pin Generator ✨</div>
          </div>
        </div>
        <div>
          <span className="badge">Free tier</span>
        </div>
      </header>

      <main className="pp-grid">
        <UploadBrandPanel
          imageName={imageName}
          onImageFile={onImageFile}
          options={options}
          setOptions={setOptions}
          onLogoFile={onLogoFile}
        />
        <PreviewContentPanel pinBase={pinBase} options={options}/>
      </main>

      <div className="pp-actions">
        <button className="pp-btn ghost" onClick={()=>{ localStorage.removeItem('pp_branding'); location.reload(); }}>
          Reset
        </button>
        <a className="pp-btn ghost" href="?pro=1">Preview Pro</a>
      </div>
    </div>
  );
}
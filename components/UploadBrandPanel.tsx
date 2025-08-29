import React from 'react';
import { BrandingOptions, TemplateType } from '../types';
import { ImageDropzone } from './ImageDropzone';

const fonts = ['Poppins','Inter','Nunito','Montserrat','Outfit','Rubik'];

export default function UploadBrandPanel({
  imageName,
  onImageFile,
  options,
  setOptions,
  onLogoFile,
}:{
  imageName: string | null;
  onImageFile: (f: File)=>void;
  options: BrandingOptions;
  setOptions: (u: Partial<BrandingOptions>)=>void;
  onLogoFile: (f: File)=>void;
}){
  const set = (u: Partial<BrandingOptions>)=>setOptions(u);

  return (
    <div className="pp-card">
      <h3 className="pp-step">① Upload & Brand</h3>

      <div className="pp-field">
        <div className="pp-label"><span>Pin Image</span><span className="badge">Auto-resizes to 1000×1500</span></div>
        <ImageDropzone onFile={onImageFile}/>
        {imageName && <div className="pp-help" style={{marginTop:6}}>Selected: {imageName}</div>}
      </div>

      <div className="pp-field">
        <div className="pp-label">Template</div>
        <select className="pp-select" value={options.template} onChange={e=>set({template: e.target.value as TemplateType})}>
          <option value="none">None (image only)</option>
          <option value="bottomBar">Bottom Bar</option>
          <option value="cornerTag">Corner Tag</option>
          <option value="textOverlay">Text Overlay</option>
        </select>
        <div className="pp-row" style={{marginTop:6}}>
          <input type="checkbox" checked={options.showOverlay} onChange={e=>set({showOverlay:e.target.checked})}/>
          <span className="pp-help">Enable overlay</span>
        </div>
      </div>

      <div className="pp-field">
        <div className="pp-label">Overlay Text</div>
        <input className="pp-input" placeholder="Your catchy title here" value={options.overlayText} onChange={e=>set({overlayText:e.target.value})}/>
      </div>

      <div className="pp-field">
        <div className="pp-label">Brand Colours</div>
        <div className="pp-color-row">
          <input type="text" className="pp-input" style={{flex:1}} value={options.colors.brand} onChange={e=>set({colors:{...options.colors, brand:e.target.value}})}/>
          <input type="color" value={options.colors.brand} onChange={e=>set({colors:{...options.colors, brand:e.target.value}})} />
        </div>
        <div className="pp-color-row" style={{marginTop:8}}>
          <input type="text" className="pp-input" style={{flex:1}} value={options.colors.accent} onChange={e=>set({colors:{...options.colors, accent:e.target.value}})}/>
          <input type="color" value={options.colors.accent} onChange={e=>set({colors:{...options.colors, accent:e.target.value}})} />
        </div>
        <div className="pp-color-row" style={{marginTop:8}}>
          <input type="text" className="pp-input" style={{flex:1}} value={options.colors.bar} onChange={e=>set({colors:{...options.colors, bar:e.target.value}})}/>
          <input type="color" value={options.colors.bar} onChange={e=>set({colors:{...options.colors, bar:e.target.value}})} />
        </div>
      </div>

      <div className="pp-field">
        <div className="pp-label">Font</div>
        <select className="pp-select" value={options.font} onChange={e=>set({font:e.target.value})}>
          {fonts.map(f=><option key={f} value={f}>{f}</option>)}
        </select>
      </div>

      {options.template==='textOverlay' && (
        <div className="pp-field">
          <div className="pp-label">Text Position</div>
          <div className="pp-row">
            <input type="range" min={0.1} max={0.9} step={0.01} value={options.textPos.x} onChange={e=>set({textPos:{...options.textPos, x:Number(e.target.value)}})} />
            <input type="range" min={0.1} max={0.9} step={0.01} value={options.textPos.y} onChange={e=>set({textPos:{...options.textPos, y:Number(e.target.value)}})} />
          </div>
        </div>
      )}

      <div className="pp-field">
        <div className="pp-label">Logo</div>
        <ImageDropzone onFile={onLogoFile} accept="image/*" label={options.logoDataUrl ? 'Replace Logo' : 'Upload Logo'} />
        <div className="pp-row" style={{marginTop:6}}>
          <input type="checkbox" checked={options.logoEnabled} onChange={e=>set({logoEnabled:e.target.checked})}/>
          <span className="pp-help">Include logo on the image</span>
        </div>
        <div className="pp-label" style={{marginTop:8}}>Logo size / position</div>
        <div className="pp-row">
          <input type="range" min={0.06} max={0.35} step={0.005} value={options.logoSize} onChange={e=>set({logoSize:Number(e.target.value)})}/>
          <input type="range" min={0.05} max={0.95} step={0.01} value={options.logoPos.x} onChange={e=>set({logoPos:{...options.logoPos, x:Number(e.target.value)}})} />
          <input type="range" min={0.05} max={0.95} step={0.01} value={options.logoPos.y} onChange={e=>set({logoPos:{...options.logoPos, y:Number(e.target.value)}})} />
        </div>
      </div>

      <div className="pp-help">Pinterest connect & scheduling are <b>Pro</b> features.</div>
    </div>
  );
}
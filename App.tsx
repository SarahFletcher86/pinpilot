// App.tsx — Pin Pilot UI (brand tuned), larger header logo, no title text,
// bigger default canvas logo, clear API status banner.

import React, { useEffect, useRef, useState } from "react";
import { generatePinCopy } from "./services/geminiService";
import "./index.css";

// Import JSZip for ZIP file creation
import JSZip from 'jszip';

type TemplateKind = "off" | "bottom" | "side" | "diagonal";
type FitMode = "contain" | "cover";
type LogoAnchor =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";
type Platform = "pinterest" | "instagram" | "tiktok" | "twitter" | "facebook";
type ExportFormat = {
  name: string;
  width: number;
  height: number;
  platform: Platform;
  description: string;
};

const PIN = { w: 1000, h: 1500 }; // 2:3 standard

const clamp = (n:number, min:number, max:number)=>Math.max(min, Math.min(max, n));
const hex = (v:string, fb:string)=> {
  if (!v) return fb; const s=v.trim().replace(/[^#a-fA-F0-9]/g,"");
  return s.startsWith("#")?s:"#"+s;
};

export default function App(){
  const urlParams = new URLSearchParams(window.location.search);
  const isPro = urlParams.get("pro")==="1";
  const showPricing = urlParams.get("pricing")==="1" || urlParams.get("checkout")==="1";

  // state
  const [fit, setFit] = useState<FitMode>("contain");
  const [template, setTemplate] = useState<TemplateKind>("bottom");
  const [overlayOn, setOverlayOn] = useState(false);
  const [overlayText, setOverlayText] = useState("Your catchy title here");

  const [brand, setBrand] = useState({ primary:"#5459D4", accent:"#74D6D8", text:"#1C1E45" });
  const [font, setFont] = useState("Poppins");

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [srcImg, setSrcImg] = useState<HTMLImageElement|null>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement|null>(null);
  const [uploadedImageData, setUploadedImageData] = useState<string|null>(null);
  const [uploadedLogoData, setUploadedLogoData] = useState<string|null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoAnchor, setLogoAnchor] = useState<LogoAnchor>("bottom-right");
  const [logoScale, setLogoScale] = useState(0.22); // larger by default
  const [logoOffset, setLogoOffset] = useState({ x:0, y:0 });

  const [title, setTitle] = useState("");
  const [desc, setDesc]   = useState("");
  const [tags, setTags]   = useState("");
  const [businessNiche, setBusinessNiche] = useState("digital products, stickers, graphics");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string|null>(null);

  const [downloadUrl, setDownloadUrl] = useState("");
  const [apiBanner, setApiBanner] = useState<{kind:"info"|"error", text:string}|null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("pinterest");
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>([]);
  const [generatedVariations, setGeneratedVariations] = useState<any[]>([]);
  const [currentVariation, setCurrentVariation] = useState(0);

  const cvsRef = useRef<HTMLCanvasElement|null>(null);

  // Load saved settings on startup
  useEffect(() => {
    const savedSettings = localStorage.getItem('pinPilot_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.brand) setBrand(settings.brand);
        if (settings.font) setFont(settings.font);
        if (settings.template) setTemplate(settings.template);
        if (settings.overlayOn !== undefined) setOverlayOn(settings.overlayOn);
        if (settings.overlayText) setOverlayText(settings.overlayText);
        if (settings.businessNiche) setBusinessNiche(settings.businessNiche);
        if (settings.fit) setFit(settings.fit);
        if (settings.includeLogo !== undefined) setIncludeLogo(settings.includeLogo);
        if (settings.logoAnchor) setLogoAnchor(settings.logoAnchor);
        if (settings.logoScale) setLogoScale(settings.logoScale);
        if (settings.logoOffset) setLogoOffset(settings.logoOffset);
        // Note: Image data is no longer persisted to prevent localStorage quota issues
        // Images will need to be re-uploaded after page refresh
      } catch (e) {
        console.error('Error loading saved settings:', e);
        // If there's an error (likely due to large image data), clear localStorage
        localStorage.removeItem('pinPilot_settings');
      }
    }

    // Initialize export formats for selected platform
    updateExportFormats("pinterest");
  }, []);


  // Save settings whenever they change (exclude large image data to prevent localStorage quota exceeded)
  useEffect(() => {
    const settings = {
      brand,
      font,
      template,
      overlayOn,
      overlayText,
      businessNiche,
      fit,
      includeLogo,
      logoAnchor,
      logoScale,
      logoOffset,
      selectedPlatform
      // Note: uploadedImageData and uploadedLogoData are not saved to prevent localStorage quota issues
    };
    localStorage.setItem('pinPilot_settings', JSON.stringify(settings));
  }, [brand, font, template, overlayOn, overlayText, businessNiche, fit, includeLogo, logoAnchor, logoScale, logoOffset, selectedPlatform]);

  // API status is now handled server-side in the generate endpoint
  // No need to check from frontend since environment variables are server-only

  // file helpers
  const readImage = (file:File, cb:(img:HTMLImageElement)=>void)=>{
    const fr = new FileReader();
    fr.onload = ()=>{ const i=new Image(); i.onload=()=>cb(i); i.src = fr.result as string; };
    fr.readAsDataURL(file);
  };

  const readImageWithData = (file:File, cb:(img:HTMLImageElement, dataUrl:string)=>void)=>{
    console.log('Starting to read image file:', file.name, 'size:', file.size, 'type:', file.type);
    const fr = new FileReader();
    fr.onload = ()=>{
      try {
        const dataUrl = fr.result as string;
        console.log('FileReader loaded, dataUrl length:', dataUrl.length, 'starts with:', dataUrl.substring(0, 50));
        const i = new Image();
        i.onload = ()=>{
          console.log('Image loaded successfully, dimensions:', i.width, 'x', i.height);
          console.log('Calling callback with image and dataUrl');
          cb(i, dataUrl);
        };
        i.onerror = (error)=>{
          console.error('Failed to load image:', error);
          console.log('Calling callback with null image');
          // Still call callback with null image to prevent crash
          cb(null as any, dataUrl);
        };
        console.log('Setting image src to dataUrl');
        i.src = dataUrl;
      } catch (e) {
        console.error('Error reading image file:', e);
      }
    };
    fr.onerror = (error)=>{
      console.error('Failed to read file with FileReader');
    };
    fr.readAsDataURL(file);
  };

  const extractVideoThumbnail = (file:File, cb:(img:HTMLImageElement)=>void)=>{
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = ()=>{
        try {
          video.currentTime = 1; // Seek to 1 second
        } catch (e) {
          console.error('Error seeking video:', e);
          // Try with current time 0
          video.currentTime = 0;
        }
      };
      video.onseeked = ()=>{
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if(ctx) {
            ctx.drawImage(video, 0, 0);
            const img = new Image();
            img.onload = ()=>cb(img);
            img.onerror = ()=>{
              console.error('Failed to create video thumbnail image');
              cb(null as any);
            };
            img.src = canvas.toDataURL('image/png');
          } else {
            console.error('Failed to get canvas context');
            cb(null as any);
          }
        } catch (e) {
          console.error('Error creating video thumbnail:', e);
          cb(null as any);
        }
      };
      video.onerror = ()=>{
        console.error('Failed to load video file');
        cb(null as any);
      };
      video.src = URL.createObjectURL(file);
    } catch (e) {
      console.error('Error in extractVideoThumbnail:', e);
      cb(null as any);
    }
  };

  // draw canvas
  useEffect(()=>{
    console.log('Canvas render triggered, srcImg exists:', !!srcImg);
    const c = cvsRef.current; if(!c) return;
    c.width = PIN.w; c.height = PIN.h;
    const ctx = c.getContext("2d"); if(!ctx) return;

    // bg
    ctx.fillStyle = "#0a0f1f";
    ctx.fillRect(0,0,PIN.w,PIN.h);

    // main image
    if (srcImg){
      console.log('Drawing image, dimensions:', srcImg.width, 'x', srcImg.height);
      const sw=srcImg.width, sh=srcImg.height;
      const cr = PIN.w/PIN.h, ir = sw/sh;

      if (fit==="contain"){
        const k = Math.min(PIN.w/sw, PIN.h/sh);
        const dw = sw*k, dh = sh*k, dx = (PIN.w-dw)/2, dy=(PIN.h-dh)/2;

        // soft plate so contain doesn’t look letterboxed
        ctx.fillStyle = "#0b1222";
        ctx.fillRect(0,0,PIN.w,PIN.h);
        ctx.drawImage(srcImg, dx, dy, dw, dh);
      } else {
        let sx=0, sy=0, sw2=sw, sh2=sh;
        if (ir>cr){ const newW = sh*cr; sx=(sw-newW)/2; sw2=newW; }
        else { const newH = sw/cr; sy=(sh-newH)/2; sh2=newH; }
        ctx.drawImage(srcImg, sx,sy,sw2,sh2, 0,0,PIN.w,PIN.h);
      }
    } else {
      console.log('No srcImg to draw, showing background only');
    }

    // template overlays
    ctx.save();
    ctx.font = `bold 54px ${font}, system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    if (template==="bottom"){
      const h=190;
      ctx.fillStyle="#00000090"; ctx.fillRect(0,PIN.h-h,PIN.w,h);
      if (overlayOn){ ctx.fillStyle=brand.accent; ctx.fillRect(0,PIN.h-h,14,h); ctx.fillStyle=brand.text; ctx.fillText(overlayText, 40, PIN.h-h/2); }
    }
    if (template==="side"){
      const w=210;
      ctx.fillStyle="#00000080"; ctx.fillRect(PIN.w-w,0,w,PIN.h);
      if (overlayOn){ ctx.save(); ctx.translate(PIN.w-w/2, PIN.h/2); ctx.rotate(-Math.PI/2); ctx.fillStyle=brand.text; ctx.fillText(overlayText, -PIN.h/2+20,0); ctx.restore(); }
    }
    if (template==="diagonal"){
      ctx.fillStyle="#00000070";
      ctx.beginPath();
      ctx.moveTo(0, PIN.h*.72); ctx.lineTo(PIN.w, PIN.h*.52); ctx.lineTo(PIN.w, PIN.h); ctx.lineTo(0,PIN.h); ctx.closePath(); ctx.fill();
      if (overlayOn){ ctx.fillStyle=brand.text; ctx.fillText(overlayText, 28, PIN.h-100); }
    }
    ctx.restore();

    // logo pass
    if (includeLogo && logoImg){
      const lw = PIN.w*clamp(logoScale, .08, .35);
      const ratio = logoImg.width / logoImg.height || 1;
      const lh = lw / ratio;

      const pad = 24;
      const centers:any = {
        "top-left":{x:pad,y:pad},"top-center":{x:PIN.w/2,y:pad},"top-right":{x:PIN.w-pad,y:pad},
        "middle-left":{x:pad,y:PIN.h/2},"center":{x:PIN.w/2,y:PIN.h/2},"middle-right":{x:PIN.w-pad,y:PIN.h/2},
        "bottom-left":{x:pad,y:PIN.h-pad},"bottom-center":{x:PIN.w/2,y:PIN.h-pad},"bottom-right":{x:PIN.w-pad,y:PIN.h-pad}
      };
      let {x,y}=centers[logoAnchor];
      if (logoAnchor.endsWith("center")) x -= lw/2;
      if (logoAnchor.includes("right")) x -= lw;
      if (logoAnchor.startsWith("middle")) y -= lh/2;
      if (logoAnchor.startsWith("bottom")) y -= lh;
      x += logoOffset.x; y += logoOffset.y;

      ctx.save(); ctx.globalAlpha=.9; ctx.drawImage(logoImg, x,y,lw,lh); ctx.restore();
    }

    setDownloadUrl(c.toDataURL("image/png"));
  }, [srcImg, fit, template, overlayOn, overlayText, brand, font, includeLogo, logoImg, logoAnchor, logoScale, logoOffset]);

  // handlers
  const onFiles = (files:FileList|null)=>{
    if(!files) return;
    const fileArray = Array.from(files);
    const hasVideo = fileArray.some(f=>f.type.startsWith('video/'));
    const imageCount = fileArray.filter(f=>f.type.startsWith('image/')).length;
    const videoCount = fileArray.filter(f=>f.type.startsWith('video/')).length;

    // Validation
    if(hasVideo && videoCount > 1) { alert('Only 1 video allowed'); return; }
    if(!hasVideo && imageCount > 3) { alert('Maximum 3 images allowed'); return; }
    if(hasVideo && imageCount > 0) { alert('Cannot mix video and images'); return; }
    if(fileArray.length === 0) return;

    setUploadedFiles(fileArray);
    setIsVideo(hasVideo);

    // Process first file for preview
    const firstFile = fileArray[0];
    if(firstFile.type.startsWith('video/')) {
      extractVideoThumbnail(firstFile, (img) => {
        if (img) {
          setSrcImg(img);
          // For videos, we'll store the thumbnail
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if(ctx) {
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/png');
              setUploadedImageData(dataUrl);
            }
          } catch (e) {
            console.error('Error creating video thumbnail data URL:', e);
          }
        } else {
          console.error('Failed to extract video thumbnail');
          setApiBanner({kind: "error", text: "Failed to process video file. Please try a different file."});
        }
      });
    } else {
      readImageWithData(firstFile, (img, dataUrl) => {
        if (img) {
          setSrcImg(img);
          setUploadedImageData(dataUrl);
        } else {
          console.error('Failed to load uploaded image');
          setApiBanner({kind: "error", text: "Failed to load image. Please try a different file."});
        }
      });
    }
  };

  const onMain = (f:File|null)=>{
    if(!f) return;
    readImageWithData(f, (img, dataUrl) => {
      if (img) {
        setSrcImg(img);
        setUploadedImageData(dataUrl);
      } else {
        console.error('Failed to load main image');
        setApiBanner({kind: "error", text: "Failed to load image. Please try a different file."});
      }
    });
  };
  const onLogo = (f:File|null)=>{
    if(!f) return;
    readImageWithData(f, (img, dataUrl) => {
      if (img) {
        setLogoImg(img);
        setUploadedLogoData(dataUrl);
      } else {
        console.error('Failed to load logo image');
        setApiBanner({kind: "error", text: "Failed to load logo. Please try a different file."});
      }
    });
  };

  // Update export formats based on selected platform
  const updateExportFormats = (platform: Platform) => {
    const formats: ExportFormat[] = [];

    switch (platform) {
      case "pinterest":
        formats.push(
          { name: "Pinterest Pin", width: 1000, height: 1500, platform: "pinterest", description: "Standard Pinterest pin (2:3)" },
          { name: "Pinterest Story", width: 1080, height: 1920, platform: "pinterest", description: "Pinterest story (9:16)" }
        );
        break;
      case "instagram":
        formats.push(
          { name: "Instagram Post", width: 1080, height: 1080, platform: "instagram", description: "Square Instagram post" },
          { name: "Instagram Story", width: 1080, height: 1920, platform: "instagram", description: "Instagram story (9:16)" },
          { name: "Instagram Reel", width: 1080, height: 1920, platform: "instagram", description: "Instagram reel (9:16)" }
        );
        break;
      case "tiktok":
        formats.push(
          { name: "TikTok Video", width: 1080, height: 1920, platform: "tiktok", description: "TikTok video (9:16)" }
        );
        break;
      case "twitter":
        formats.push(
          { name: "Twitter Post", width: 1200, height: 675, platform: "twitter", description: "Twitter/X post image" }
        );
        break;
      case "facebook":
        formats.push(
          { name: "Facebook Post", width: 1200, height: 630, platform: "facebook", description: "Facebook post image" }
        );
        break;
    }

    setExportFormats(formats);
  };

  const doGenerate = async ()=>{
    if (uploadedFiles.length === 0){ setAiError("Upload files first."); return; }
    setAiError(null); setAiLoading(true);
    try{
      // For free tier, apply default branding automatically
      if (!isPro) {
        // Only set template if user hasn't chosen one (template is still "off")
        if (template === "off") {
          setTemplate("bottom");
        }
        setOverlayOn(true);
        setOverlayText("Your catchy title here");
        setBrand({ primary: "#5459D4", accent: "#74D6D8", text: "#1C1E45" });
        setFont("Poppins");
        // Only set logo defaults if no logo is uploaded
        if (!logoImg) {
          setIncludeLogo(true);
          setLogoAnchor("bottom-right");
          setLogoScale(0.22);
        }
      }

      // Check if this is demo mode
      const isDemo = window.location.search.includes('demo=1');

      // Convert files to base64 (skip for demo mode to avoid payload size limits)
      let base64Files: string[] = [];
      if (isDemo) {
        // In demo mode, just send a placeholder
        base64Files = ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='];
        console.log('Demo mode: Using placeholder image to avoid payload size limits');
      } else {
        // Convert files to base64 for real processing
        const filePromises = uploadedFiles.map(file => {
          return new Promise<string>((resolve) => {
            const fr = new FileReader();
            fr.onload = () => resolve(fr.result as string);
            fr.readAsDataURL(file);
          });
        });
        base64Files = await Promise.all(filePromises);
      }


      // Call secure backend API for AI generation
      console.log('Calling secure backend API for AI generation' + (isDemo ? ' (Demo Mode)' : ''));
      const backendResponse = await fetch(`/api/generate${isDemo ? '?demo=1' : ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: base64Files,
          isVideo,
          brandPrimary: brand.primary,
          brandAccent: brand.accent,
          overlayText,
          businessNiche,
          demo: isDemo ? '1' : undefined
        })
      });

      console.log('Backend response status:', backendResponse.status);
      if (!backendResponse.ok) {
        let errorMessage = `AI generation failed: ${backendResponse.status}`;
        try {
          const errorData = await backendResponse.json();
          console.error('Backend API error:', errorData);
          errorMessage = `AI generation failed: ${errorData.message || backendResponse.status}`;
        } catch (parseError) {
          console.error('Failed to parse error response as JSON:', parseError);
          // Try to get the response as text
          try {
            const errorText = await backendResponse.text();
            console.error('Error response text:', errorText);
            errorMessage = `AI generation failed: ${errorText || backendResponse.status}`;
          } catch (textError) {
            console.error('Failed to get error response as text:', textError);
          }
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = await backendResponse.json();
        console.log('Backend response data:', data);
      } catch (parseError) {
        console.error('Failed to parse backend response as JSON:', parseError);
        // Try to get the response as text to see what's being returned
        try {
          const responseText = await backendResponse.text();
          console.error('Raw response text:', responseText);
          throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 200)}`);
        } catch (textError) {
          console.error('Failed to get response as text:', textError);
          throw new Error('Server returned invalid response format');
        }
      }

      // Generate multiple variations
      const variations = [];
      for (let i = 0; i < 3; i++) {
        variations.push({
          id: i,
          title: data.title + (i > 0 ? ` (Variation ${i + 1})` : ""),
          description: data.description,
          tags: data.tags,
          timestamp: Date.now() + i * 1000 // Slight offset for uniqueness
        });
      }

      setGeneratedVariations(variations);
      setCurrentVariation(0);
      setTitle(variations[0].title);
      setDesc(variations[0].description);
      setTags(variations[0].tags.join(", "));

      // For free tier, trigger canvas update to show branded preview
      if (!isPro) {
        // The canvas will automatically update due to state changes above
        setTimeout(() => {
          setDownloadUrl(cvsRef.current?.toDataURL("image/png") || "");
        }, 100);
      }
    }catch(e:any){
      setAiError(e?.message || "Could not generate pin. Try again later.");
    }finally{ setAiLoading(false); }
  };

  const proBadge = isPro ? "Pro" : "Free tier";

  return (
    <div className="pp-wrap">
      {/* HEADER: logo left, aqua tagline right; title is gone */}
      <header className="pp-header">
        <div className="pp-brand">
          <img src="/logo.png" alt="Pin Pilot"/>
        </div>
        <div className="pp-tagline">Create better. Post everywhere.</div>
      </header>

      {/* optional API banner */}
      {apiBanner && <div className={`pp-banner ${apiBanner.kind}`}>{apiBanner.text}</div>}

      <div className="pp-grid">
        {/* LEFT CARD */}
        <section className="pp-card" style={{marginBottom: '24px'}}>
          <h3>Upload & Brand</h3>
          <div className="pp-sub">Auto-resizes to 1000×1500 (2:3). {proBadge}</div>

          <div className="pp-row">
            <label>Your Business Niche</label>
            <input
              type="text"
              value={businessNiche}
              onChange={e=>setBusinessNiche(e.target.value)}
              placeholder="e.g., digital stickers, Halloween decor, graphic design"
            />
            <div className="pp-sub">Helps AI generate content specific to your business</div>
          </div>

          <div className="pp-row">
            <label>Upload Images/Videos</label>
            <input type="file" accept="image/*,video/*" multiple onChange={e=>onFiles(e.target.files)} />
            <div className="pp-sub">Upload up to 3 images or 1 video (max 10MB each)</div>
          </div>

          {!isPro && (
            <div className="pp-check" style={{marginTop: '8px'}}>
              <input
                type="checkbox"
                checked={overlayOn}
                onChange={e=>setOverlayOn(e.target.checked)}
                id="overlay-toggle"
              />
              <label htmlFor="overlay-toggle" style={{cursor: 'pointer', marginLeft: '8px'}}>
                Include overlay text on generated pins
              </label>
            </div>
          )}


          {uploadedFiles.length > 0 && (
            <div className="pp-row">
              <label>Uploaded Files ({uploadedFiles.length}):</label>
              <div className="uploaded-files">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="file-item" style={{
                    fontWeight: idx === 0 ? 'bold' : 'normal',
                    backgroundColor: idx === 0 ? 'var(--accent-light)' : 'transparent'
                  }}>
                    {file.type.startsWith('video/') ? '🎥' : '🖼️'} {file.name}
                    {idx === 0 && <span style={{color: 'var(--accent)', marginLeft: '8px'}}>(Primary)</span>}
                  </div>
                ))}
              </div>
              {uploadedFiles.length > 1 && (
                <div className="pp-sub" style={{marginTop: '8px', fontSize: '13px'}}>
                  💡 Multiple images help AI understand your product better. The first image will be used for the pin design.
                </div>
              )}
            </div>
          )}

          {/* Template Controls - Available for both free and pro */}
          <div className="pp-row">
            <label>Template</label>
            <select value={template} onChange={e=>setTemplate(e.target.value as TemplateKind)}>
              <option value="off">Off</option>
              <option value="bottom">Bottom Bar</option>
              <option value="side">Side Tag</option>
              <option value="diagonal">Diagonal Ribbon</option>
            </select>
          </div>

          <div className="pp-check">
            <input type="checkbox" checked={overlayOn} onChange={e=>setOverlayOn(e.target.checked)} />
            <span>Enable overlay text</span>
          </div>
          {overlayOn && (
            <div className="pp-row">
              <label>Overlay Text</label>
              <input value={overlayText} onChange={e=>setOverlayText(e.target.value)} />
            </div>
          )}

          {/* Logo Upload - Available for both free and pro */}
          <h3 style={{marginTop:18, marginBottom: 12, color: 'var(--text)'}}>Logo</h3>
          <div className="pp-row">
            <label>Upload Logo</label>
            <input type="file" accept="image/*" onChange={e=>onLogo(e.target.files?.[0]||null)}/>
          </div>
          <div className="pp-check">
            <input type="checkbox" checked={includeLogo} onChange={e=>setIncludeLogo(e.target.checked)} />
            <span>Include logo on the image</span>
          </div>
          <div className="pp-row">
            <label>Position</label>
            <select value={logoAnchor} onChange={e=>setLogoAnchor(e.target.value as LogoAnchor)}>
              <option value="top-left">Top Left</option><option value="top-center">Top Center</option><option value="top-right">Top Right</option>
              <option value="middle-left">Middle Left</option><option value="center">Center</option><option value="middle-right">Middle Right</option>
              <option value="bottom-left">Bottom Left</option><option value="bottom-center">Bottom Center</option><option value="bottom-right">Bottom Right</option>
            </select>
          </div>
          <div className="pp-row">
            <label>Logo Size</label>
            <input type="range" min="0.08" max="0.40" step="0.01" value={logoScale} onChange={e=>setLogoScale(parseFloat(e.target.value))}/>
          </div>
          <div className="pp-row">
            <label>Offset X / Y</label>
            <input type="range" min="-150" max="150" value={logoOffset.x} onChange={e=>setLogoOffset(o=>({...o, x:parseInt(e.target.value)}))}/>
            <input type="range" min="-150" max="150" value={logoOffset.y} onChange={e=>setLogoOffset(o=>({...o, y:parseInt(e.target.value)}))}/>
          </div>

          <div className="pp-row">
            <label>Fit Mode</label>
            <select value={fit} onChange={e=>setFit(e.target.value as FitMode)}>
              <option value="contain">Contain (no crop)</option>
              <option value="cover">Cover (smart crop)</option>
            </select>
          </div>

          {/* Platform Selection */}
          <h3 style={{marginTop:18, marginBottom: 12, color: 'var(--text)'}}>📱 Target Platform</h3>
          <div className="pp-row">
            <label>Platform</label>
            <select value={selectedPlatform} onChange={e=>{setSelectedPlatform(e.target.value as Platform); updateExportFormats(e.target.value as Platform);}}>
              <option value="pinterest">📌 Pinterest</option>
              <option value="instagram">📸 Instagram</option>
              <option value="tiktok">🎵 TikTok</option>
              <option value="twitter">🐦 Twitter/X</option>
              <option value="facebook">👥 Facebook</option>
            </select>
            <div className="pp-sub">Choose your primary social platform for optimized content</div>
          </div>

          {/* Export Format Selection */}
          <div className="pp-row">
            <label>Export Format</label>
            <select value={exportFormats.length > 0 ? exportFormats[0].name : ""}>
              {exportFormats.map((format, idx) => (
                <option key={idx} value={format.name}>
                  {format.name} ({format.width}×{format.height})
                </option>
              ))}
            </select>
            <div className="pp-sub">
              {exportFormats.length > 0 ? exportFormats[0].description : "Select a platform first"}
            </div>
          </div>

          <div className="pp-row">
            <label>Brand Color</label>
            <input value={brand.primary} onChange={e=>setBrand(b=>({...b, primary:hex(e.target.value,b.primary)}))}/>
            <input type="color" value={brand.primary} onChange={e=>setBrand(b=>({...b,primary:e.target.value}))}/>
          </div>
          <div className="pp-row">
            <label>Accent Color</label>
            <input value={brand.accent} onChange={e=>setBrand(b=>({...b, accent:hex(e.target.value,b.accent)}))}/>
            <input type="color" value={brand.accent} onChange={e=>setBrand(b=>({...b,accent:e.target.value}))}/>
          </div>
          <div className="pp-row">
            <label>Text Color</label>
            <input value={brand.text} onChange={e=>setBrand(b=>({...b, text:hex(e.target.value,b.text)}))}/>
            <input type="color" value={brand.text} onChange={e=>setBrand(b=>({...b,text:e.target.value}))}/>
          </div>
          <div className="pp-row">
            <label>Font</label>
            <select value={font} onChange={e=>setFont(e.target.value)}>
              <option>Poppins</option><option>Inter</option><option>Montserrat</option><option>Nunito</option>
            </select>
          </div>



          <div className="pp-actions">
            <button className="pp-btn" onClick={doGenerate} disabled={aiLoading}>
              {aiLoading? "Generating…" : `Generate ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Content`}
            </button>
            {downloadUrl && (
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                <a className="pp-btn ghost" href={downloadUrl} download={`pinpilot-${selectedPlatform}.png`}>
                  Download PNG
                </a>
                <button
                  className="pp-btn ghost"
                  onClick={() => {
                    // Create JPEG version
                    const canvas = cvsRef.current;
                    if (canvas) {
                      const jpegUrl = canvas.toDataURL('image/jpeg', 0.9);
                      const link = document.createElement('a');
                      link.href = jpegUrl;
                      link.download = `pinpilot-${selectedPlatform}.jpg`;
                      link.click();
                    }
                  }}
                >
                  Download JPEG
                </button>
                {generatedVariations.length > 1 && (
                  <button
                    className="pp-btn ghost"
                    onClick={async () => {
                      try {
                        const zip = new JSZip();
                        const canvas = cvsRef.current;

                        if (!canvas) {
                          alert('Canvas not available for download');
                          return;
                        }

                        // Create a folder for the content
                        const folderName = `pinpilot-${selectedPlatform}-content`;
                        const contentFolder = zip.folder(folderName);

                        // Add images for each variation
                        for (let i = 0; i < generatedVariations.length; i++) {
                          const variation = generatedVariations[i];

                          // Temporarily update canvas with this variation
                          const originalTitle = title;
                          const originalDesc = desc;
                          const originalTags = tags;

                          setTitle(variation.title);
                          setDesc(variation.description);
                          setTags(variation.tags.join(", "));

                          // Wait for canvas to update
                          await new Promise(resolve => setTimeout(resolve, 100));

                          // Generate PNG
                          const pngDataUrl = canvas.toDataURL('image/png');
                          const pngBlob = await fetch(pngDataUrl).then(r => r.blob());
                          contentFolder.file(`variation-${i + 1}.png`, pngBlob);

                          // Generate JPEG
                          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
                          const jpegBlob = await fetch(jpegDataUrl).then(r => r.blob());
                          contentFolder.file(`variation-${i + 1}.jpg`, jpegBlob);
                        }

                        // Add content text file
                        let contentText = `# Pin Pilot Content Package\n\n`;
                        contentText += `Platform: ${selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}\n`;
                        contentText += `Generated: ${new Date().toLocaleString()}\n\n`;

                        generatedVariations.forEach((variation, idx) => {
                          contentText += `## Variation ${idx + 1}\n`;
                          contentText += `Title: ${variation.title}\n`;
                          contentText += `Description: ${variation.description}\n`;
                          contentText += `Tags: ${variation.tags.join(", ")}\n\n`;
                        });

                        contentFolder.file('content.txt', contentText);

                        // Generate and download ZIP
                        const zipBlob = await zip.generateAsync({ type: 'blob' });
                        const zipUrl = URL.createObjectURL(zipBlob);
                        const link = document.createElement('a');
                        link.href = zipUrl;
                        link.download = `${folderName}.zip`;
                        link.click();

                        // Clean up
                        URL.revokeObjectURL(zipUrl);

                        // Restore original variation
                        const currentVar = generatedVariations[currentVariation];
                        setTitle(currentVar.title);
                        setDesc(currentVar.description);
                        setTags(currentVar.tags.join(", "));

                      } catch (error) {
                        console.error('Error creating ZIP file:', error);
                        alert('Failed to create ZIP file. Please try downloading variations individually.');
                      }
                    }}
                  >
                    Download All ({generatedVariations.length})
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pp-footer-actions">
            <span>Need help? support@pinpilotapp.com</span>
          </div>
        </section>

        {/* RIGHT CARD */}
        <section className="pp-card preview-wrap" style={{marginBottom: '24px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px'}}>
            <h3>Preview & Content</h3>
            {generatedVariations.length > 1 && (
              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                <span style={{fontSize: '14px', color: 'var(--muted)'}}>Variation:</span>
                <select
                  value={currentVariation}
                  onChange={e => {
                    const variationIndex = parseInt(e.target.value);
                    setCurrentVariation(variationIndex);
                    const variation = generatedVariations[variationIndex];
                    setTitle(variation.title);
                    setDesc(variation.description);
                    setTags(variation.tags.join(", "));
                  }}
                  style={{fontSize: '14px', padding: '4px 8px'}}
                >
                  {generatedVariations.map((variation, idx) => (
                    <option key={variation.id} value={idx}>
                      {idx + 1}
                    </option>
                  ))}
                </select>
                <span style={{fontSize: '12px', color: 'var(--muted)'}}>
                  of {generatedVariations.length}
                </span>
              </div>
            )}
          </div>
          <div className="pp-sub">What you see is what you export.</div>

          <div className="canvas-frame">
            <canvas ref={cvsRef} width={PIN.w} height={PIN.h}/>
          </div>

          <div className="ai-fields">
            {aiError && <div className="pp-banner error">{aiError}</div>}

            <div className="pp-row">
              <label>Title</label>
              <textarea value={title} onChange={e=>setTitle(e.target.value)} placeholder="Eye-catching Pinterest Pin Title"/>
            </div>
            <div className="pp-row">
              <label>Description</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Keyword-rich description tailored for search & saves."/>
            </div>
            <div className="pp-row">
              <label>Keywords / Tags</label>
              <textarea value={tags} onChange={e=>setTags(e.target.value)} placeholder="comma, separated, keywords"/>
            </div>

            {!isPro && (
              <div className="pp-sub">
                <strong>Pro Features:</strong> Manual branding controls, multi-platform export, and advanced templates.
                Add <code>?pro=1</code> to your URL to preview all features.
              </div>
            )}
            <div className="pp-sub">Powered by Google Gemini & social media best-practices.</div>
          </div>
        </section>
      </div>

      {/* HORIZONTAL PRICING SECTION */}
      {!isPro && (
        <div className="pp-pricing-section">
          <div className="pp-pricing-container">
            <div className="pp-pricing-header">
              <h3 style={{margin: '0 0 8px', color: 'var(--text)', fontSize: '24px', fontWeight: '600'}}>
                🚀 Upgrade to Pin Pilot Pro
              </h3>
              <p style={{margin: 0, color: 'var(--muted)', fontSize: '16px'}}>
                Unlock advanced features and supercharge your social media marketing
              </p>
            </div>

            <div className="pp-pricing-grid">
              <div className="pp-pricing-card pp-pricing-founder">
                <div className="pp-pricing-badge">Most Popular</div>
                <h4>Founder's Plan</h4>
                <div className="pp-pricing-price">
                  <span className="pp-price-amount">$5</span>
                  <span className="pp-price-period">/month</span>
                </div>
                <p className="pp-pricing-description">Limited time offer for the first 20 subscribers</p>
                <ul className="pp-pricing-features">
                  <li>✅ AI-powered content creation for all platforms</li>
                  <li>✅ Multi-format export (Instagram, TikTok, Twitter, etc.)</li>
                  <li>✅ Multiple content variations per generation</li>
                  <li>✅ Advanced branding and template controls</li>
                  <li>✅ Batch download and export options</li>
                  <li>✅ Priority support</li>
                </ul>
                <a href="/api/stripe/checkout" className="pp-btn pp-pricing-btn">
                  Claim Founder's Price - $5/month
                </a>
              </div>

              <div className="pp-pricing-card pp-pricing-regular">
                <h4>Regular Plan</h4>
                <div className="pp-pricing-price">
                  <span className="pp-price-amount">$10</span>
                  <span className="pp-price-period">/month</span>
                </div>
                <p className="pp-pricing-description">Full access to all Pro features</p>
                <ul className="pp-pricing-features">
                  <li>✅ Everything in Founder's Plan</li>
                  <li>✅ Advanced analytics & insights</li>
                  <li>✅ Bulk content creation & management</li>
                  <li>✅ Custom branding templates</li>
                  <li>✅ API access for integrations</li>
                  <li>✅ White-label options</li>
                </ul>
                <button className="pp-btn pp-pricing-btn pp-btn-secondary" disabled>
                  Available After Founders
                </button>
              </div>
            </div>

            <div className="pp-pricing-footer">
              <p style={{textAlign: 'center', color: 'var(--muted)', fontSize: '14px', margin: '16px 0'}}>
                🔒 Secure payment powered by Stripe • 30-day money-back guarantee • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
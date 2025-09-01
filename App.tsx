// App.tsx — Pin Pilot UI (brand tuned), larger header logo, no title text,
// bigger default canvas logo, clear API status banner.

import React, { useEffect, useRef, useState } from "react";
import { generatePinCopy } from "./services/geminiService";
import "./index.css";

type TemplateKind = "off" | "bottom" | "side" | "diagonal";
type FitMode = "contain" | "cover";
type LogoAnchor =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

const PIN = { w: 1000, h: 1500 }; // 2:3 standard

const clamp = (n:number, min:number, max:number)=>Math.max(min, Math.min(max, n));
const hex = (v:string, fb:string)=> {
  if (!v) return fb; const s=v.trim().replace(/[^#a-fA-F0-9]/g,"");
  return s.startsWith("#")?s:"#"+s;
};

export default function App(){
  const isPro = new URLSearchParams(window.location.search).get("pro")==="1";

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
  const [pinterestBoards, setPinterestBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState("");
  const [isDemoConnected, setIsDemoConnected] = useState(false);

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
        if (settings.selectedBoard) setSelectedBoard(settings.selectedBoard);
        // Note: Image data is no longer persisted to prevent localStorage quota issues
        // Images will need to be re-uploaded after page refresh
      } catch (e) {
        console.error('Error loading saved settings:', e);
        // If there's an error (likely due to large image data), clear localStorage
        localStorage.removeItem('pinPilot_settings');
      }
    }

    // Check for demo mode
    const isDemo = window.location.search.includes('demo=1');
    if (isDemo) {
      console.log('Demo mode detected - setting up demo connection');
      setIsDemoConnected(true);
      // Fetch demo boards
      fetchPinterestBoards();
    }

    // Check for saved Pinterest tokens or direct access token
    const savedTokens = localStorage.getItem('pinterest_tokens');
    if (savedTokens) {
      try {
        const tokens = JSON.parse(savedTokens);
        if (tokens.access_token) {
          // Set cookie for API access
          document.cookie = `pp_at=${tokens.access_token}; Path=/; Max-Age=86400; SameSite=Lax`;
          setApiBanner({kind: "info", text: "Pinterest account connected! Enhanced optimization active."});
          // Fetch boards if we have tokens
          fetchPinterestBoards();
        }
      } catch (e) {
        console.error('Error loading Pinterest tokens:', e);
      }
    }
  }, []);

  // Handle Pinterest OAuth callback (with delay to avoid interfering with settings loading)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#pinterest_oauth=')) {
      console.log('Pinterest OAuth callback detected, hash:', hash);

      // Small delay to ensure settings are loaded first
      setTimeout(() => {
        try {
          const encoded = hash.replace('#pinterest_oauth=', '');
          const decodedUri = decodeURIComponent(encoded);
          const decoded = atob(decodedUri);
          const tokens = JSON.parse(decoded);
          console.log('Pinterest OAuth tokens received successfully');

          // Store tokens
          localStorage.setItem('pinterest_tokens', JSON.stringify(tokens));

          // Also set cookie for API access
          if (tokens.access_token) {
            document.cookie = `pp_at=${tokens.access_token}; Path=/; Max-Age=86400; SameSite=Lax`;
          }

          setApiBanner({kind: "info", text: "Pinterest account connected successfully! Enhanced optimization is now active."});

          // Fetch boards
          fetchPinterestBoards();

          // Clear hash after a brief delay to show success message
          setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 3000);

        } catch (e) {
          console.error('Error parsing Pinterest OAuth tokens:', e);
          console.error('Error details:', e.message);
          setApiBanner({kind: "error", text: `Error connecting Pinterest account: ${e.message}. Please try again.`});

          // Clear hash even on error
          setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 5000);
        }
      }, 100);
    }
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
      selectedBoard
      // Note: uploadedImageData and uploadedLogoData are not saved to prevent localStorage quota issues
    };
    localStorage.setItem('pinPilot_settings', JSON.stringify(settings));
  }, [brand, font, template, overlayOn, overlayText, businessNiche, fit, includeLogo, logoAnchor, logoScale, logoOffset, selectedBoard]);

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

  // Fetch Pinterest boards
  const fetchPinterestBoards = async () => {
    try {
      const isDemo = window.location.search.includes('demo=1');
      const response = await fetch(`/api/pinterest/boards${isDemo ? '?demo=1' : ''}`);
      const data = await response.json();
      if (data.ok && data.boards) {
        setPinterestBoards(data.boards);
      }
    } catch (e) {
      console.error('Error fetching Pinterest boards:', e);
    }
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

      // Convert files to base64
      const filePromises = uploadedFiles.map(file => {
        return new Promise<string>((resolve) => {
          const fr = new FileReader();
          fr.onload = () => resolve(fr.result as string);
          fr.readAsDataURL(file);
        });
      });
      const base64Files = await Promise.all(filePromises);

      console.log('Calling Gemini API directly with:', {
        brandPrimary: brand.primary,
        brandAccent: brand.accent,
        overlayText
      });

      // Call secure backend API for AI generation
      console.log('Calling secure backend API for AI generation');
      const backendResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: base64Files,
          isVideo,
          brandPrimary: brand.primary,
          brandAccent: brand.accent,
          overlayText,
          businessNiche
        })
      });

      console.log('Backend response status:', backendResponse.status);
      if (!backendResponse.ok) {
        const errorData = await backendResponse.json();
        console.error('Backend API error:', errorData);
        throw new Error(`AI generation failed: ${errorData.message || backendResponse.status}`);
      }

      const data = await backendResponse.json();
      console.log('Backend response data:', data);
      setTitle(data.title);
      setDesc(data.description);
      setTags(data.tags.join(", "));

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
        <div className="pp-tagline">Pin better. Grow faster.</div>
      </header>

      {/* optional API banner */}
      {apiBanner && <div className={`pp-banner ${apiBanner.kind}`}>{apiBanner.text}</div>}

      <div className="pp-grid">
        {/* LEFT CARD */}
        <section className="pp-card">
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
              <label>Uploaded Files:</label>
              <div className="uploaded-files">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="file-item">
                    {file.type.startsWith('video/') ? '🎥' : '🖼️'} {file.name}
                  </div>
                ))}
              </div>
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

          {isPro && (
            <>
              <h3 style={{marginTop: 24, marginBottom: 16, color: 'var(--text)'}}>
                📌 Pinterest Publishing
              </h3>

              <div className="pp-row">
                <label>Pinterest Account</label>
                <button
                  className="pp-btn"
                  style={{background: '#E60023'}}
                  onClick={() => {
                    window.location.href = '/api/auth/start';
                  }}
                >
                  🔗 Connect Pinterest Account
                </button>
                <div className="pp-sub">Connect to post and schedule pins automatically (available after API upgrade)</div>
              </div>

              <div className="pp-row">
                <label>Pin Purpose/Niche</label>
                <select>
                  <option>Digital Products</option>
                  <option>Business/Branding</option>
                  <option>Educational Content</option>
                  <option>Promotional</option>
                  <option>Seasonal/Holiday</option>
                  <option>Lifestyle</option>
                  <option>DIY/Crafts</option>
                  <option>Custom</option>
                </select>
                <div className="pp-sub">Helps optimize content for specific Pinterest audience</div>
              </div>

              <div className="pp-row">
                <label>Select Board</label>
                <select value={selectedBoard} onChange={e=>setSelectedBoard(e.target.value)} disabled={pinterestBoards.length === 0 && !isDemoConnected}>
                  {pinterestBoards.length === 0 && !isDemoConnected ? (
                    <option>Connect Pinterest account first...</option>
                  ) : (
                    <>
                      <option value="">Choose a board...</option>
                      {pinterestBoards.map((board: any) => (
                        <option key={board.id} value={board.id}>
                          {board.name} {window.location.search.includes('demo=1') ? '(Demo)' : ''}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                <div className="pp-sub">
                  Choose which Pinterest board to publish to
                  {window.location.search.includes('demo=1') && (
                    <span style={{color: '#10b981', fontWeight: 'bold'}}> 🎬 Demo Mode Active</span>
                  )}
                </div>
              </div>

              <div className="pp-row">
                <label>Publishing Options</label>
                <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  <label style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px'}}>
                    <input type="radio" name="publish" defaultChecked />
                    Post Immediately
                  </label>
                  <label style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px'}}>
                    <input type="radio" name="publish" />
                    Schedule for Later
                  </label>
                </div>
              </div>

              <div className="pp-row">
                <label>Schedule Date/Time</label>
                <input type="datetime-local" disabled />
                <div className="pp-sub">Set when to publish this pin</div>
              </div>

              <div className="pp-row">
                <label>Link Destination</label>
                <input type="url" placeholder="https://your-shop.com/product" />
                <div className="pp-sub">Where Pinterest users should go when they click your pin</div>
              </div>
            </>
          )}

          {!isPro && (
            <div className="founder-pricing-notice">
              <div className="pp-sub" style={{marginTop: 12, marginBottom: 16}}>
                Free tier uses automated branding with default settings. Upgrade to Pro for manual customization.
              </div>

              <div className="pricing-card">
                <h4 style={{margin: '0 0 8px', color: 'var(--accent)', fontSize: '16px'}}>
                  🎉 Founder's Pricing Available!
                </h4>
                <div style={{fontSize: '14px', lineHeight: '1.5', marginBottom: '12px'}}>
                  <strong>$5/month for life</strong> for the first 20 subscribers<br/>
                  <span style={{color: 'var(--muted)'}}>Then $10/month for everyone else</span><br/>
                  <span style={{color: 'var(--accent)', fontSize: '13px'}}>⚡ Limited availability - claim your spot now!</span>
                </div>
                <div style={{fontSize: '13px', color: 'var(--muted)', marginBottom: '12px'}}>
                  ✅ Automated pin creation with AI branding<br/>
                  ✅ Optimized titles, descriptions & keywords<br/>
                  ✅ Download high-quality branded pins<br/>
                  🔄 Auto-posting & scheduling <em>(available after Pinterest API approval)</em>
                </div>
                <div style={{fontSize: '12px', color: 'var(--text)', background: 'var(--panel)', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)'}}>
                  <strong>Important:</strong> Auto-posting and scheduling features require Pinterest API upgrade approval.
                  You'll be notified when these features become available. Founder's pricing is guaranteed for life regardless of when API approval happens.
                </div>

                <a
                  href="/api/stripe/checkout"
                  className="pp-btn"
                  style={{display: 'inline-block', marginTop: '12px', textDecoration: 'none'}}
                >
                  🚀 Claim Founder's Pricing - $5/month
                </a>
              </div>

              <div className="pp-row" style={{marginTop: '20px'}}>
                <label>Connect Pinterest for Better Optimization</label>
                <button
                  className="pp-btn"
                  style={{background: '#E60023'}}
                  onClick={() => {
                    window.location.href = '/api/auth/start';
                  }}
                >
                  🔗 Connect Pinterest Account (Free)
                </button>
                <div className="pp-sub">
                  <strong>Benefits of connecting:</strong><br/>
                  ✅ AI analyzes your Pinterest trends for better content<br/>
                  ✅ Smarter keyword suggestions based on what performs<br/>
                  ✅ Personalized optimization for your audience<br/>
                  ✅ No cost to you - enhances free tier results!
                </div>
              </div>

              {(pinterestBoards.length > 0 || isDemoConnected) && (
                <div className="pp-row">
                  <label>Select Board for Optimization</label>
                  <select value={selectedBoard} onChange={e=>setSelectedBoard(e.target.value)} disabled={pinterestBoards.length === 0 && !isDemoConnected}>
                    {pinterestBoards.length === 0 && !isDemoConnected ? (
                      <option>Connect Pinterest account first...</option>
                    ) : (
                      <>
                        <option value="">Choose a board...</option>
                        {pinterestBoards.map((board: any) => (
                          <option key={board.id} value={board.id}>
                            {board.name} {window.location.search.includes('demo=1') ? '(Demo)' : ''}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <div className="pp-sub">
                    AI will optimize content based on this board's performance data
                    {window.location.search.includes('demo=1') && (
                      <span style={{color: '#10b981', fontWeight: 'bold'}}> 🎬 Demo Mode Active</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pp-actions">
            <button className="pp-btn" onClick={doGenerate} disabled={aiLoading}>
              {aiLoading? "Generating…" : "Generate Pin Content"}
            </button>
            <a className="pp-btn ghost" href={downloadUrl} download="pinpilot.png">Download Branded Image</a>
          </div>

          <div className="pp-footer-actions">
            <span>Need help? support@pinpilotapp.com</span>
          </div>
        </section>

        {/* RIGHT CARD */}
        <section className="pp-card preview-wrap">
          <h3>Preview & Content</h3>
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
                <strong>Pro Features:</strong> Manual branding controls, Pinterest account connection, and scheduling.
                Add <code>?pro=1</code> to your URL to preview all features.
              </div>
            )}
            <div className="pp-sub">Powered by Google Gemini & Pinterest best-practices.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
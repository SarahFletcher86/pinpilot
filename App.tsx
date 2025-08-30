// App.tsx — Pin Pilot UI (brand tuned), larger header logo, no title text,
// bigger default canvas logo, clear API status banner.

import React, { useEffect, useRef, useState } from "react";
import { generatePinCopy, geminiStatus } from "./services/geminiService";
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

  const cvsRef = useRef<HTMLCanvasElement|null>(null);

  // Init API status banner (missing/invalid key clarity)
  useEffect(()=>{
    const s = geminiStatus();
    if (!s.ok) setApiBanner({kind: s.kind, text: s.message});
  },[]);

  // file helpers
  const readImage = (file:File, cb:(img:HTMLImageElement)=>void)=>{
    const fr = new FileReader();
    fr.onload = ()=>{ const i=new Image(); i.onload=()=>cb(i); i.src = fr.result as string; };
    fr.readAsDataURL(file);
  };

  const extractVideoThumbnail = (file:File, cb:(img:HTMLImageElement)=>void)=>{
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = ()=>{
      video.currentTime = 1; // Seek to 1 second
    };
    video.onseeked = ()=>{
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if(ctx) {
        ctx.drawImage(video, 0, 0);
        const img = new Image();
        img.onload = ()=>cb(img);
        img.src = canvas.toDataURL('image/png');
      }
    };
    video.src = URL.createObjectURL(file);
  };

  // draw canvas
  useEffect(()=>{
    const c = cvsRef.current; if(!c) return;
    c.width = PIN.w; c.height = PIN.h;
    const ctx = c.getContext("2d"); if(!ctx) return;

    // bg
    ctx.fillStyle = "#0a0f1f";
    ctx.fillRect(0,0,PIN.w,PIN.h);

    // main image
    if (srcImg){
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
      extractVideoThumbnail(firstFile, setSrcImg);
    } else {
      readImage(firstFile, setSrcImg);
    }
  };

  const onMain = (f:File|null)=>{ if(!f) return; readImage(f, setSrcImg); };
  const onLogo = (f:File|null)=>{ if(!f) return; readImage(f, setLogoImg); };

  const doGenerate = async ()=>{
    if (uploadedFiles.length === 0){ setAiError("Upload files first."); return; }
    setAiError(null); setAiLoading(true);
    try{
      // For free tier, apply default branding automatically
      if (!isPro) {
        setTemplate("bottom");
        setOverlayOn(true);
        setOverlayText("Your catchy title here");
        setBrand({ primary: "#5459D4", accent: "#74D6D8", text: "#1C1E45" });
        setFont("Poppins");
        setIncludeLogo(true);
        setLogoAnchor("bottom-right");
        setLogoScale(0.22);
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

      // Call Gemini API directly from frontend
      const geminiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error('Gemini API key not configured. Please check your .env file.');
      }

      const prompt = `🎯 HIGH-CONVERSION DIGITAL PRODUCT CONTENT GENERATOR

BUSINESS: ${businessNiche}

📸 IMAGE ANALYSIS: Analyze this image and create conversion-optimized Pinterest content that will drive sales of digital downloads.

CRITICAL REQUIREMENTS:
✅ DIGITAL PRODUCTS FOCUS: Stickers, graphics, printables, digital files
✅ SEO OPTIMIZATION: Use high-search-volume Pinterest keywords
✅ CONVERSION-DRIVEN: Include strong CTAs and benefit-focused copy
✅ IMAGE-AWARE: Base content on what you actually see in the image
✅ SALES-ORIENTED: Highlight instant download, unlimited use, etc.

CONTENT SPECIFICATIONS:
🎯 TITLE (95 chars max): Include primary keyword + benefit + CTA
📝 DESCRIPTION (480 chars max): Problem-solution-benefit structure + SEO keywords
🏷️ TAGS (12 max): Mix trending + specific + long-tail keywords

HIGH-CONVERTING STRUCTURE:
1. HOOK: Attention-grabbing opening based on image
2. PROBLEM: Address pain point (need for digital decor/stickers)
3. SOLUTION: Your digital product as the answer
4. BENEFITS: Instant download, unlimited use, high quality
5. CTA: Clear call-to-action for purchase

Return ONLY valid JSON:
{
 "title": "SEO Title: Primary Keyword + Key Benefit + CTA",
 "description": "Hook + Problem + Solution + Benefits + Strong CTA + SEO Keywords",
 "tags": ["primary-keyword", "digital-downloads", "instant-access", "high-quality", "unlimited-use", "trending-keyword", "specific-to-image", "conversion-focused"]
}

🎨 BRANDING: Primary=${brand.primary}, Accent=${brand.accent}, Overlay="${overlayText}"`;

      // Prepare the request with image data for Gemini Vision
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: base64Files[0].includes('data:image/png') ? 'image/png' :
                          base64Files[0].includes('data:image/jpeg') ? 'image/jpeg' :
                          base64Files[0].includes('data:image/jpg') ? 'image/jpeg' : 'image/png',
                data: base64Files[0].split(',')[1] // Remove data URL prefix
              }
            }
          ]
        }],
        generationConfig: { temperature: 0.7 },
        safetySettings: []
      };

      console.log('Sending request with image to Gemini Vision API');
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('Gemini response status:', geminiResponse.status);
      if (!geminiResponse.ok) {
        const errorData = await geminiResponse.json();
        console.error('Gemini API error:', errorData);
        throw new Error(`Gemini API error: ${geminiResponse.status}`);
      }

      const geminiData = await geminiResponse.json();
      console.log('Gemini response data:', geminiData);

      const text = geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ||
                  geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const parsedData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      const tags = Array.isArray(parsedData.tags) ? parsedData.tags :
                  String(parsedData.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean);

      const data = {
        title: String(parsedData.title || "Eye-catching Pinterest Pin Title").slice(0, 95),
        description: String(parsedData.description || "A concise, keyword-rich description tailored for Pinterest search and saves.").slice(0, 480),
        tags: tags.slice(0, 12),
        imageBase64: base64Files[0] // Return the first image
      };

      console.log('Processed data:', data);
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

          {isPro && (
            <>
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
            </>
          )}

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
                  onClick={() => alert('Pinterest integration will be available once API posting/scheduling is approved. For now, focus on content optimization!')}
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
                <select disabled>
                  <option>Connect Pinterest account first...</option>
                </select>
                <div className="pp-sub">Choose which Pinterest board to publish to</div>
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
                  onClick={() => alert('Free users can connect Pinterest for enhanced content optimization! This helps generate even better titles, descriptions, and tags tailored to Pinterest trends. No auto-posting or scheduling - that\'s Pro only.')}
                >
                  🔗 Connect Pinterest Account (Free)
                </button>
                <div className="pp-sub">Connect your Pinterest account to get AI-optimized content based on current trends and your account data. No cost to you - helps improve free tier results!</div>
              </div>
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
// App.tsx — Pin Pilot Free tier polished UI + image renderer + Gemini copy
import React, { useEffect, useMemo, useRef, useState } from "react";
import { generatePinCopy } from "./services/geminiService";
import "./index.css";

type TemplateKind = "off" | "bottom" | "side" | "diagonal";
type FitMode = "contain" | "cover";
type LogoAnchor =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

const A4 = { w: 1000, h: 1500 }; // Pinterest recommended size

function sanitizeHex(v: string, fallback: string) {
  if (!v) return fallback;
  const s = v.trim().replace(/[^#a-fA-F0-9]/g, "");
  return s.startsWith("#") ? s : `#${s}`;
}

export default function App() {
  const isPro = new URLSearchParams(window.location.search).get("pro") === "1";

  // BRAND / CONTROLS
  const [fit, setFit] = useState<FitMode>("contain");
  const [template, setTemplate] = useState<TemplateKind>("bottom");
  const [overlayOn, setOverlayOn] = useState(false);
  const [overlayText, setOverlayText] = useState("Your catchy title here");

  const [brand, setBrand] = useState({
    primary: "#7c3aed", // button/trim
    accent: "#10b981",  // aqua
    text: "#ffffff",
  });

  const [font, setFont] = useState("Poppins");

  // IMAGES
  const [srcImage, setSrcImage] = useState<HTMLImageElement | null>(null);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoAnchor, setLogoAnchor] = useState<LogoAnchor>("bottom-right");
  const [logoScale, setLogoScale] = useState(0.18); // ~18% of canvas width
  const [logoOffset, setLogoOffset] = useState({ x: 0, y: 0 });

  // AI COPY
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tags, setTags] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // CANVAS
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>("");

  // LOAD IMAGE HELPERS
  const loadImageFile = (file: File, cb: (img: HTMLImageElement) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const i = new Image();
      i.onload = () => cb(i);
      i.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // DRAW
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    cvs.width = A4.w; cvs.height = A4.h;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, A4.w, A4.h);

    // Background fill (brand subtle)
    ctx.fillStyle = "#0a0f1f";
    ctx.fillRect(0, 0, A4.w, A4.h);

    // Draw source image
    if (srcImage) {
      const sw = srcImage.width, sh = srcImage.height;
      const cr = A4.w / A4.h;
      const ir = sw / sh;

      if (fit === "contain") {
        // scale to fit entirely (no cropping)
        const scale = Math.min(A4.w / sw, A4.h / sh);
        const dw = sw * scale, dh = sh * scale;
        const dx = (A4.w - dw) / 2, dy = (A4.h - dh) / 2;

        // optional soft background behind (blurred fill)
        // draw blurred boxes
        ctx.fillStyle = "#0b1222";
        ctx.fillRect(0, 0, A4.w, A4.h);
        ctx.drawImage(srcImage, dx, dy, dw, dh);
      } else {
        // cover (allow safe crop)
        let dw = A4.w, dh = A4.h, sx = 0, sy = 0, sw2 = sw, sh2 = sh;
        if (ir > cr) {
          // image too wide – crop width
          const newW = sh * cr;
          sx = (sw - newW) / 2; sw2 = newW;
        } else {
          // image too tall – crop height
          const newH = sw / cr;
          sy = (sh - newH) / 2; sh2 = newH;
        }
        ctx.drawImage(srcImage, sx, sy, sw2, sh2, 0, 0, A4.w, A4.h);
      }
    }

    // Templates
    ctx.save();
    if (template !== "off") {
      ctx.font = `bold 54px ${font}, system-ui, sans-serif`;
      ctx.textBaseline = "middle";

      if (template === "bottom") {
        const h = 190;
        ctx.fillStyle = "#00000090";
        ctx.fillRect(0, A4.h - h, A4.w, h);
        if (overlayOn) {
          ctx.fillStyle = brand.accent;
          ctx.fillRect(0, A4.h - h, 14, h);
          ctx.fillStyle = brand.text;
          ctx.fillText(overlayText, 40, A4.h - h/2);
        }
      }

      if (template === "side") {
        const w = 210;
        ctx.fillStyle = "#00000080";
        ctx.fillRect(A4.w - w, 0, w, A4.h);
        if (overlayOn) {
          ctx.save();
          ctx.translate(A4.w - w/2, A4.h/2);
          ctx.rotate(-Math.PI/2);
          ctx.fillStyle = brand.text;
          ctx.fillText(overlayText, -A4.h/2 + 20, 0);
          ctx.restore();
        }
      }

      if (template === "diagonal") {
        ctx.fillStyle = "#00000070";
        ctx.beginPath();
        ctx.moveTo(0, A4.h * 0.72);
        ctx.lineTo(A4.w, A4.h * 0.52);
        ctx.lineTo(A4.w, A4.h);
        ctx.lineTo(0, A4.h);
        ctx.closePath();
        ctx.fill();
        if (overlayOn) {
          ctx.fillStyle = brand.text;
          ctx.fillText(overlayText, 28, A4.h - 100);
        }
      }
    }
    ctx.restore();

    // Logo (optional)
    if (includeLogo && logoImage) {
      const lw = A4.w * logoScale;
      const ratio = logoImage.width / logoImage.height || 1;
      const lh = lw / ratio;

      const anchorPos = (anc: LogoAnchor) => {
        const pad = 24;
        const centers = {
          "top-left":      { x: pad,           y: pad },
          "top-center":    { x: A4.w/2,        y: pad },
          "top-right":     { x: A4.w - pad,    y: pad },
          "middle-left":   { x: pad,           y: A4.h/2 },
          "center":        { x: A4.w/2,        y: A4.h/2 },
          "middle-right":  { x: A4.w - pad,    y: A4.h/2 },
          "bottom-left":   { x: pad,           y: A4.h - pad },
          "bottom-center": { x: A4.w/2,        y: A4.h - pad },
          "bottom-right":  { x: A4.w - pad,    y: A4.h - pad },
        } as const;

        let { x, y } = centers[anc];
        // convert to top-left based on anchor
        if (anc.endsWith("center")) x -= lw/2;
        if (anc.includes("right"))  x -= lw;
        if (anc.startsWith("middle")) y -= lh/2;
        if (anc.startsWith("bottom")) y -= lh;
        return { x, y };
      };

      const p = anchorPos(logoAnchor);
      const dx = p.x + logoOffset.x, dy = p.y + logoOffset.y;

      // subtle pad background for contrast if image is busy
      ctx.save();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(logoImage, dx, dy, lw, lh);
      ctx.restore();
    }

    // persist data URL
    const url = cvs.toDataURL("image/png");
    setDownloadUrl(url);
  }, [srcImage, logoImage, includeLogo, logoAnchor, logoScale, logoOffset, template, overlayOn, overlayText, brand, font, fit]);

  const onUploadMain = (f: File | null) => {
    if (!f) return;
    loadImageFile(f, setSrcImage);
  };
  const onUploadLogo = (f: File | null) => {
    if (!f) return;
    loadImageFile(f, setLogoImage);
  };

  const doGenerate = async () => {
    if (!srcImage) {
      setAiError("Upload an image first.");
      return;
    }
    setAiError(null);
    setAiLoading(true);
    try {
      const res = await generatePinCopy({
        brandPrimary: brand.primary,
        brandAccent: brand.accent,
        overlayText,
      });
      setTitle(res.title);
      setDesc(res.description);
      setTags(res.tags.join(", "));
    } catch (e:any) {
      setAiError(e?.message || "Could not generate copy (Gemini). Try again later.");
    } finally {
      setAiLoading(false);
    }
  };

  const proBadge = isPro ? "Pro" : "Free tier";

  return (
    <div className="pp-wrap">
      {/* HEADER */}
      <header className="pp-header">
        <div className="pp-brand">
          <img src="/logo.png" alt="Pin Pilot" />
          <div className="pp-title">Pin Pilot</div>
        </div>
        <div className="pp-tagline">Pin better. Grow faster.</div>
      </header>

      {/* GRID */}
      <div className="pp-grid">
        {/* LEFT: controls */}
        <section className="pp-card">
          <h3>Upload & Brand</h3>
          <div className="pp-sub">Auto-resizes to 1000×1500 (2:3). {proBadge}</div>

          <div className="pp-row">
            <label>Pin Image</label>
            <input
              type="file" accept="image/*"
              onChange={e => onUploadMain(e.target.files?.[0] || null)}
            />
          </div>

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

          <div className="pp-row">
            <label>Fit Mode</label>
            <select value={fit} onChange={e=>setFit(e.target.value as FitMode)}>
              <option value="contain">Contain (no crop)</option>
              <option value="cover">Cover (smart crop)</option>
            </select>
          </div>

          <div className="pp-row">
            <label>Brand Color (hex)</label>
            <input
              type="text"
              value={brand.primary}
              onChange={e=>setBrand(b=>({...b, primary: sanitizeHex(e.target.value, b.primary)}))}
            />
            <input type="color" value={brand.primary}
                   onChange={e=>setBrand(b=>({...b, primary:e.target.value}))}/>
          </div>

          <div className="pp-row">
            <label>Accent Color (hex)</label>
            <input
              type="text"
              value={brand.accent}
              onChange={e=>setBrand(b=>({...b, accent: sanitizeHex(e.target.value, b.accent)}))}
            />
            <input type="color" value={brand.accent}
                   onChange={e=>setBrand(b=>({...b, accent:e.target.value}))}/>
          </div>

          <div className="pp-row">
            <label>Text Color</label>
            <input
              type="text"
              value={brand.text}
              onChange={e=>setBrand(b=>({...b, text: sanitizeHex(e.target.value, b.text)}))}
            />
            <input type="color" value={brand.text}
                   onChange={e=>setBrand(b=>({...b, text:e.target.value}))}/>
          </div>

          <div className="pp-row">
            <label>Font</label>
            <select value={font} onChange={e=>setFont(e.target.value)}>
              <option>Poppins</option>
              <option>Inter</option>
              <option>Montserrat</option>
              <option>Nunito</option>
            </select>
          </div>

          <h3 style={{marginTop:18}}>Logo</h3>
          <div className="pp-row">
            <label>Upload Logo</label>
            <input type="file" accept="image/*" onChange={e=>onUploadLogo(e.target.files?.[0]||null)}/>
          </div>
          <div className="pp-check">
            <input type="checkbox" checked={includeLogo} onChange={e=>setIncludeLogo(e.target.checked)} />
            <span>Include logo on the image</span>
          </div>

          <div className="pp-row">
            <label>Position</label>
            <select value={logoAnchor} onChange={e=>setLogoAnchor(e.target.value as LogoAnchor)}>
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
              <option value="top-right">Top Right</option>
              <option value="middle-left">Middle Left</option>
              <option value="center">Center</option>
              <option value="middle-right">Middle Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-center">Bottom Center</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </div>

          <div className="pp-row">
            <label>Logo Size</label>
            <input type="range" min="0.08" max="0.35" step="0.01"
                   value={logoScale} onChange={e=>setLogoScale(parseFloat(e.target.value))}/>
          </div>

          <div className="pp-row">
            <label>Offset X / Y</label>
            <input type="range" min="-120" max="120" value={logoOffset.x}
                   onChange={e=>setLogoOffset(o=>({...o, x: parseInt(e.target.value)}))}/>
            <input type="range" min="-120" max="120" value={logoOffset.y}
                   onChange={e=>setLogoOffset(o=>({...o, y: parseInt(e.target.value)}))}/>
          </div>

          <div className="pp-actions">
            <button className="pp-btn" onClick={doGenerate} disabled={aiLoading}>
              {aiLoading ? "Generating…" : "Generate Pin Content"}
            </button>
            <a className="pp-btn ghost" href={downloadUrl} download="pinpilot.png">Download Branded Image</a>
          </div>

          <div className="pp-footer-actions">
            <span>Need help? Email support@pinpilotapp.com</span>
          </div>
        </section>

        {/* RIGHT: preview & AI copy */}
        <section className="pp-card preview-wrap">
          <h3>Preview & Content</h3>
          <div className="pp-sub">Everything you’ll export appears exactly here.</div>

          <div className="canvas-frame">
            <canvas ref={canvasRef} width={A4.w} height={A4.h} />
          </div>

          <div className="ai-fields">
            {aiError && <div style={{color:"#fca5a5", marginBottom:8}}>{aiError}</div>}

            <div className="pp-row">
              <label>Title</label>
              <textarea value={title} onChange={e=>setTitle(e.target.value)} placeholder="Eye-catching Pinterest pin title" />
            </div>
            <div className="pp-row">
              <label>Description</label>
              <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Keyword-rich description tailored for search & saves." />
            </div>
            <div className="pp-row">
              <label>Keywords / Tags</label>
              <textarea value={tags} onChange={e=>setTags(e.target.value)} placeholder="comma, separated, keywords" />
            </div>

            {!isPro && (
              <div className="pp-sub">
                Pinterest connect & scheduling are Pro features. Add <code>?pro=1</code> to preview, or subscribe in the web app.
              </div>
            )}
            <div className="pp-sub">Powered by Google Gemini & Pinterest best-practices.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
// App.tsx – Pin Pilot (no Tailwind, polished two-card layout)
// Drop-in overwrite. Works with Vite, your existing services, and no Tailwind.

// If your paths are different, adjust the import below:
import { generatePinContent } from './services/geminiService'

// ---------- Types ----------
type GenResult = {
  title: string
  description: string
  keywords: string[]
}

type Template = 'standard' | 'bottomBar'

// ---------- Helpers ----------
const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(String(r.result))
    r.onerror = reject
    r.readAsDataURL(file)
  })

function hexToRGBA(hex: string, alpha = 1) {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function classNames(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

// ---------- App ----------
import React, { useEffect, useRef, useState } from 'react'

export default function App() {
  // Free vs Pro UI gate (kept from earlier plan)
  const isPro = new URLSearchParams(window.location.search).get('pro') === '1'

  // Uploads
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaDataUrl, setMediaDataUrl] = useState<string | null>(null)

  // Branding
  const [overlayText, setOverlayText] = useState('Your Catchy Title Here')
  const [brandColor, setBrandColor] = useState('#0db981') // aqua from site
  const [accentColor, setAccentColor] = useState('#635bff') // button purple from site
  const [font, setFont] = useState('Poppins')
  const [template, setTemplate] = useState<Template>('bottomBar')

  // Logo toggle + upload
  const [includeLogo, setIncludeLogo] = useState(true)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [logoScale, setLogoScale] = useState(1.0)

  // Generated content
  const [gen, setGen] = useState<GenResult | null>(null)
  const [genError, setGenError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Canvas preview
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  // Load default app logo if user hasn’t uploaded one
  useEffect(() => {
    if (!logoDataUrl) {
      // public/logo.png should exist
      setLogoDataUrl('/logo.png')
    }
  }, [logoDataUrl])

  // Make uploads work
  const onUpload = async (f: File | null) => {
    if (!f) return
    setMediaFile(f)
    const dataUrl = await readFileAsDataURL(f)
    setMediaDataUrl(dataUrl)
  }
  const onLogoUpload = async (f: File | null) => {
    if (!f) return
    setLogoFile(f)
    const dataUrl = await readFileAsDataURL(f)
    setLogoDataUrl(dataUrl)
  }

  // Draw preview whenever inputs change
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return

    const W = 1000
    const H = 1500
    c.width = W
    c.height = H

    // bg
    ctx.fillStyle = '#f6f7fb'
    ctx.fillRect(0, 0, W, H)

    // If no image yet, show placeholder
    if (!mediaDataUrl) {
      ctx.fillStyle = '#c9cff5'
      ctx.fillRect(0, 0, W, 380)
      ctx.fillStyle = '#111827'
      ctx.font = '28px system-ui, -apple-system, Segoe UI, Roboto'
      ctx.fillText('Upload an image to preview your design', 40, 220)
      setDownloadUrl(null)
      return
    }

    // draw main image, cover-fit
    const img = new Image()
    img.onload = () => {
      // cover fit
      const rImg = img.width / img.height
      const rCan = W / H
      let drawW = W, drawH = H
      if (rImg > rCan) {
        // wider than canvas
        drawH = H
        drawW = H * rImg
      } else {
        drawW = W
        drawH = W / rImg
      }
      const dx = (W - drawW) / 2
      const dy = (H - drawH) / 2
      ctx.drawImage(img, dx, dy, drawW, drawH)

      // overlay template
      if (template === 'standard') {
        // text pill at top
        const pad = 28
        const pillH = 80
        ctx.fillStyle = hexToRGBA(brandColor, 0.85)
        roundRect(ctx, pad, pad, W - pad * 2, pillH, 16, true, false)
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold 36px ${font}, system-ui`
        ctx.fillText(overlayText, pad + 24, pad + pillH / 2 + 12)
      } else {
        // bottom bar
        const barH = 180
        ctx.fillStyle = hexToRGBA('#000', 0.28)
        ctx.fillRect(0, H - barH - 8, W, barH + 8)
        ctx.fillStyle = brandColor
        ctx.fillRect(0, H - barH, W, barH)

        // text
        ctx.fillStyle = '#ffffff'
        ctx.font = `bold 42px ${font}, system-ui`
        ctx.fillText(overlayText, 40, H - barH / 2 + 14)
      }

      // brand accent stripe
      ctx.fillStyle = accentColor
      ctx.fillRect(0, 0, W, 8)

      // optional logo (top-left)
      if (includeLogo && logoDataUrl) {
        const L = new Image()
        L.onload = () => {
          const size = 160 * logoScale
          ctx.drawImage(L, 32, 32, size, size)
          finalize()
        }
        L.src = logoDataUrl
      } else {
        finalize()
      }

      function finalize() {
        // make download URL
        const url = c.toDataURL('image/jpeg', 0.92)
        setDownloadUrl(url)
      }
    }
    img.src = mediaDataUrl
  }, [mediaDataUrl, overlayText, brandColor, accentColor, font, template, includeLogo, logoDataUrl, logoScale])

  // Generate with Gemini (gracefully handle quota/429)
  const onGenerate = async () => {
    if (!mediaDataUrl) return
    setBusy(true)
    setGenError(null)
    setGen(null)
    try {
      const base64Data = mediaDataUrl.split(',')[1]
      const mimeType = 'image/png' // ok for jpeg too; Gemini just wants an image
      const r = await generatePinContent(base64Data, mimeType, 'Pinterest pin about the uploaded image')
      setGen({
        title: r.title || 'Your Pin Title',
        description: r.description || 'Pin description generated by AI',
        keywords: r.keywords?.length ? r.keywords : ['pinterest', 'inspiration', 'ideas'],
      })
    } catch (e: any) {
      const msg = String(e?.message || e)
      if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
        setGenError(
          'Your Google AI quota is exhausted. Add a paid key to Vercel env (GEMINI_API_KEY), redeploy, and try again.'
        )
      } else {
        setGenError(msg)
      }
    } finally {
      setBusy(false)
    }
  }

  // Download
  const onDownload = () => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = 'pinpilot-branded.jpg'
    a.click()
  }

  // Reset
  const onReset = () => {
    setMediaFile(null)
    setMediaDataUrl(null)
    setOverlayText('Your Catchy Title Here')
    setBrandColor('#0db981')
    setAccentColor('#635bff')
    setFont('Poppins')
    setTemplate('bottomBar')
    setIncludeLogo(true)
    setLogoFile(null)
    setLogoDataUrl('/logo.png')
    setLogoScale(1.0)
    setGen(null)
    setGenError(null)
    setDownloadUrl(null)
  }

  return (
    <div className="pp-wrap">
      {/* Header */}
      <header className="pp-header">
        <div className="pp-brand">
          <img src="/logo.png" alt="Pin Pilot" className="pp-logo" />
          <div className="pp-title">Pin Pilot</div>
        </div>
        <div className="pp-tagline">Pin better. Grow faster.</div>
      </header>

      <main className="pp-main">
        {/* Left card */}
        <section className="pp-card">
          <h3 className="pp-card-title"><span>1</span> Upload & Brand</h3>

          {/* File upload */}
          <div className="pp-upload">
            <label className="pp-upload-box">
              <input
                type="file"
                accept="image/*"
                onChange={e => onUpload(e.target.files?.[0] || null)}
              />
              <div>Click to upload or drag and drop</div>
              <small>Image (PNG/JPG)</small>
            </label>
            {!!mediaFile && (
              <div className="pp-upload-meta">
                <strong>{mediaFile.name}</strong>
                <small>{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</small>
              </div>
            )}
          </div>

          {/* Branding controls */}
          <div className="pp-field">
            <label>Template</label>
            <select value={template} onChange={e => setTemplate(e.target.value as Template)}>
              <option value="standard">Standard</option>
              <option value="bottomBar">Bottom bar</option>
            </select>
          </div>

          <div className="pp-field">
            <label>Text Overlay</label>
            <input value={overlayText} onChange={e => setOverlayText(e.target.value)} />
          </div>

          <div className="pp-row">
            <div className="pp-field">
              <label>Brand Color (hex)</label>
              <input value={brandColor} onChange={e => setBrandColor(e.target.value)} />
            </div>
            <div className="pp-field">
              <label>Accent Color (hex)</label>
              <input value={accentColor} onChange={e => setAccentColor(e.target.value)} />
            </div>
          </div>

          <div className="pp-field">
            <label>Font</label>
            <select value={font} onChange={e => setFont(e.target.value)}>
              <option>Poppins</option>
              <option>Inter</option>
              <option>Montserrat</option>
              <option>Lato</option>
            </select>
          </div>

          <div className="pp-field">
            <label>Logo</label>
            <div className="pp-row">
              <label className="pp-upload-mini">
                <input type="file" accept="image/*" onChange={e => onLogoUpload(e.target.files?.[0] || null)} />
                Upload Logo
              </label>
              <label className="pp-checkbox">
                <input type="checkbox" checked={includeLogo} onChange={e => setIncludeLogo(e.target.checked)} />
                Include logo on the image
              </label>
            </div>
            {includeLogo && (
              <div className="pp-field" style={{ marginTop: 8 }}>
                <label>Logo Size</label>
                <input
                  type="range"
                  min="0.5" max="2" step="0.05"
                  value={logoScale}
                  onChange={e => setLogoScale(parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="pp-actions">
            <button className="pp-btn ghost" onClick={onReset}>Reset</button>
          </div>
        </section>

        {/* Right card */}
        <section className="pp-card">
          <h3 className="pp-card-title"><span>2</span> Preview & Content</h3>

          <div className="pp-canvas-wrap">
            <canvas ref={canvasRef} className="pp-canvas" />
          </div>

          <div className="pp-actions">
            <button className="pp-btn" disabled={!mediaDataUrl || busy} onClick={onGenerate}>
              {busy ? 'Generating…' : 'Generate Pin Content'}
            </button>
            <button className="pp-btn ghost" disabled={!downloadUrl} onClick={onDownload}>
              Download Branded Image
            </button>
          </div>

          {genError && <div className="pp-alert error">{genError}</div>}

          {gen && (
            <div className="pp-gen">
              <div className="pp-field">
                <label>Title</label>
                <textarea rows={2} value={gen.title} onChange={e => setGen({ ...gen, title: e.target.value })} />
              </div>
              <div className="pp-field">
                <label>Description</label>
                <textarea rows={4} value={gen.description} onChange={e => setGen({ ...gen, description: e.target.value })} />
              </div>
              <div className="pp-field">
                <label>Keywords / Tags</label>
                <textarea
                  rows={2}
                  value={gen.keywords.join(', ')}
                  onChange={e => setGen({ ...gen, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                />
              </div>
            </div>
          )}

          {/* Pro-only area (kept simple and clear) */}
          {!isPro && (
            <div className="pp-note">
              Pinterest connect & scheduling are <strong>Pro</strong> features.
              Add <code>?pro=1</code> to your URL to preview, or subscribe in the web app.
            </div>
          )}
        </section>
      </main>

      <footer className="pp-footer">
        <div>© {new Date().getFullYear()} Pin Pilot</div>
        <div className="pp-footer-right">Powered by Google Gemini & Pinterest API</div>
      </footer>
    </div>
  )
}

// rounded rect helper
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, height: number,
  radius: number,
  fill: boolean, stroke: boolean
) {
  if (radius < 0) radius = 0
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
  if (fill) ctx.fill()
  if (stroke) ctx.stroke()
}
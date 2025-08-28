import React, { useMemo } from 'react';
import { PinData, BrandingOptions, PinterestBoard } from '../types';

type Props = {
  finalPinImageUrl: string | null;
  mediaPreviewUrl: string | null;
  mediaType: 'image' | 'video' | null;
  pinData: PinData;

  branding: BrandingOptions;

  isPro?: boolean;
  isConnected?: boolean;
  userBoards?: PinterestBoard[];

  onPostPin?: (boardId: string, title: string, description: string) => void;

  isPosting?: boolean;
  postError?: string | null;
  postSuccess?: string | null;
  postingProgress?: string | null;

  onSchedulePin?: (boardId: string, title: string, description: string, scheduledAt: string) => void;
  isScheduling?: boolean;
  scheduleError?: string | null;
  scheduleSuccess?: string | null;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export default function PinResult({
  finalPinImageUrl,
  mediaPreviewUrl,
  mediaType,
  pinData,

  branding,

  isPro,
  isConnected,
  userBoards = [],

  onPostPin,
  isPosting,
  postError,
  postSuccess,
  postingProgress,

  onSchedulePin,
  isScheduling,
  scheduleError,
  scheduleSuccess,
}: Props) {
  const previewSrc = useMemo(() => {
    return finalPinImageUrl || mediaPreviewUrl || null;
  }, [finalPinImageUrl, mediaPreviewUrl]);

  const downloadBranded = async () => {
    if (!previewSrc) return;

    const base = await loadImage(previewSrc);
    const canvas = document.createElement('canvas');
    canvas.width = base.width;
    canvas.height = base.height;
    const ctx = canvas.getContext('2d')!;

    // Base
    ctx.drawImage(base, 0, 0);

    // Accent bar (simple, from branding)
    ctx.fillStyle = branding?.colors?.accent || '#000';
    ctx.globalAlpha = 0.18;
    ctx.fillRect(0, 0, canvas.width, Math.ceil(canvas.height * 0.18));
    ctx.globalAlpha = 1;

    // Overlay text
    if (branding?.overlayText) {
      ctx.fillStyle = branding?.colors?.text || '#fff';
      ctx.font = `bold ${Math.max(28, canvas.width * 0.04)}px ${branding?.font || 'Poppins'}`;
      ctx.textBaseline = 'top';
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = 8;
      ctx.fillText(branding.overlayText, 20, 20);
      ctx.shadowBlur = 0;
    }

    // User logo (supports either branding.logoDataUrl or branding.logo?.dataUrl)
    // Also supports optional branding.logoScalePct (default 100)
    // @ts-ignore
    const possibleDataUrl: string | undefined = branding?.logoDataUrl || branding?.logo?.dataUrl;
    if (possibleDataUrl) {
      const logo = await loadImage(possibleDataUrl);
      // @ts-ignore
      const scalePct: number = branding?.logoScalePct || 100;
      const scale = Math.max(0.05, Math.min(3, scalePct / 100)); // clamp 5%–300%

      const targetW = Math.max(64, logo.width * scale);
      const targetH = (logo.height * targetW) / logo.width;

      const pad = Math.max(16, Math.round(canvas.width * 0.02));
      ctx.drawImage(logo, canvas.width - targetW - pad, canvas.height - targetH - pad, targetW, targetH);
    }

    const data = canvas.toDataURL('image/jpeg', 0.92);
    const a = document.createElement('a');
    a.href = data;
    a.download = 'pinpilot-branded.jpg';
    a.click();
  };

  return (
    <div className="pp-result">
      {previewSrc ? (
        <img src={previewSrc} alt="Preview" className="pp-render" />
      ) : (
        <div className="pp-empty">No preview available.</div>
      )}

      <div className="pp-fields">
        <div className="pp-field">
          <label>Title</label>
          <input type="text" value={pinData?.title || ''} readOnly />
        </div>
        <div className="pp-field">
          <label>Description</label>
          <textarea rows={3} value={pinData?.description || ''} readOnly />
        </div>
        <div className="pp-field">
          <label>Keywords / Tags</label>
          <textarea rows={2} value={(pinData?.keywords || []).join(', ')} readOnly />
        </div>
      </div>

      <div className="pp-actions">
        <button className="pp-secondary" onClick={downloadBranded} disabled={!previewSrc}>
          Download Branded Image
        </button>

        {/* Pro posting / scheduling */}
        {isPro ? (
          <div className="pp-proactions">
            <div className="pp-prorow">
              <span className="muted">Post to Pinterest</span>
              <div className="pp-hstack">
                <select id="pp-board" disabled={!isConnected || userBoards.length === 0}>
                  {userBoards.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                <button
                  className="pp-primary"
                  disabled={!isConnected || !onPostPin || !pinData?.title}
                  onClick={() => {
                    const sel = document.getElementById('pp-board') as HTMLSelectElement | null;
                    const boardId = sel?.value || '';
                    onPostPin?.(boardId, pinData.title, pinData.description || '');
                  }}
                >
                  {isPosting ? 'Posting…' : 'Post Now'}
                </button>
              </div>
              {postingProgress && <div className="muted">{postingProgress}</div>}
              {postError && <div className="pp-errtext">{postError}</div>}
              {postSuccess && <div className="pp-successtext">{postSuccess}</div>}
            </div>

            <div className="pp-prorow">
              <span className="muted">Schedule</span>
              <div className="pp-hstack">
                <input id="pp-when" type="datetime-local" />
                <button
                  className="pp-secondary"
                  disabled={!isConnected || !onSchedulePin || !pinData?.title}
                  onClick={() => {
                    const sel = document.getElementById('pp-board') as HTMLSelectElement | null;
                    const boardId = sel?.value || '';
                    const when = (document.getElementById('pp-when') as HTMLInputElement | null)?.value || '';
                    onSchedulePin?.(boardId, pinData.title, pinData.description || '', when);
                  }}
                >
                  {isScheduling ? 'Scheduling…' : 'Schedule'}
                </button>
              </div>
              {scheduleError && <div className="pp-errtext">{scheduleError}</div>}
              {scheduleSuccess && <div className="pp-successtext">{scheduleSuccess}</div>}
            </div>
          </div>
        ) : (
          <div className="pp-upgrade">Pinterest connect & scheduling are Pro features.</div>
        )}
      </div>
    </div>
  );
}
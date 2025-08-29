import { BrandingOptions, TemplateType } from '../types';
import { dataUrlToImage } from '../services/image';

function withFont(ctx: CanvasRenderingContext2D, family: string, px: number, weight='700'){
  ctx.font = `${weight} ${px}px "${family}", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Inter, Roboto`;
}

function drawBottomBar(ctx: CanvasRenderingContext2D, W: number, H: number, opts: BrandingOptions){
  const h = Math.round(H*0.18);
  ctx.fillStyle = opts.colors.bar;
  ctx.fillRect(0, H-h, W, h);
  if (opts.overlayText){
    withFont(ctx, opts.font, Math.round(h*0.33),'800');
    ctx.fillStyle = opts.colors.text;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const pad = Math.round(W*0.05);
    ctx.fillText(opts.overlayText, pad, H - h/2, W - pad*2);
  }
}

function drawCornerTag(ctx: CanvasRenderingContext2D, W: number, H: number, opts: BrandingOptions){
  const w = Math.round(W*0.42), h = Math.round(H*0.12), r=16;
  ctx.fillStyle = opts.colors.bar;
  ctx.beginPath();
  ctx.moveTo(r,0);
  ctx.arcTo(w,0,w,r,r);
  ctx.lineTo(w,h-r);
  ctx.arcTo(w,h,w-r,h,r);
  ctx.lineTo(r,h);
  ctx.arcTo(0,h,0,h-r,r);
  ctx.lineTo(0,r);
  ctx.arcTo(0,0,r,0,r);
  ctx.closePath(); ctx.fill();
  if (opts.overlayText){
    withFont(ctx, opts.font, Math.round(h*0.36),'800');
    ctx.fillStyle = opts.colors.text;
    ctx.textAlign='left'; ctx.textBaseline='middle';
    ctx.fillText(opts.overlayText, 16, h/2, w-24);
  }
}

function drawTextOverlay(ctx: CanvasRenderingContext2D, W:number, H:number, opts:BrandingOptions){
  if (!opts.overlayText) return;
  const x = Math.round(opts.textPos.x * W);
  const y = Math.round(opts.textPos.y * H);
  withFont(ctx, opts.font, Math.round(W*0.06), '800');
  ctx.fillStyle = 'rgba(255,255,255,.93)';
  ctx.strokeStyle = 'rgba(17,24,39,.2)';
  ctx.lineWidth = 6;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.strokeText(opts.overlayText, x, y, Math.round(W*0.9));
  ctx.fillText(opts.overlayText, x, y, Math.round(W*0.9));
}

async function drawLogo(ctx: CanvasRenderingContext2D, W:number, H:number, opts:BrandingOptions){
  if (!opts.logoEnabled || !opts.logoDataUrl) return;
  const logo = await dataUrlToImage(opts.logoDataUrl);
  const w = Math.max(60, Math.round(W * opts.logoSize));
  const r = w / (logo.width || 1);
  const h = Math.round(logo.height * r);
  const x = Math.round(opts.logoPos.x * W - w/2);
  const y = Math.round(opts.logoPos.y * H - h/2);
  // subtle card behind
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.fillRect(x-8, y-8, w+16, h+16);
  ctx.drawImage(logo, x, y, w, h);
}

async function drawTemplate(ctx:CanvasRenderingContext2D, W:number, H:number, t:TemplateType, opts:BrandingOptions){
  if (!opts.showOverlay || t==='none') return;
  if (t==='bottomBar') drawBottomBar(ctx,W,H,opts);
  if (t==='cornerTag') drawCornerTag(ctx,W,H,opts);
  if (t==='textOverlay') drawTextOverlay(ctx,W,H,opts);
}

export async function composeFinal(pinBase1000x1500: string, opts: BrandingOptions): Promise<string>{
  const W=1000, H=1500;
  const bg = await dataUrlToImage(pinBase1000x1500);
  const c = document.createElement('canvas'); c.width=W; c.height=H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H);
  ctx.drawImage(bg,0,0,W,H);
  await drawTemplate(ctx,W,H,opts.template,opts);
  await drawLogo(ctx,W,H,opts);
  return c.toDataURL('image/jpeg', 0.92);
}
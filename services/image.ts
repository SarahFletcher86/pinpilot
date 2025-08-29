export async function fileToDataUrl(f: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(new Error('Failed to read file'));
    fr.onload = () => res(String(fr.result));
    fr.readAsDataURL(f);
  });
}

export async function dataUrlToImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('Image load error'));
    img.src = url;
  });
}

/** Resize to 1000x1500 (cover) for Pinterest 2:3 pins. Returns dataURL. */
export async function resizeToPin(dataUrl: string, W=1000, H=1500): Promise<string> {
  const img = await dataUrlToImage(dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  // cover logic
  const r = Math.max(W / img.width, H / img.height);
  const nw = img.width * r, nh = img.height * r;
  const dx = (W - nw)/2, dy = (H - nh)/2;
  ctx.fillStyle = '#fff'; ctx.fillRect(0,0,W,H);
  ctx.drawImage(img, dx, dy, nw, nh);
  return canvas.toDataURL('image/jpeg', 0.92);
}
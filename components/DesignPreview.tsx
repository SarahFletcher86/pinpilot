import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type Branding = {
  overlayText: string;
  colors: { text: string; accent: string };
  font: string;
  logoDataUrl: string | null;
  includeLogo: boolean;
  template: "standard" | "bottomBar";
};

export type DesignPreviewRef = {
  download: () => void;
};

export default forwardRef<DesignPreviewRef, {
  baseImage: string | null;
  branding: Branding;
  onComposite: (pngDataUrl: string) => void;
}>(({ baseImage, branding, onComposite }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useImperativeHandle(ref, () => ({
    download() {
      if (!canvasRef.current) return;
      const url = canvasRef.current.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "pinpilot-branded.png";
      a.click();
    },
  }));

  useEffect(() => {
    const draw = async () => {
      const c = canvasRef.current;
      if (!c) return;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      // set output size (Pinterest likes tall ratios; 1000x1500 here)
      const W = 1000;
      const H = 1500;
      c.width = W;
      c.height = H;

      // bg
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      if (!baseImage) {
        // placeholder
        ctx.fillStyle = "#eef2ff";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 28px Inter, system-ui, -apple-system, Segoe UI, Roboto";
        ctx.fillText("Upload an image to preview your design", 60, 80);
        onComposite(c.toDataURL("image/png"));
        return;
      }

      // draw base image, letterboxed
      const img = await load(baseImage);
      const scale = Math.min(W / img.width, H / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = (W - dw) / 2;
      const dy = (H - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);

      // overlay text
      ctx.font = `bold 64px ${branding.font}, system-ui, -apple-system`;
      ctx.fillStyle = branding.colors.text;
      ctx.textAlign = "center";
      wrapText(ctx, branding.overlayText, W / 2, 140, W - 160, 64);

      // bottom bar template (optional)
      if (branding.template === "bottomBar") {
        ctx.fillStyle = branding.colors.accent;
        const barH = 130;
        ctx.fillRect(0, H - barH, W, barH);
      }

      // logo (large)
      if (branding.includeLogo && branding.logoDataUrl) {
        try {
          const logo = await load(branding.logoDataUrl);
          const L = Math.floor(W * 0.22); // big & visible
          const pad = 28;
          const ly = branding.template === "bottomBar" ? H - L - 20 : H - L - 40;
          ctx.save();
          ctx.beginPath();
          roundedRect(ctx, pad - 6, ly - 6, L + 12, L + 12, 18);
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.fill();
          ctx.drawImage(logo, pad, ly, L, L);
          ctx.restore();
        } catch {}
      }

      onComposite(c.toDataURL("image/png"));
    };

    draw();
  }, [baseImage, branding, onComposite]);

  return (
    <div className="pp-preview">
      <canvas ref={canvasRef} />
    </div>
  );
});

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + " ";
    const w = ctx.measureText(test).width;
    if (w > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
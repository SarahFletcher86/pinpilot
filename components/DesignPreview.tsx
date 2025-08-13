import React, { useRef, useEffect } from 'react';
import { BrandingOptions } from '../types';

interface DesignPreviewProps {
    baseImage: string;
    options: BrandingOptions;
    onDesignChange: (designedImage: string) => void;
}

const DesignPreview: React.FC<DesignPreviewProps> = (props) => {
    const { baseImage, options, onDesignChange } = props;
    const { template, overlayText: text, colors, font, logo } = options;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = baseImage;

        img.onload = () => {
            // Set canvas dimensions to match image
            canvas.width = img.width;
            canvas.height = img.height;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw base image
            ctx.drawImage(img, 0, 0);

            // Apply templates
            if (template === 'bottom-bar') {
                const barHeight = canvas.height * 0.2;
                ctx.fillStyle = colors.accent;
                ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
            }

            // Draw text based on template
            if (template !== 'standard' && text) {
                const fontSize = Math.max(24, canvas.width / 20);
                ctx.font = `bold ${fontSize}px "${font}", sans-serif`;
                ctx.fillStyle = colors.text;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                let textY;
                if (template === 'text-overlay') {
                    textY = canvas.height / 2;
                } else { // bottom-bar
                    const barHeight = canvas.height * 0.2;
                    textY = canvas.height - (barHeight / 2);
                }

                // Simple text wrapping
                const maxWidth = canvas.width * 0.9;
                const words = text.split(' ');
                let line = '';
                const lines = [];

                for (let n = 0; n < words.length; n++) {
                    const testLine = line + words[n] + ' ';
                    const metrics = ctx.measureText(testLine);
                    const testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        lines.push(line);
                        line = words[n] + ' ';
                    } else {
                        line = testLine;
                    }
                }
                lines.push(line);

                const lineHeight = fontSize * 1.2;
                const startY = textY - ( (lines.length - 1) * lineHeight / 2);
                
                lines.forEach((l, i) => {
                     ctx.fillText(l.trim(), canvas.width / 2, startY + (i * lineHeight));
                });
            }

            // Draw logo
            if (logo) {
                const logoImg = new Image();
                logoImg.src = logo;
                logoImg.onload = () => {
                    const logoSize = canvas.width / 10;
                    const margin = logoSize / 4;
                    ctx.drawImage(logoImg, canvas.width - logoSize - margin, canvas.height - logoSize - margin, logoSize, logoSize);
                    
                    // Export final image after logo is drawn
                    onDesignChange(canvas.toDataURL('image/jpeg'));
                };
            } else {
                 // Export final image if no logo
                 onDesignChange(canvas.toDataURL('image/jpeg'));
            }
        };

    }, [baseImage, options, onDesignChange]);

    return <canvas ref={canvasRef} className="w-full h-auto rounded-lg shadow-md border border-slate-200" />;
};

export default DesignPreview;
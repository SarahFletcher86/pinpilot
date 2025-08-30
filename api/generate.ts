// api/generate.ts — Automated pin generation for free tier

import { generatePinCopy } from "../services/geminiService";

type GenerateRequest = {
  files: string[]; // base64 data URLs
  isVideo: boolean;
  brandPrimary?: string;
  brandAccent?: string;
  overlayText?: string;
};

type GenerateResponse = {
  imageBase64: string;
  title: string;
  description: string;
  tags: string[];
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ message: "Use POST" });
    return;
  }

  try {
    const body: GenerateRequest = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { files, isVideo, brandPrimary = "#635bff", brandAccent = "#10b981", overlayText = "Your catchy title here" } = body;

    if (!files || files.length === 0) {
      res.status(400).json({ message: "No files provided" });
      return;
    }

    // For now, use first file
    const imageData = files[0];

    // Generate copy
    const copy = await generatePinCopy({
      brandPrimary,
      brandAccent,
      overlayText
    });

    // For now, return the original image (client will apply branding)
    const brandedImage = imageData;

    const response: GenerateResponse = {
      imageBase64: brandedImage,
      title: copy.title,
      description: copy.description,
      tags: copy.tags
    };

    res.status(200).json(response);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || "Generation failed" });
  }
}

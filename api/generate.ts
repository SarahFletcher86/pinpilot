// api/generate.ts — Secure AI content generation with image analysis

type GenerateRequest = {
  files: string[]; // base64 data URLs
  isVideo: boolean;
  brandPrimary?: string;
  brandAccent?: string;
  overlayText?: string;
  businessNiche?: string;
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
    const {
      files,
      isVideo,
      brandPrimary = "#635bff",
      brandAccent = "#10b981",
      overlayText = "Your catchy title here",
      businessNiche = "digital products, stickers, graphics"
    } = body;

    if (!files || files.length === 0) {
      res.status(400).json({ message: "No files provided" });
      return;
    }

    // Get API key from server environment (secure)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.error('Gemini API key not configured on server');
      res.status(500).json({ message: "AI service not configured" });
      return;
    }

    // Use first file for analysis
    const imageData = files[0];

    // Extract base64 data from data URL
    const base64Data = imageData.split(',')[1];

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

🎨 BRANDING: Primary=${brandPrimary}, Accent=${brandAccent}, Overlay="${overlayText}"`;

    // Prepare the request with image data for Gemini Vision
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: imageData.includes('data:image/png') ? 'image/png' :
                        imageData.includes('data:image/jpeg') ? 'image/jpeg' :
                        imageData.includes('data:image/jpg') ? 'image/jpeg' : 'image/png',
              data: base64Data
            }
          }
        ]
      }],
      generationConfig: { temperature: 0.7 },
      safetySettings: []
    };

    console.log('Sending request to Gemini Vision API');
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    console.log('Gemini response status:', geminiResponse.status);
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json();
      console.error('Gemini API error:', errorData.message || 'Unknown error');
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API call completed successfully');

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
      imageBase64: imageData // Return the original image (client will apply branding)
    };

    console.log('AI content generation completed successfully');
    res.status(200).json(data);

  } catch (e: any) {
    console.error('Generation error:', e);
    res.status(500).json({ message: e?.message || "Generation failed" });
  }
}

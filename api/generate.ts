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

    // Check if this is demo mode
    const isDemo = req.headers.referer?.includes('?demo=1') ||
                   req.headers.referer?.includes('&demo=1') ||
                   req.headers['user-agent']?.includes('demo') ||
                   req.query?.demo === '1' ||
                   req.url?.includes('?demo=1') ||
                   req.url?.includes('&demo=1') ||
                   (body as any).demo === true ||
                   (body as any).demo === '1' ||
                   req.headers.referer?.includes('demo=1') || // Extra fallback
                   req.headers.referer?.includes('vercel.app') && req.headers.referer?.includes('demo=1'); // Vercel specific

    console.log('=== DEMO MODE DETECTION ===');
    console.log('- Full headers:', JSON.stringify(req.headers, null, 2));
    console.log('- Query params:', JSON.stringify(req.query, null, 2));
    console.log('- Full URL:', req.url);
    console.log('- Original URL:', req.originalUrl);
    console.log('- Referer contains demo:', req.headers.referer?.includes('demo=1'));
    console.log('- Body demo flag:', (body as any).demo);
    console.log('- Is demo mode:', isDemo);
    console.log('- Body keys:', Object.keys(body));
    console.log('===========================');

    // In demo mode, return mock successful response
    if (isDemo) {
      console.log('🎬 DEMO MODE ACTIVATED - Returning mock AI content');
      console.log('Demo request details:', {
        hasFiles: files.length > 0,
        fileCount: files.length,
        isVideo,
        brandPrimary: body.brandPrimary,
        businessNiche: body.businessNiche
      });

      const mockResponse = {
        title: "Stunning Digital Stickers Collection - Instant Download!",
        description: "Transform your digital space with our premium sticker collection! Featuring cute animals, motivational quotes, and trendy designs. Perfect for planners, laptops, and social media. High-quality PNG files with transparent backgrounds. Instant download, unlimited use, perfect for any project!",
        tags: [
          "digital stickers",
          "cute stickers",
          "planner stickers",
          "laptop stickers",
          "transparent PNG",
          "instant download",
          "unlimited use",
          "social media stickers",
          "motivational stickers",
          "trend stickers",
          "digital downloads",
          "sticker pack"
        ],
        imageBase64: files[0] // Return the original image
      };

      console.log('Demo AI content generation completed successfully');
      return res.status(200).json(mockResponse);
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
      // Handle potential HTML error responses from Gemini
      const responseText = await geminiResponse.text();
      console.error('Gemini API error response (first 500 chars):', responseText.substring(0, 500));

      let errorMessage = `Gemini API error: ${geminiResponse.status}`;

      // Check if response is HTML (common Gemini error format)
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        console.error('Gemini returned HTML error page instead of JSON');

        // Extract error info from HTML if possible
        if (responseText.includes('API_KEY')) {
          errorMessage = 'Invalid Gemini API key. Please check your .env file.';
        } else if (responseText.includes('quota') || responseText.includes('limit')) {
          errorMessage = 'Gemini API quota exceeded. Please try again later.';
        } else if (responseText.includes('permission') || responseText.includes('access')) {
          errorMessage = 'Gemini API access denied. Check API key permissions.';
        } else if (responseText.includes('Request Error')) {
          errorMessage = 'Gemini API request error. Check request format.';
        } else {
          errorMessage = 'Gemini API returned an error page. Please check your API key and try again.';
        }
      } else {
        // Try to parse as JSON
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch (parseError) {
          console.error('Failed to parse Gemini error as JSON:', parseError);
          errorMessage = 'Gemini API returned an unexpected response format.';
        }
      }

      throw new Error(errorMessage);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API call completed successfully');

    const text = geminiData?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") ||
                geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log('Gemini response text (first 200 chars):', text.substring(0, 200));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response');
      console.error('Full response text:', text);
      throw new Error('Gemini API did not return valid JSON. Please try again.');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse JSON from Gemini response:', parseError);
      console.error('JSON match:', jsonMatch[0]);
      throw new Error('Gemini API returned invalid JSON format. Please try again.');
    }

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

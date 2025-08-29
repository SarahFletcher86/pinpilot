import { GeneratedContent } from '../types';

/**
 * Client-side call to Gemini 1.5 for title/description/keywords.
 * Uses Vite env: import.meta.env.VITE_GEMINI_API_KEY
 * Falls back gracefully on quota/billing errors.
 */
export async function generatePinContent(
  imageDataUrl: string,
  brand: { primary:string; accent:string; font:string; overlayText?:string }
): Promise<GeneratedContent>{
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  const fallback: GeneratedContent = {
    title: 'Eye-catching Pinterest Pin Title',
    description: 'A concise, keyword-rich description tailored for Pinterest search and saves.',
    keywords: ['pinterest', 'ideas', 'inspiration']
  };

  if (!API_KEY) return fallback;

  // send inline image + prompt
  const base64 = imageDataUrl.split(',')[1];
  const body = {
    contents:[{
      parts:[
        {text: `You are a Pinterest SEO copywriter. Based on this image and the brand tone (primary ${brand.primary}, accent ${brand.accent}, font ${brand.font}), write a compelling Pinterest pin title (<=80 chars), a 2–3 sentence description with keywords, and a list of 8–12 comma-separated keywords. Respond as JSON with keys: title, description, keywords.`},
        {inline_data:{ mime_type:'image/jpeg', data: base64 }}
      ]
    }]
  };

  try{
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,{
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(body)
    });
    const data = await r.json();
    // Parse JSON from model text
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return fallback;
    // try to find JSON object in the text
    const match = text.match(/\{[\s\S]*\}$/);
    const json = JSON.parse(match ? match[0] : text);
    const out: GeneratedContent = {
      title: String(json.title||fallback.title),
      description: String(json.description||fallback.description),
      keywords: Array.isArray(json.keywords) ? json.keywords.map(String) :
                String(json.keywords||'').split(',').map((s:string)=>s.trim()).filter(Boolean)
    };
    if (out.keywords.length===0) out.keywords = fallback.keywords;
    return out;
  }catch(e){
    return fallback;
  }
}
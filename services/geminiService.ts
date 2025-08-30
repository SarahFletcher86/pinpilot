// services/geminiService.ts — thin client caller with robust fallback
type GenArgs = {
  brandPrimary: string;
  brandAccent: string;
  overlayText?: string;
};

type GenResult = { title: string; description: string; tags: string[] };

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Minimal, resilient prompt that returns JSON we can trust
const prompt = (args: GenArgs) => `
You are optimizing Pinterest pins for CTR & saves. 
Return strict JSON with: title, description, tags (max 12, lowercase). 
Tone: practical, concise, positive. 
Include long-tail keywords users actually search.

Context:
- Brand primary: ${args.brandPrimary}
- Accent: ${args.brandAccent}
- Overlay (optional): ${args.overlayText ?? ""}

JSON ONLY:
`;

export async function generatePinCopy(args: GenArgs): Promise<GenResult> {
  // If key is missing or quota issues, serve a solid template fallback
  if (!API_KEY) return fallback();

  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt(args) }] }],
          generationConfig: { temperature: 0.7 },
          safetySettings: [],
        }),
      }
    );

    if (!res.ok) {
      // Graceful handling for 429 etc.
      const txt = await res.text();
      if (res.status === 429) throw new Error("Gemini quota exceeded (HTTP 429). Using smart fallback.");
      throw new Error(`Gemini error (${res.status}): ${txt.slice(0,140)}`);
    }

    const data = await res.json();
    const text: string =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text).join("\n") ??
      "";

    // Try to parse JSON from the returned text
    const jsonMatch = text.match(/\{[\s\S]*\}$/);
    const obj = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (!obj?.title || !obj?.description || !obj?.tags) return fallback();
    return {
      title: String(obj.title).slice(0, 95),
      description: String(obj.description).slice(0, 480),
      tags: Array.isArray(obj.tags) ? obj.tags.slice(0, 12) : String(obj.tags).split(",").slice(0,12).map((t)=>t.trim()),
    };
  } catch (err) {
    return fallback();
  }
}

function fallback(): GenResult {
  return {
    title: "Eye-catching Pinterest Pin Title",
    description:
      "A concise, keyword-rich description tailored for Pinterest search and saves. Include a benefit, a relevant keyword phrase, and a gentle call-to-action.",
    tags: ["pinterest", "ideas", "inspiration", "marketing", "tips", "how to", "trending", "shopping", "branding"].slice(0,12),
  };
}
// services/geminiService.ts — clear status + resilient generation

type GenArgs = { brandPrimary: string; brandAccent: string; overlayText?: string; };
type GenResult = { title: string; description: string; tags: string[] };

const KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export function geminiStatus(): {ok:boolean; kind:"info"|"error"; message:string}{
  if (!KEY) return { ok:false, kind:"error", message:"Gemini API key not set. Add VITE_GEMINI_API_KEY in Vercel → Settings → Environment Variables and redeploy." };
  return { ok:true, kind:"info", message:"" };
}

const prompt = (a:GenArgs)=>`
Return STRICT JSON with fields: title, description, tags (max 12).
Audience: Pinterest shoppers. Optimize for search & saves. Use brand tones.

brand_primary:${a.brandPrimary} accent:${a.brandAccent} overlay:${a.overlayText??""}
JSON ONLY:
`;

export async function generatePinCopy(args: GenArgs): Promise<GenResult>{
  if (!KEY) return fallback();

  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="+KEY;
  try{
    const r = await fetch(url,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        contents:[{ parts:[{ text: prompt(args) }]}],
        generationConfig:{ temperature:0.7 },
        safetySettings:[]
      })
    });
    if (!r.ok){
      if (r.status===429) throw new Error("Gemini quota exceeded (HTTP 429). Using smart fallback.");
      throw new Error(`Gemini error ${r.status}`);
    }
    const data = await r.json();
    const text:string =
      data?.candidates?.[0]?.content?.parts?.map((p:any)=>p.text).join("\n") ||
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const m = text.match(/\{[\s\S]*\}/);
    const obj = m ? JSON.parse(m[0]) : {};
    const tags = Array.isArray(obj.tags) ? obj.tags :
      String(obj.tags || "").split(",").map((t:string)=>t.trim()).filter(Boolean);

    if (!obj.title || !obj.description || !tags.length) return fallback();

    return {
      title: String(obj.title).slice(0,95),
      description: String(obj.description).slice(0,480),
      tags: tags.slice(0,12)
    };
  }catch(_err){
    return fallback();
  }
}

function fallback(): GenResult{
  return {
    title:"Eye-catching Pinterest Pin Title",
    description:"A concise, keyword-rich description tailored for Pinterest search and saves. Include a benefit, a relevant keyword phrase, and a gentle call-to-action.",
    tags:["pinterest","ideas","inspiration","marketing","tips","how to","trending","shopping","branding"]
  };
}
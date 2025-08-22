// Shared helper to read keys safely in both browser (Vite) and server
export function getGeminiKey(): string {
  // Server / API routes (Node)
  if (typeof window === "undefined") {
    const k = process.env.GEMINI_API_KEY;
    if (!k) throw new Error("Missing GEMINI_API_KEY (server)");
    return k;
  }
  // Browser (Vite)
  // NOTE: Vite only exposes vars prefixed with VITE_
  // so we expect VITE_GEMINI_API_KEY to be set.
  // If you really want to keep the old name, see section D.
  // @ts-ignore - Vite injects import.meta.env at build time
  const k = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!k) throw new Error("Missing VITE_GEMINI_API_KEY (client)");
  return k;
}
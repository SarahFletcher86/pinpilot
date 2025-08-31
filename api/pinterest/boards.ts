export default async function handler(req: any, res: any) {
  try {
    // Try cookie first (OAuth), then environment variable (direct token)
    let at = req.headers.cookie?.split(";").map((c: string) => c.trim()).find((c: string) => c.startsWith("pp_at="))?.split("=")[1];

    // If no OAuth token, try direct access token from environment
    if (!at) {
      at = process.env.PINTEREST_ACCESS_TOKEN;
    }

    if (!at) return res.status(401).json({ ok: false, error: "No access token" });

    const r = await fetch("https://api.pinterest.com/v5/boards?page_size=10", {
      headers: { Authorization: `Bearer ${at}` },
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('Pinterest boards API error:', data);
      return res.status(r.status).json({ ok: false, error: data.message || data.error_description || 'Failed to fetch boards' });
    }

    res.status(200).json({ ok: true, boards: data.items || data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
}
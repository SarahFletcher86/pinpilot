export default async function handler(req: any, res: any) {
  try {
    const cookie = req.headers.cookie || "";
    const at = cookie.split(";").map((c: string) => c.trim()).find((c: string) => c.startsWith("pp_at="))?.split("=")[1];
    if (!at) return res.status(401).json({ ok: false, error: "No access token" });

    const r = await fetch("https://api.pinterest.com/v5/boards?page_size=10", {
      headers: { Authorization: `Bearer ${at}` },
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ ok: false, error: data });

    res.status(200).json({ ok: true, boards: data.items || data });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
}
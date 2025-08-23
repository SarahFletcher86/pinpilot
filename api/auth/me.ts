// Returns the Pinterest user if pp_access cookie exists
// Path: /api/auth/me

export default async function handler(req: any, res: any) {
  try {
    const cookieHeader = req.headers.cookie || "";
    const token = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("pp_access="))
      ?.split("=")[1];

    if (!token) {
      res.status(200).json({ ok: false, connected: false });
      return;
    }

    const r = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${decodeURIComponent(token)}` },
    });
    const data = await r.json();

    if (!r.ok) {
      res.status(r.status).json({ ok: false, connected: false, error: data });
      return;
    }

    res.status(200).json({ ok: true, connected: true, user: data });
  } catch (e: any) {
    res.status(500).json({ ok: false, connected: false, error: e?.message || "Unknown error" });
  }
}
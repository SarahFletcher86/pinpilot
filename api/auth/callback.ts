// /api/auth/callback.ts
export default async function handler(req: any, res: any) {
  try {
    const clientId = process.env.PINTEREST_CLIENT_ID!;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI!;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        ok: false,
        error:
          "Missing env vars. Set PINTEREST_CLIENT_ID, PINTEREST_CLIENT_SECRET, PINTEREST_REDIRECT_URI.",
      });
    }

    const code = (req.query?.code as string) || "";
    const returnedState = (req.query?.state as string) || "";
    if (!code) {
      return res.status(400).json({ ok: false, error: "Missing ?code" });
    }

    // best-effort state check (don’t block testing)
    const cookieHeader = req.headers.cookie || "";
    const savedState = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("pp_oauth_state="))
      ?.split("=")[1];
    if (savedState && returnedState && savedState !== returnedState) {
      console.warn("OAuth state mismatch (continuing for testing).");
    }

    // --- Pinterest token exchange (use Basic auth + x-www-form-urlencoded body) ---
    const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri, // must EXACTLY match the one in the Pinterest app settings
    }).toString();

    const resp = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({ ok: false, error: data });
    }

    // Success: show token so we can confirm it works
    return res.status(200).json({ ok: true, token: data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
}
// Handles Pinterest redirect back to your app and exchanges ?code for an access token
// Path: /api/auth/callback

export default async function handler(req: any, res: any) {
  try {
    const clientId = process.env.PINTEREST_CLIENT_ID;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      res.status(500).json({
        ok: false,
        error:
          "Missing env vars. Set PINTEREST_CLIENT_ID, PINTEREST_CLIENT_SECRET, PINTEREST_REDIRECT_URI.",
      });
      return;
    }

    // --- Read query params from Pinterest redirect
    const code = (req.query?.code as string) || "";
    const returnedState = (req.query?.state as string) || "";

    if (!code) {
      res.status(400).json({ ok: false, error: "Missing ?code in callback URL" });
      return;
    }

    // --- Optional: verify CSRF state from our cookie (best-effort in testing)
    const cookieHeader = req.headers.cookie || "";
    const stateCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("pp_oauth_state="));
    const savedState = stateCookie?.split("=")[1];

    if (savedState && returnedState && savedState !== returnedState) {
      res.status(400).json({ ok: false, error: "State mismatch" });
      return;
    }

    // --- Exchange code for token (Pinterest requires x-www-form-urlencoded)
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code, // must be the exact code Pinterest sent
      redirect_uri: redirectUri, // must match your Pinterest app redirect setting
      client_id: clientId,
      client_secret: clientSecret,
    }).toString();

    const tokenResp = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    // Try to parse JSON either way to reveal any useful error
    let tokenData: any = null;
    try {
      tokenData = await tokenResp.json();
    } catch {
      tokenData = { raw: await tokenResp.text() };
    }

    if (!tokenResp.ok) {
      res.status(tokenResp.status).json({ ok: false, error: tokenData });
      return;
    }

    // For now: show token JSON so we can confirm success.
    // Next step will be to store this (cookie/session/DB) and redirect back to the app.
    res.status(200).json({ ok: true, token: tokenData });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
  }
}
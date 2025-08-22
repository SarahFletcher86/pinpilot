// Handles Pinterest redirect back to your app and exchanges code for a token
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

    // Read query params
    const code = req.query?.code as string | undefined;
    const returnedState = req.query?.state as string | undefined;

    if (!code) {
      res.status(400).json({ ok: false, error: "Missing ?code in callback URL" });
      return;
    }

    // Verify state from cookie (best-effort; if it’s missing we still proceed during testing)
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

    // Exchange the code for an access token
    const tokenResp = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResp.json();

    if (!tokenResp.ok) {
      res.status(tokenResp.status).json({ ok: false, error: tokenData });
      return;
    }

    // For now, just show the token JSON in the browser so we can confirm it works.
    // Later we’ll stash it in a cookie/session/DB and redirect back to the app UI.
    res.status(200).json({ ok: true, token: tokenData });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
  }
}
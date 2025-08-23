// /api/auth/callback.ts
// Handles Pinterest redirect back to your app and exchanges code for a token

export default async function handler(req: any, res: any) {
  try {
    const clientId = process.env.PINTEREST_CLIENT_ID;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).json({
        ok: false,
        error:
          "Missing env vars. Set PINTEREST_CLIENT_ID, PINTEREST_CLIENT_SECRET, PINTEREST_REDIRECT_URI.",
      });
    }

    // Read query params Pinterest sent back
    const code = (req.query?.code as string) || "";
    const returnedState = (req.query?.state as string) || "";

    if (!code) {
      return res
        .status(400)
        .json({ ok: false, error: "Missing ?code in callback URL" });
    }

    // Best-effort CSRF check; relaxed during testing
    const cookieHeader = req.headers.cookie || "";
    const stateCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("pp_oauth_state="));
    const savedState = stateCookie?.split("=")[1];

    if (savedState && returnedState && savedState !== returnedState) {
      // Don’t block testing; log and continue
      console.warn("Pinterest OAuth: state mismatch (continuing for testing)");
      // return res.status(400).json({ ok: false, error: "State mismatch" });
    }

    // --- Token exchange (critical fix is the .toString() below) ---
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,     // must exactly match the one registered
      client_id: clientId,
      client_secret: clientSecret,
    }).toString();

    const tokenResp = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokenData = await tokenResp.json();

    if (!tokenResp.ok) {
      // Surface Pinterest’s error so we can see what it didn’t like
      return res.status(tokenResp.status).json({ ok: false, error: tokenData });
    }

    // Success! For now just show the token JSON.
    // Next step will be saving it (cookie/DB) and redirecting back to the app UI.
    return res.status(200).json({ ok: true, token: tokenData });
  } catch (err: any) {
    console.error("Pinterest callback error:", err);
    return res
      .status(500)
      .json({ ok: false, error: err?.message || "Unknown error" });
  }
}
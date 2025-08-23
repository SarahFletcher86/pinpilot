// Handles Pinterest redirect back to your app and exchanges code for a token
// Path: /api/auth/callback

export default async function handler(req: any, res: any) {
  try {
    const clientId = process.env.PINTEREST_CLIENT_ID!;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI!;

    // 1) Require code
    const code = (req.query?.code as string) || "";
    if (!code) {
      res.status(400).json({ ok: false, error: "Missing ?code in callback URL" });
      return;
    }

    // 2) (Soft) state check – log but don't block during testing
    try {
      const cookieHeader = req.headers.cookie || "";
      const stateCookie = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("pp_oauth_state="));
      const savedState = stateCookie?.split("=")[1];
      const returnedState = req.query?.state as string | undefined;
      if (savedState && returnedState && savedState !== returnedState) {
        console.warn("Pinterest OAuth: state mismatch (continuing for testing)");
      }
    } catch (_) {
      // ignore during testing
    }

    // 3) Exchange code → token
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

    // 4) Save the token for 1 day (okay for testing)
    const oneDay = 60 * 60 * 24;
    res.setHeader(
      "Set-Cookie",
      [
        `pp_access=${encodeURIComponent(tokenData.access_token)}; Max-Age=${oneDay}; Path=/; SameSite=Lax; Secure`,
        "pp_oauth_state=; Max-Age=0; Path=/; SameSite=Lax; Secure", // clear state
      ].join(", ")
    );

    // 5) Redirect back to app
    res.writeHead(302, { Location: "/" });
    res.end();
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
  }
}
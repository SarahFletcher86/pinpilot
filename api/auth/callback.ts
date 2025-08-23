// /api/auth/callback.ts
// Exchanges Pinterest ?code for an access token and shows the result.
// No DB required yet — this is just to prove the OAuth flow works end-to-end.

export default async function handler(req: any, res: any) {
  try {
    const clientId = process.env.PINTEREST_CLIENT_ID;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      res
        .status(500)
        .json({ ok: false, error: "Missing env vars (CLIENT_ID/SECRET/REDIRECT_URI)" });
      return;
    }

    // Query params from Pinterest redirect
    const code = (req.query?.code as string) || "";
    const returnedState = (req.query?.state as string) || "";

    if (!code) {
      res.status(400).json({ ok: false, error: "Missing ?code in callback URL" });
      return;
    }

    // Best-effort CSRF check: compare cookie state (if present)
    const cookieHeader = req.headers.cookie || "";
    const stateCookie = cookieHeader
      .split(";")
      .map((c: string) => c.trim())
      .find((c: string) => c.startsWith("pp_oauth_state="));
    const savedState = stateCookie?.split("=")[1];

    if (savedState && returnedState && savedState !== returnedState) {
      res.status(400).json({ ok: false, error: "State mismatch" });
      return;
    }

    // --- IMPORTANT FIX: send urlencoded body, NOT JSON ---
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenResp = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const tokenData = await tokenResp.json().catch(() => ({}));

    if (!tokenResp.ok) {
      // Show Pinterest's error payload so we can see exactly what's wrong
      res
        .status(tokenResp.status)
        .send(
          `<h1>Pinterest token error</h1><pre>${escapeHtml(
            JSON.stringify(tokenData, null, 2)
          )}</pre>`
        );
      return;
    }

    // (Optional) set a short-lived cookie so we can hit other endpoints in the same session
    // This is just for quick manual testing.
    const minutes = 15;
    res.setHeader(
      "Set-Cookie",
      `pp_access_token=${tokenData.access_token}; Max-Age=${minutes * 60}; Path=/; HttpOnly; SameSite=Lax; Secure`
    );

    // Success page with a tiny summary
    res
      .status(200)
      .send(
        `<h1>Pinterest connected ✅</h1>
         <p>Access token received. You can close this tab and go back to the app.</p>
         <details><summary>See raw response</summary><pre>${escapeHtml(
           JSON.stringify(tokenData, null, 2)
         )}</pre></details>`
      );
  } catch (err: any) {
    res.status(500).send(
      `<h1>Callback error</h1><pre>${escapeHtml(String(err?.message || err))}</pre>`
    );
  }
}

// Small helper to keep the HTML safe
function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
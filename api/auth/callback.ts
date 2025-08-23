// Handles Pinterest redirect back to your app and exchanges code for a token
// Path: /api/auth/callback  (Node runtime)

import { supabase } from "../_supabase";

export default async function handler(req: any, res: any) {
  try {
    const clientId = process.env.PINTEREST_CLIENT_ID!;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI!;

    if (!clientId || !clientSecret || !redirectUri) {
      res.status(500).json({ ok: false, error: "Missing Pinterest env vars" });
      return;
    }

    // 1) Read code/state returned by Pinterest
    const code = (req.query?.code as string) || "";
    const returnedState = (req.query?.state as string) || "";

    if (!code) {
      res.status(400).json({ ok: false, error: "Missing ?code in callback URL" });
      return;
    }

    // (best-effort) CSRF check: compare with cookie we set in /api/auth/start
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

    // 2) Exchange code for tokens
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

    const accessToken = tokenData.access_token as string;
    const refreshToken = tokenData.refresh_token as string | undefined;
    const expiresIn = Number(tokenData.expires_in ?? 0);

    // 3) Fetch the user account so we can store a stable id
    const meResp = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meResp.json();
    if (!meResp.ok) {
      res.status(meResp.status).json({ ok: false, error: me });
      return;
    }

    const pinterest_user_id =
      (me.id as string) ||
      (me.username as string) ||
      (me?.profile?.id as string) ||
      "";

    // 4) Upsert into Supabase (by pinterest_user_id)
    const expiresAtIso =
      expiresIn > 0 ? new Date(Date.now() + expiresIn * 1000).toISOString() : null;

    // Check if exists
    const { data: existing, error: findErr } = await supabase
      .from("users")
      .select("id")
      .eq("pinterest_user_id", pinterest_user_id)
      .limit(1)
      .maybeSingle();

    if (findErr) {
      res.status(500).json({ ok: false, error: findErr.message });
      return;
    }

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from("users")
        .update({
          pinterest_access_token: accessToken,
          pinterest_refresh_token: refreshToken ?? null,
          token_expires_at: expiresAtIso,
        })
        .eq("id", existing.id);

      if (updErr) {
        res.status(500).json({ ok: false, error: updErr.message });
        return;
      }
    } else {
      const { error: insErr } = await supabase.from("users").insert({
        email: null, // Pinterest trial doesn’t provide email
        plan: "free",
        pinterest_user_id,
        pinterest_access_token: accessToken,
        pinterest_refresh_token: refreshToken ?? null,
        token_expires_at: expiresAtIso,
      });
      if (insErr) {
        res.status(500).json({ ok: false, error: insErr.message });
        return;
      }
    }

    // 5) Show a simple success page
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`
      <!doctype html>
      <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Pinterest Connected</title>
          <style>
            body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:40px;background:#f8fafc;color:#0f172a}
            .card{background:#fff;border:1px solid #e2e8f0;border-radius:14px;max-width:520px;padding:24px}
            .btn{display:inline-block;margin-top:14px;padding:10px 14px;border-radius:10px;border:1px solid #cbd5e1;text-decoration:none}
          </style>
        </head>
        <body>
          <div class="card">
            <h2>✅ Pinterest connected</h2>
            <p>Your Pin Pilot account is now linked.</p>
            <a class="btn" href="/">Back to app</a>
          </div>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
  }
}
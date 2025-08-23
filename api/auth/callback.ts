import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE as string
);

export default async function handler(req: any, res: any) {
  try {
    const clientId = process.env.PINTEREST_CLIENT_ID!;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET!;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI!;

    const code = req.query?.code as string | undefined;
    if (!code) return res.status(400).json({ ok: false, error: "Missing code" });

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
    if (!tokenResp.ok) return res.status(tokenResp.status).json({ ok: false, error: tokenData });

    const accessToken = tokenData.access_token as string;
    const refreshToken = tokenData.refresh_token as string | undefined;
    const expiresIn = tokenData.expires_in as number | undefined;

    // Who is the user?
    const meResp = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const me = await meResp.json();
    const pinterestUserId = me?.username || me?.id || null;

    await supabase.from("users").upsert(
      {
        pinterest_user_id: pinterestUserId,
        plan: "free",
        pinterest_access_token: accessToken,
        pinterest_refresh_token: refreshToken || null,
        token_expires_at: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : null,
      },
      { onConflict: "pinterest_user_id" }
    );

    // short-lived cookie so we can call the API
    res.setHeader("Set-Cookie", [`pp_at=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600; Secure`]);

    res.writeHead(302, { Location: "/?connected=1" });
    res.end();
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || "Unknown error" });
  }
}
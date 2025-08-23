// /api/auth/callback.ts
// Handles Pinterest redirect → exchanges code → saves tokens to Supabase

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

function html(body: string) {
  return `<!doctype html><meta charset="utf-8" />
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:32px;line-height:1.4}
  code{background:#f4f4f5;padding:2px 6px;border-radius:6px}</style>
  ${body}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // --- Env needed on the server ---
    const {
      PINTEREST_CLIENT_ID,
      PINTEREST_CLIENT_SECRET,
      PINTEREST_REDIRECT_URI,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE,
    } = process.env;

    if (
      !PINTEREST_CLIENT_ID ||
      !PINTEREST_CLIENT_SECRET ||
      !PINTEREST_REDIRECT_URI ||
      !SUPABASE_URL ||
      !SUPABASE_SERVICE_ROLE
    ) {
      res
        .status(500)
        .send(
          html(
            `<h1>Setup error</h1><p>Missing one or more server env vars.
            Make sure these exist in Vercel:</p>
            <ul>
              <li><code>PINTEREST_CLIENT_ID</code></li>
              <li><code>PINTEREST_CLIENT_SECRET</code></li>
              <li><code>PINTEREST_REDIRECT_URI</code></li>
              <li><code>SUPABASE_URL</code></li>
              <li><code>SUPABASE_SERVICE_ROLE</code></li>
            </ul>`
          )
        );
      return;
    }

    // --- Required query param from Pinterest ---
    const code = (req.query?.code as string) || "";
    const returnedState = (req.query?.state as string) || "";

    if (!code) {
      res
        .status(400)
        .send(
          html(
            `<h1>Missing code</h1><p>Pinterest did not send an authorization <code>code</code>.</p>`
          )
        );
      return;
    }

    // --- Best-effort CSRF check (don’t block if cookie missing while testing) ---
    try {
      const cookieHeader = req.headers.cookie || "";
      const stateCookie = cookieHeader
        .split(";")
        .map((c) => c.trim())
        .find((c) => c.startsWith("pp_oauth_state="));
      const savedState = stateCookie?.split("=")[1];
      if (savedState && returnedState && savedState !== returnedState) {
        res.status(400).send(html(`<h1>State mismatch</h1>`));
        return;
      }
    } catch {
      // ignore during testing
    }

    // --- Exchange code for token ---
    const tokenResp = await fetch("https://api.pinterest.com/v5/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: PINTEREST_REDIRECT_URI,
        client_id: PINTEREST_CLIENT_ID,
        client_secret: PINTEREST_CLIENT_SECRET,
      }),
    });

    const tokenData = (await tokenResp.json()) as any;

    if (!tokenResp.ok) {
      res
        .status(tokenResp.status)
        .send(
          html(
            `<h1>Pinterest token error</h1><pre>${JSON.stringify(
              tokenData,
              null,
              2
            )}</pre>`
          )
        );
      return;
    }

    const accessToken = tokenData.access_token as string;
    const refreshToken = (tokenData.refresh_token as string) || "";
    const expiresIn = (tokenData.expires_in as number) || 3600;

    // --- Fetch Pinterest user account (to get a stable id) ---
    const acctResp = await fetch("https://api.pinterest.com/v5/user_account", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const account = (await acctResp.json()) as any;

    if (!acctResp.ok) {
      res
        .status(acctResp.status)
        .send(
          html(
            `<h1>Pinterest account error</h1><pre>${JSON.stringify(
              account,
              null,
              2
            )}</pre>`
          )
        );
      return;
    }

    const pinterestUserId =
      (account.id as string) ||
      (account.username as string) ||
      (account.user_id as string) ||
      "";

    if (!pinterestUserId) {
      res
        .status(500)
        .send(
          html(
            `<h1>Could not determine Pinterest user id</h1><pre>${JSON.stringify(
              account,
              null,
              2
            )}</pre>`
          )
        );
      return;
    }

    // --- Save to Supabase (upsert by pinterest_user_id) ---
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Ensure you created a unique index:
    // CREATE UNIQUE INDEX IF NOT EXISTS users_pu_idx ON users(pinterest_user_id);
    const { error } = await supabase.from("users").upsert(
      {
        pinterest_user_id: pinterestUserId,
        pinterest_access_token: accessToken,
        pinterest_refresh_token: refreshToken,
        token_expires_at: tokenExpiresAt,
      },
      { onConflict: "pinterest_user_id" }
    );

    if (error) {
      res
        .status(500)
        .send(
          html(
            `<h1>Supabase error</h1><pre>${JSON.stringify(error, null, 2)}</pre>`
          )
        );
      return;
    }

    // --- Success page ---
    res
      .status(200)
      .send(
        html(
          `<h1>Connected ✅</h1>
           <p>Your Pinterest account is linked.</p>
           <p><strong>User:</strong> <code>${pinterestUserId}</code></p>
           <p><a href="/">Return to Pin Pilot</a></p>`
        )
      );
  } catch (err: any) {
    res
      .status(500)
      .send(html(`<h1>Callback failed</h1><pre>${err?.message || err}</pre>`));
  }
}
import type { VercelRequest, VercelResponse } from '@vercel/node';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query;
  if (!code) return res.status(400).send("Missing code");

  try {
    const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: process.env.PINTEREST_REDIRECT_URI!,
        client_id: process.env.PINTEREST_CLIENT_ID!,
        client_secret: process.env.PINTEREST_CLIENT_SECRET!,
      })
    });

    const data = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(data.message || 'OAuth failed');

    // Save into Supabase
    const email = state; // you can pass email in `state` param
    await supabase
      .from('users')
      .update({
        pinterest_access_token: data.access_token,
        pinterest_refresh_token: data.refresh_token,
        token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
      })
      .eq('email', email);

    res.redirect(`${process.env.APP_BASE_URL}/?connected=1`);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
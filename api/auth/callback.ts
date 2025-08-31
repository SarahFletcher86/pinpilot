// api/auth/callback.ts
function html(msg: string) {
  return `<!doctype html><html><body style="font-family:system-ui;padding:24px">
  <h1>Pinterest token</h1><pre>${msg}</pre>
  <p>You can close this tab and return to Pin Pilot.</p>
</body></html>`;
}

export default async function handler(req: any, res: any) {
  try {
    const { code, state } = req.query || {};
    if (!code) { res.status(400).send(html('Missing ?code in callback URL')); return; }

    const redirect_uri = process.env.PINTEREST_REDIRECT_URI!;
    const r = await fetch(`${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}/api/auth/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri })
    });
    const data = await r.json();
    const pretty = JSON.stringify(data, null, 2);

    // Check if the token exchange failed
    if (!r.ok || data.error) {
      console.error('Token exchange failed:', data);
      res.status(500).send(html(`Token exchange failed: ${data.error_description || data.error || 'Unknown error'}\n\n${pretty}`));
      return;
    }

    // Optionally, bounce back to your front-end with tokens in hash (not query)
    const base = process.env.APP_BASE_URL || `https://${req.headers.host}`;
    const redirect = `${base}/#pinterest_oauth=${encodeURIComponent(Buffer.from(pretty).toString('base64'))}`;
    res.status(200).send(html(pretty + `\n\nRedirecting...\n<script>setTimeout(()=>location.replace(${JSON.stringify(redirect)}),800);</script>`));
  } catch (e: any) {
    res.status(500).send(html(`Error: ${e?.message || 'Unknown'}`));
  }
}
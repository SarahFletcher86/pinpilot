// api/auth/callback.ts
function html(msg: string) {
  return `<!doctype html><html><body style="font-family:system-ui;padding:24px">
  <h1>Pinterest token</h1><pre>${msg}</pre>
  <p>You can close this tab and return to Pin Pilot.</p>
</body></html>`;
}

export default async function handler(req: any, res: any) {
  try {
    console.log('Pinterest OAuth callback received');
    console.log('Query params:', req.query);
    console.log('Headers:', req.headers);

    const { code, state } = req.query || {};
    if (!code) {
      console.error('Missing authorization code in callback');
      res.status(400).send(html('Missing ?code in callback URL'));
      return;
    }

    // Use the configured redirect URI (production for Vercel, localhost for local)
    const redirect_uri = process.env.PINTEREST_REDIRECT_URI!;
    console.log('Using redirect URI:', redirect_uri);
    const r = await fetch(`${req.headers['x-forwarded-proto'] ?? 'https'}://${req.headers.host}/api/auth/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, redirect_uri })
    });
    // Handle potential HTML error responses from Pinterest
    const responseText = await r.text();
    console.log('Token exchange response (first 500 chars):', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse token exchange response as JSON:', parseError);

      // Try to extract useful error information from HTML
      let errorMessage = 'Pinterest OAuth failed';
      if (responseText.includes('trial')) {
        errorMessage = 'Pinterest app is in trial mode. Request production access.';
      } else if (responseText.includes('redirect_uri')) {
        errorMessage = 'Redirect URI mismatch in Pinterest app settings.';
      } else if (responseText.includes('Request Error')) {
        errorMessage = 'Pinterest rejected OAuth request. App needs production approval.';
      }

      res.status(500).send(html(`${errorMessage}\n\nRaw response: ${responseText.substring(0, 300)}`));
      return;
    }

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
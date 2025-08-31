// api/auth/generate.ts
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method Not Allowed' }); return;
    }
    const { code, redirect_uri } = req.body || {};
    if (!code) {
      res.status(400).json({ message: 'Missing authorization code' }); return;
    }

    // Use the configured redirect URI
    const final_redirect_uri = redirect_uri || process.env.PINTEREST_REDIRECT_URI;
    if (!final_redirect_uri) {
      res.status(400).json({ message: 'Missing redirect_uri configuration' }); return;
    }

    const client_id = process.env.PINTEREST_CLIENT_ID;
    const client_secret = process.env.PINTEREST_CLIENT_SECRET;

    if (!client_id || !client_secret) {
      console.error('Missing Pinterest environment variables');
      res.status(500).json({ message: 'Pinterest API not configured' });
      return;
    }

    const tokenUrl = 'https://api.pinterest.com/v5/oauth/token';

    console.log('Pinterest token exchange request:', {
      tokenUrl,
      code: code.substring(0, 10) + '...', // Don't log full code
      redirect_uri: final_redirect_uri,
      client_id: client_id.substring(0, 10) + '...', // Don't log full client_id
      has_client_secret: !!client_secret
    });

    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: final_redirect_uri,
        client_id,
        client_secret
      })
    });

    const data = await r.json();
    if (!r.ok) { res.status(r.status).json(data); return; }
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
}
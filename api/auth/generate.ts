// api/auth/generate.ts
export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method Not Allowed' }); return;
    }
    const { code, redirect_uri } = req.body || {};
    if (!code || !redirect_uri) {
      res.status(400).json({ message: 'Missing code or redirect_uri' }); return;
    }

    const client_id = process.env.PINTEREST_CLIENT_ID!;
    const client_secret = process.env.PINTEREST_CLIENT_SECRET!;
    const tokenUrl = 'https://api.pinterest.com/v5/oauth/token';

    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
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
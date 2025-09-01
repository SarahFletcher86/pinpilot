// api/auth/generate.ts
export default async function handler(req: any, res: any) {
  try {
    console.log('Pinterest token exchange request received');
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);

    if (req.method !== 'POST') {
      res.status(405).json({ message: 'Method Not Allowed' }); return;
    }
    const { code, redirect_uri } = req.body || {};
    if (!code) {
      console.error('Missing authorization code in request body');
      res.status(400).json({ message: 'Missing authorization code' }); return;
    }

    const client_id = process.env.PINTEREST_CLIENT_ID;
    const client_secret = process.env.PINTEREST_CLIENT_SECRET;

    // Use the configured redirect URI
    const final_redirect_uri = redirect_uri || process.env.PINTEREST_REDIRECT_URI;
    console.log('Final redirect URI:', final_redirect_uri);

    // Validate that we have all required parameters
    if (!client_id || !client_secret) {
      console.error('Missing Pinterest credentials');
      res.status(500).json({ message: 'Pinterest credentials not configured' });
      return;
    }

    if (!final_redirect_uri) {
      console.error('No redirect URI configured');
      res.status(500).json({ message: 'Redirect URI not configured' });
      return;
    }

    const tokenUrl = 'https://api.pinterest.com/v5/oauth/token';

    console.log('Pinterest token exchange request details:');
    console.log('- Token URL:', tokenUrl);
    console.log('- Code length:', code.length);
    console.log('- Redirect URI:', final_redirect_uri);
    console.log('- Client ID starts with:', client_id.substring(0, 5));
    console.log('- Has client secret:', !!client_secret);

    // Create the request body - include continuous_refresh as recommended by Pinterest
    const requestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: final_redirect_uri,
      client_id: client_id,
      client_secret: client_secret,
      continuous_refresh: 'true'  // Recommended by Pinterest API docs
    });

    console.log('Request body string:', requestBody.toString());

    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: requestBody
    });

    console.log('Pinterest API response status:', r.status);
    console.log('Pinterest API response headers:', Object.fromEntries(r.headers.entries()));

    // Get response as text first to handle potential HTML error pages
    const responseText = await r.text();
    console.log('Pinterest API response text (first 500 chars):', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Pinterest response as JSON:', parseError);
      console.error('Raw response:', responseText);
      return res.status(500).json({
        error: 'Invalid response from Pinterest',
        details: responseText.substring(0, 200)
      });
    }

    if (!r.ok) {
      console.error('Pinterest API error:', data);
      return res.status(r.status).json(data);
    }

    console.log('Pinterest token exchange successful!');
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
}
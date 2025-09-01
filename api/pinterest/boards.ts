export default async function handler(req: any, res: any) {
  try {
    // Get access token from cookie (set by OAuth flow)
    const at = req.headers.cookie?.split(";").map((c: string) => c.trim()).find((c: string) => c.startsWith("pp_at="))?.split("=")[1];

    if (!at) {
      console.log('No access token found in cookie - user needs to authenticate first');
      return res.status(401).json({ ok: false, error: "Not authenticated with Pinterest" });
    }

    console.log('Making Pinterest API request with token starting with:', at.substring(0, 10) + '...');

    const r = await fetch("https://api.pinterest.com/v5/boards?page_size=10", {
      headers: { Authorization: `Bearer ${at}` },
    });

    console.log('Pinterest API response status:', r.status);
    console.log('Pinterest API response headers:', Object.fromEntries(r.headers.entries()));

    let responseText;
    let data;

    try {
      responseText = await r.text();
      console.log('Pinterest API response text (first 200 chars):', responseText.substring(0, 200));

      data = JSON.parse(responseText);
      if (!r.ok) {
        console.error('Pinterest boards API error:', data);
        return res.status(r.status).json({ ok: false, error: data.message || data.error_description || 'Failed to fetch boards' });
      }

      // Success response
      res.status(200).json({ ok: true, boards: data.items || data });
    } catch (parseError) {
      console.error('Failed to parse Pinterest API response as JSON:', parseError);
      console.error('Raw response:', responseText);
      return res.status(500).json({ ok: false, error: 'Invalid response from Pinterest API' });
    }
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
}
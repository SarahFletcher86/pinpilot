// api/cron/run.ts
import { admin } from '../_supabase'

async function postToPinterest(token: string, payload: any) {
  const r = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  const json = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(json));
  return json;
}

export default async function handler(req: any, res: any) {
  try {
    // Optional protection using CRON_SECRET header
    const expected = process.env.CRON_SECRET;
    if (expected) {
      const got = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
      if (got !== expected) { res.status(401).json({ message: 'Unauthorized' }); return; }
    }

    const sb = admin();
    const now = new Date().toISOString();

    const { data: due, error } = await sb
      .from('schedules')
      .select('id, board_id, title, description, link, media_url, scheduled_at, status, pinterest_access_token')
      .eq('status', 'queued')
      .lte('scheduled_at', now)
      .limit(25);

    if (error) { res.status(500).json({ message: error.message }); return; }

    const results: any[] = [];
    for (const item of due || []) {
      try {
        const token = (item as any).pinterest_access_token || ''; // if you stored per-record
        if (!token) throw new Error('Missing pinterest_access_token');
        const payload: any = {
          board_id: item.board_id,
          title: item.title,
          description: item.description,
          link: item.link || undefined,
          media_source: item.media_url.startsWith('data:image')
            ? { source_type: 'image_base64', content_type: 'image/jpeg', data: item.media_url.split(',')[1] }
            : { source_type: 'image_url', url: item.media_url }
        };
        await postToPinterest(token, payload);
        await sb.from('schedules').update({ status: 'posted' }).eq('id', item.id);
        results.push({ id: item.id, ok: true });
      } catch (err: any) {
        await sb.from('schedules').update({ status: 'failed', error: String(err?.message || err) }).eq('id', item.id);
        results.push({ id: item.id, ok: false, error: String(err?.message || err) });
      }
    }

    res.status(200).json({ processed: results.length, results });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
}
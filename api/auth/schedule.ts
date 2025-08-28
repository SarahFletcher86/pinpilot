// api/auth/schedule.ts
import { admin } from '../_supabase'

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'POST') { res.status(405).json({ message: 'Method Not Allowed' }); return; }
    const {
      pinterestAccessToken,
      boardId, title, description,
      imageBase64, scheduledAt, link
    } = req.body || {};

    if (!pinterestAccessToken || !boardId || !title || !description || !imageBase64 || !scheduledAt) {
      res.status(400).json({ message: 'Missing required fields' }); return;
    }

    const sb = admin();
    // Store the image somewhere public; for now, stash the base64 in table (ok for MVP).
    const { data, error } = await sb.from('schedules').insert({
      user_id: null, // if you have user auth, set it here
      board_id: boardId,
      title, description, link: link || null,
      media_url: imageBase64, // could be a storage URL in the future
      scheduled_at: scheduledAt,
      status: 'queued'
    }).select().single();

    if (error) { res.status(500).json({ message: error.message }); return; }
    res.status(200).json({ message: 'Scheduled!', id: data.id });
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Server error' });
  }
}
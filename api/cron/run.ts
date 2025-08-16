import type { VercelRequest, VercelResponse } from '@vercel/node'
import { admin } from '../_supabase'

async function postPin(token: string, payload: any) {
  const r = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(JSON.stringify(data))
  return data
}

function payloadForMedia(board_id: string, title: string, description: string, link: string | null, media: string) {
  // If it's a data URL, switch to image_base64
  if (media.startsWith('data:image/')) {
    const [, mimeAndData] = media.split(':') // "image/png;base64,AAAA..."
    const [mimePart, b64] = mimeAndData.split(',')
    const contentType = mimePart.replace(';base64', '') // e.g., "image/png"
    return {
      board_id,
      title,
      description,
      link: link || undefined,
      media_source: { source_type: 'image_base64', content_type: contentType, data: b64 },
    }
  }
  // Otherwise assume it's a real URL
  return {
    board_id,
    title,
    description,
    link: link || undefined,
    media_source: { source_type: 'image_url', url: media },
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sb = admin()
  const now = new Date().toISOString()

  // Join schedules with users to get the Pinterest token
  const { data: due, error } = await sb
    .from('schedules')
    .select('id,user_id,board_id,title,description,link,media_url,scheduled_at,status, users!inner(pinterest_access_token)')
    .eq('status', 'queued')
    .lte('scheduled_at', now)
    .limit(20)

  if (error) return res.status(500).send(error.message)

  const results: any[] = []
  for (const item of due || []) {
    try {
      const token = (item as any).users.pinterest_access_token
      const payload = payloadForMedia(item.board_id, item.title, item.description, item.link, item.media_url)
      await postPin(token, payload)
      await sb.from('schedules').update({ status: 'posted' }).eq('id', item.id)
      results.push({ id: item.id, ok: true })
    } catch (err: any) {
      await sb.from('schedules').update({ status: 'failed', error: String(err.message || err) }).eq('id', item.id)
      results.push({ id: item.id, ok: false, error: String(err.message || err) })
    }
  }

  res.status(200).json({ processed: results.length, results })
}

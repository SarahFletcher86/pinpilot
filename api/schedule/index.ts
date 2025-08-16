import type { VercelRequest, VercelResponse } from '@vercel/node'
import { admin } from '../_supabase'

export default async function handler(req: VercelRequest, res: VercelResponse){
  if(req.method !== 'POST') return res.status(405).end('Method not allowed')
  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  const sb = admin()
  // Simplified: use latest pro user row
  const { data: user } = await sb.from('users').select('*').order('created_at', { ascending:false }).limit(1).maybeSingle()
  if(!user || user.plan !== 'pro') return res.status(401).send('Pro required')

  const { data, error } = await sb.from('schedules').insert({
    user_id: user.id,
    board_id: body.board_id,
    title: body.title,
    description: body.description,
    link: body.link || null,
    media_url: body.media_url,
    scheduled_at: body.scheduled_at
  }).select().single()
  if(error) return res.status(400).send(error.message)
  res.status(200).json({ ok:true, id: data.id })
}
import type { VercelRequest, VercelResponse } from '@vercel/node'
import fetch from 'node-fetch'
import { admin } from '../_supabase'

export default async function handler(req: VercelRequest, res: VercelResponse){
  const { code, state } = req.query as any
  const cookies = (req.headers.cookie||'').split(';').reduce((a,c)=>{ const [k,v] = c.trim().split('='); a[k]=v; return a },{} as any)
  if(!code || !state || cookies.pp_state !== state) return res.status(400).send('Invalid state')

  const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token',{
    method:'POST',
    headers:{ 'Content-Type':'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:'authorization_code',
      code: String(code),
      redirect_uri: process.env.PINTEREST_REDIRECT_URI!,
      client_id: process.env.PINTEREST_CLIENT_ID!,
      client_secret: process.env.PINTEREST_CLIENT_SECRET!
    })
  })
  const tokens = await tokenRes.json() as any
  if(!tokenRes.ok) return res.status(400).send(JSON.stringify(tokens))

  // Optionally fetch Pinterest user id
  const meRes = await fetch('https://api.pinterest.com/v5/user_account',{
    headers:{ Authorization:`Bearer ${tokens.access_token}` }
  })
  const me = await meRes.json()

  const sb = admin()
  const { data: user } = await sb.from('users').insert({
    email: null,
    plan: 'pro',
    pinterest_user_id: me?.username || me?.id || null,
    pinterest_access_token: tokens.access_token,
    pinterest_refresh_token: tokens.refresh_token,
    token_expires_at: new Date(Date.now() + (tokens.expires_in||3600)*1000).toISOString()
  }).select().single()

  res.setHeader('Set-Cookie', 'pp_state=; Max-Age=0; Path=/')
  res.writeHead(302, { Location: `${process.env.APP_BASE_URL}/?connected=1` })
  res.end()
}
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse){
  // generate a CSRF state
  const state = Math.random().toString(36).slice(2)
  const params = new URLSearchParams({
    client_id: process.env.PINTEREST_CLIENT_ID!,
    redirect_uri: process.env.PINTEREST_REDIRECT_URI!,
    response_type: 'code',
    scope: 'boards:read,pins:read,pins:write',
    state
  })
  // store state in a cookie
  res.setHeader('Set-Cookie', `pp_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax`)
  const url = `https://www.pinterest.com/oauth/?${params.toString()}`
  res.status(200).json({ url })
}
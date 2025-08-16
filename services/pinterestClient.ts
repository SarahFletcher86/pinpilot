export async function api(path: string, opts: RequestInit = {}){
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers||{}) },
    ...opts
  })
  if(!res.ok){
    const text = await res.text()
    throw new Error(text || `API ${path} failed`)
  }
  return res.json()
}
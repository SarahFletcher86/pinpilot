// Starts the Pinterest OAuth flow
// Path: /api/auth/start

const SCOPES = [
  "boards:read",
  "pins:read",
  "pins:write",
  "user_accounts:read",
].join(",");

function randomState(len = 24) {
  const chars =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default async function handler(req: any, res: any) {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const redirectUri = process.env.PINTEREST_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    res
      .status(500)
      .send(
        "Missing env vars. Set PINTEREST_CLIENT_ID and PINTEREST_REDIRECT_URI."
      );
    return;
  }

  // Use production URI for Vercel deployment, localhost for local development
  const demoRedirectUri = process.env.PINTEREST_REDIRECT_URI;

  // CSRF protection: store a random state in a cookie and pass it to Pinterest
  const state = randomState();
  res.setHeader(
    "Set-Cookie",
    `pp_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure`
  );

  const authUrl =
    "https://www.pinterest.com/oauth/?" +
    new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: demoRedirectUri,
      scope: SCOPES,
      state,
    }).toString();

  res.writeHead(302, { Location: authUrl });
  res.end();
}
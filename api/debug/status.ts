export default async function handler(req, res) {
  res.status(200).json({
    ok: true,
    environment: process.env.VERCEL ? "vercel" : "local",
    has_GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    has_PINTEREST_CLIENT_ID: !!process.env.PINTEREST_CLIENT_ID,
    has_PINTEREST_CLIENT_SECRET: !!process.env.PINTEREST_CLIENT_SECRET,
    has_PINTEREST_REDIRECT_URI: !!process.env.PINTEREST_REDIRECT_URI,
  });
}
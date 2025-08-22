export default function handler(req: any, res: any) {
  const s = process.env;
  res.status(200).json({
    ok: true,
    serverEnv: {
      PINTEREST_CLIENT_ID: !!s.PINTEREST_CLIENT_ID,
      PINTEREST_CLIENT_SECRET: !!s.PINTEREST_CLIENT_SECRET,
      PINTEREST_REDIRECT_URI: !!s.PINTEREST_REDIRECT_URI,
      VITE_GEMINI_API_KEY: !!s.VITE_GEMINI_API_KEY || !!s.GEMINI_API_KEY,
    },
  });
}
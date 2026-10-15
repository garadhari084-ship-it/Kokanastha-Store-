export default function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const envUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
      const envKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
      return res.status(200).json({ url: envUrl, key: envKey });
    }
    if (req.method === 'POST') {
      const { url, key } = req.body || {};
      process.env.VITE_SUPABASE_URL = (url || '').trim();
      process.env.VITE_SUPABASE_ANON_KEY = (key || '').trim();
      return res.status(200).json({ success: true });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

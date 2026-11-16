// GET /api/gatos -> devolve a lista publicada (guardada no Vercel Blob)
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=10');
  try {
    const { blobs } = await list({ prefix: 'gatos.json', limit: 1 });
    if (!blobs.length) return res.status(404).json({ erro: 'ainda não publicado' });
    const r = await fetch(blobs[0].url + '?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return res.status(502).json({ erro: 'falha ao ler a lista' });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(await r.text());
  } catch (e) {
    return res.status(500).json({ erro: 'erro interno' });
  }
}

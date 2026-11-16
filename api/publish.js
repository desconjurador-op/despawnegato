// POST /api/publish -> grava a lista no Vercel Blob (precisa da senha ADMIN_KEY)
import { put } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

const igual = (a, b) => {
  const A = Buffer.from(String(a || '')), B = Buffer.from(String(b || ''));
  return A.length === B.length && timingSafeEqual(A, B);
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ erro: 'use POST' });

  const chave = process.env.ADMIN_KEY;
  if (!chave) return res.status(500).json({ erro: 'ADMIN_KEY não configurada na Vercel' });
  let enviada = '';
  try { enviada = decodeURIComponent(req.headers['x-admin-key'] || ''); } catch (e) {}
  if (!igual(enviada, chave)) return res.status(401).json({ erro: 'senha errada' });

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object' || !Array.isArray(b.gatos) || b.gatos.length > 6000)
    return res.status(400).json({ erro: 'formato inválido' });

  const gatos = [];
  for (const g of b.gatos) {
    if (!Array.isArray(g) || g.length < 4) return res.status(400).json({ erro: 'gato inválido' });
    const [nome, cor, tipo, listrado] = g;
    if (nome !== null && (typeof nome !== 'string' || nome.length > 30))
      return res.status(400).json({ erro: 'nome inválido' });
    if (!Number.isInteger(cor) || cor < 0 || cor > 5 || !'nbgjr'.includes(String(tipo)) || String(tipo).length !== 1)
      return res.status(400).json({ erro: 'dados de gato inválidos' });
    gatos.push([nome, cor, tipo, listrado ? 1 : 0]);
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    return res.status(500).json({ erro: 'BLOB_READ_WRITE_TOKEN ausente: conecte o Blob ao projeto e faça um novo deploy' });
  const mundo = typeof b.mundo === 'string' ? b.mundo.trim().slice(0, 40) : '';

  const texto = '{\n"mundo": ' + JSON.stringify(mundo || 'Qual o nome deste mundo?') +
    ',\n"gatos": [\n' + gatos.map(x => JSON.stringify(x)).join(',\n') + '\n]\n}\n';
  try {
    await put('gatos.json', texto, {
      access: 'public', addRandomSuffix: false, allowOverwrite: true,
      contentType: 'application/json', cacheControlMaxAge: 60,
    });
    return res.status(200).json({ ok: true, gatos: gatos.length });
  } catch (e) {
    return res.status(500).json({ erro: 'não consegui gravar: ' + String((e && e.message) || e).slice(0, 160) });
  }
      }

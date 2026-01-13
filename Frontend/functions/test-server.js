/* functions/test-server.js - server di test per upload a Supabase (Node/Express) */
const express = require('express');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 3000;
const upload = multer({ storage: multer.memoryStorage() });

// CORS semplice
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html;charset=utf-8');
  res.send(`<h2>Test upload proxy</h2>
<form method="post" enctype="multipart/form-data" action="/upload">
  <input type="file" name="file" />
  <button type="submit">Invia</button>
</form>`);
});

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'no file' });

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'uploads';

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ error: 'missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env' });
    }

    const safeName = (req.file.originalname || 'file')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_.-]/g, '');
    const path = `uploads/${Date.now()}_${safeName}`;

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encodeURIComponent(path)}`;

    const fetchRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE}`,
        apikey: SERVICE_ROLE,
        'Content-Type': req.file.mimetype || 'application/octet-stream',
      },
      body: req.file.buffer,
    });

    const text = await fetchRes.text();
    if (!fetchRes.ok) {
      return res.status(500).json({ error: 'upload failed', status: fetchRes.status, detail: text });
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodeURIComponent(path)}`;
    return res.json({ url: publicUrl, path, status: fetchRes.status, detail: text });
  } catch (err) {
    console.error('upload error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(port, () => {
  console.log(`Test server listening on http://localhost:${port}`);
});

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors({ origin: true })); // in sviluppo; in produzione limita gli origin
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const UPLOAD_BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'public';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// --- Auth endpoints (proxy)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email/password required' });
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return res.status(400).json({ error: result.error.message });
    return res.json(result.data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email/password required' });
  try {
    const result = await supabase.auth.signUp({ email, password });
    if (result.error) return res.status(400).json({ error: result.error.message });
    return res.json(result.data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// Get current user using bearer token issued to client
app.get('/api/auth/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  try {
    if (!authHeader) return res.status(401).json({ error: 'Missing Authorization' });
    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// --- File upload (multipart) -> Supabase storage
const upload = multer({ storage: multer.memoryStorage() });
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file' });
    const filename = `${Date.now()}-${req.file.originalname}`;
    const { error } = await supabase.storage
      .from(UPLOAD_BUCKET)
      .upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (error) return res.status(500).json({ error: error.message });
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${UPLOAD_BUCKET}/${filename}`;
    return res.json({ url: publicUrl });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

// --- Example: simple read from table "items"
app.get('/api/items', async (req, res) => {
  try {
    const { data, error } = await supabase.from('items').select('*');
    if (error) return res.status(400).json({ error: error.message });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
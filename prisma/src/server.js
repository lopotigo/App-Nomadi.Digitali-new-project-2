import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Permette sovrascrivere il percorso frontend con una variabile d'ambiente (opzionale)
const envFrontend = process.env.FRONTEND_PATH;

const candidates = [
  envFrontend ? path.resolve(envFrontend) : null,
  path.join(__dirname, '..', 'frontend', 'dist'),
  path.join(__dirname, '..', 'frontend', 'build'),
  path.join(__dirname, '..', 'Frontend'),
  path.join(__dirname, '..', 'frontend'),
  path.join(__dirname, '..', '..', 'Frontend'),
  path.join(__dirname, '..', '..', 'frontend'),
  path.join(__dirname, '..', '..', 'frontend', 'dist'),
  path.join(__dirname, '..', '..', 'frontend', 'build')
].filter(Boolean);

let frontendBuildPath = null;
for (const p of candidates) {
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
    frontendBuildPath = p;
    break;
  }
}

app.use(express.json());
app.use(cors());

// Logging semplice per le richieste
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Endpoint che espone le variabili pubbliche al frontend come script JS
app.get('/env.js', (req, res) => {
  const publicEnv = {
    VITE_API_PLACES_ENDPOINT: process.env.VITE_API_PLACES_ENDPOINT || '',
    VITE_API_BOOKINGS_ENDPOINT: process.env.VITE_API_BOOKINGS_ENDPOINT || '',
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || ''
  };
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.send(`window.__env = ${JSON.stringify(publicEnv)};`);
});

if (frontendBuildPath) {
  console.log('Serving frontend from:', frontendBuildPath);

  // Serve static files e forza MIME per estensioni comuni
  app.use(express.static(frontendBuildPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.js') {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (ext === '.mjs') {
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      } else if (ext === '.css') {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (ext === '.wasm') {
        res.setHeader('Content-Type', 'application/wasm');
      } else if (ext === '.json') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (ext === '.svg') {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
      } else if (ext === '.map') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      // altrimenti lascia che express decida
    }
  }));

  // log risultato delle risposte (utile per debug)
  app.use((req, res, next) => {
    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${res.getHeader('Content-Type') || ''}`);
    });
    next();
  });

  // fallback sicuro: se la richiesta è per /api/* -> 404 (non trovato qui)
  // se la richiesta sembra un asset (ha estensione) e non è stato servito -> 404
  // altrimenti -> invia index.html (SPA)
  app.use((req, res) => {
    // API routes non gestite qui
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }

    // Se la richiesta ha un'estensione (es. .js, .css, .tsx, .map, ecc.) considerala asset.
    // In questo caso non facciamo fallback all'index.html: restituiamo 404 per evitare di servire HTML come JS.
    const ext = path.extname(req.path || '').toLowerCase();
    if (ext) {
      return res.status(404).send(`Asset not found: ${req.path}`);
    }

    // Altrimenti serviamo index.html (SPA)
    const indexFile = path.join(frontendBuildPath, 'index.html');
    if (!fs.existsSync(indexFile)) {
      console.error('index.html non trovato in', indexFile);
      return res.status(500).send('index.html non trovato nel percorso di build');
    }
    res.sendFile(indexFile);
  });

} else {
  console.warn('Nessuna cartella frontend trovata tra i percorsi candidati:', candidates);
  app.get('/', (req, res) => res.status(404).send('Frontend non disponibile'));
}

app.listen(port, '0.0.0.0', () => {
  console.log(`API (prisma) listening on ${port}`);
});
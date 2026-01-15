import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Puoi forzare il percorso frontend con FRONTEND_PATH
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

// semplice logging request/response
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} -> ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- HELPER: costruisce l'oggetto di env pubbliche (whitelist) ---
function getPublicEnv() {
  // Scegli qui quali variabili vuoi esporre pubblicamente.
  // Usa una whitelist per evitare di esportare segreti.
  const allowed = [
    'VITE_API_PLACES_ENDPOINT',
    'VITE_API_BOOKINGS_ENDPOINT',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'PUBLIC_API_URL' // esempio: aggiungi qui altre chiavi pubbliche se servono
  ];

  const out = {};
  for (const k of allowed) {
    if (typeof process.env[k] !== 'undefined') out[k] = process.env[k];
    else out[k] = '';
  }
  return out;
}

// Se vuoi ancora un endpoint /env.js (opzionale, ma non necessario):
app.get('/env.js', (req, res) => {
  const publicEnv = getPublicEnv();
  let jsonEnv = JSON.stringify(publicEnv);
  // evitare sequenze che chiudono lo script accidentalmente
  jsonEnv = jsonEnv.replace(/<\/script/gi, '<\\/script');
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send(`window.__env = ${jsonEnv};`);
});

if (frontendBuildPath) {
  console.log('Serving frontend from:', frontendBuildPath);

  // static files
  app.use(express.static(frontendBuildPath, {
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.js') res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      else if (ext === '.mjs') res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
      else if (ext === '.css') res.setHeader('Content-Type', 'text/css; charset=utf-8');
      else if (ext === '.wasm') res.setHeader('Content-Type', 'application/wasm');
      else if (ext === '.json') res.setHeader('Content-Type', 'application/json; charset=utf-8');
      else if (ext === '.svg') res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    }
  }));

  // log esiti delle risposte (utile)
  app.use((req, res, next) => {
    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${res.getHeader('Content-Type') || ''}`);
    });
    next();
  });

  // fallback per tutte le altre richieste:
  app.use((req, res) => {
    // non rispondere con index per route /api
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }

    // se sembra una richiesta per un asset (ha estensione) e non è stato trovato -> 404
    const ext = path.extname(req.path || '').toLowerCase();
    if (ext) {
      return res.status(404).send(`Asset not found: ${req.path}`);
    }

    const indexFile = path.join(frontendBuildPath, 'index.html');
    if (!fs.existsSync(indexFile)) {
      console.error('index.html non trovato in', indexFile);
      return res.status(500).send('index.html non trovato');
    }

    try {
      let content = fs.readFileSync(indexFile, 'utf8');

      // 1) se l'index contiene un placeholder %RUNTIME_ENV% lo sostituiamo
      if (content.includes('%RUNTIME_ENV%')) {
        const publicEnv = getPublicEnv();
        content = content.replace('%RUNTIME_ENV%', JSON.stringify(publicEnv));
      } else {
        // 2) altrimenti iniettiamo lo snippet prima di </head>
        const publicEnv = getPublicEnv();
        let jsonEnv = JSON.stringify(publicEnv);
        jsonEnv = jsonEnv.replace(/<\/script/gi, '<\\/script');
        const injection = `<script>window.__env = ${jsonEnv};</script>`;
        // prova a inserire prima della chiusura head, altrimenti prima di body
        if (content.includes('</head>')) {
          content = content.replace('</head>', `${injection}\n</head>`);
        } else if (content.includes('<body')) {
          content = injection + '\n' + content;
        } else {
          // fallback: append inizio doc
          content = injection + '\n' + content;
        }
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // evitare caching aggressivo dell'index (utile in sviluppo)
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.send(content);
    } catch (err) {
      console.error('Errore lettura/iniezione index.html', err);
      return res.status(500).send('Errore interno server');
    }
  });

} else {
  console.warn('Nessuna cartella frontend trovata tra i percorsi candidati:', candidates);
  app.get('/', (req, res) => res.status(404).send('Frontend non disponibile'));
}

app.listen(port, '0.0.0.0', () => {
  console.log(`API (prisma) listening on ${port}`);
});
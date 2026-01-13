// Edge Function: upload-proxy (Deno / Supabase Edge)
// Salva in functions/upload-proxy/index.ts
// Richiede le env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_UPLOAD_BUCKET

/// <reference lib="deno.ns" />

const getEnv = (name: string) =>
  // supabase edge sometimes uses globalThis.__ENV, fallback to Deno.env
  (globalThis as any).__ENV?.[name] ?? Deno.env.get?.(name) ?? '';

const CORS_HEADERS = (origin = '*') => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
});

export default async (req: Request) => {
  try {
    const origin = req.headers.get('origin') || '*';

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS(origin) });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS(origin), 'Content-Type': 'application/json' },
      });
    }

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'no file provided' }), {
        status: 400,
        headers: { ...CORS_HEADERS(origin), 'Content-Type': 'application/json' },
      });
    }

    const SUPABASE_URL = getEnv('SUPABASE_URL');
    const SERVICE_ROLE = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SERVICE_ROLE_KEY');
    const BUCKET = getEnv('SUPABASE_UPLOAD_BUCKET') || getEnv('SUPABASE_BUCKET') || 'uploads';

    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return new Response(JSON.stringify({ error: 'server not configured: missing SUPABASE_URL or SERVICE_ROLE key' }), {
        status: 500,
        headers: { ...CORS_HEADERS(origin), 'Content-Type': 'application/json' },
      });
    }

    // sanitize filename
    const safeName = (file.name || 'file').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
    const path = `uploads/${Date.now()}_${safeName}`; // change "uploads/" if you want different folder inside bucket

    // Read raw bytes from File
    const ab = await file.arrayBuffer();
    const uint8 = new Uint8Array(ab);

    // Supabase Storage expects PUT to /storage/v1/object/{bucket}/{path}
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encodeURIComponent(path)}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE}`,
        apikey: SERVICE_ROLE,
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: uint8,
    });

    const bodyText = await uploadRes.text();
    if (!uploadRes.ok) {
      return new Response(JSON.stringify({ error: 'upload failed', status: uploadRes.status, detail: bodyText }), {
        status: 500,
        headers: { ...CORS_HEADERS(origin), 'Content-Type': 'application/json' },
      });
    }

    // If bucket is public, public URL format:
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(BUCKET)}/${encodeURIComponent(path)}`;

    const resPayload = { url: publicUrl, path, status: uploadRes.status, detail: bodyText };
    return new Response(JSON.stringify(resPayload), {
      status: 200,
      headers: { ...CORS_HEADERS(origin), 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? String(err) }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    });
  }
};
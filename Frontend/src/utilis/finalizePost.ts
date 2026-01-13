// Minimal helper per upload su Supabase Storage e insert in smn_uploads_v1
// Usa `window.sb` come client Supabase esposto dal tuo supabaseClient.ts
// Configurazione bucket: legge import.meta.env.VITE_SUPABASE_BUCKET oppure usa fallback 'SUPABASE-UPLOAD-BUCKET'

type PendingFile = File | Blob;
type Metadata = Record<string, any>;

export async function finalizePost(pendingFile: PendingFile, metadata: Metadata = {}) {
  if (typeof window === 'undefined' || !('sb' in window) || !window.sb) {
    throw new Error('Supabase client (window.sb) non disponibile');
  }

  // bucket: preferisci impostare VITE_SUPABASE_BUCKET in .env, altrimenti usa il fallback che hai creato
  const BUCKET = (import.meta as any).env?.VITE_SUPABASE_BUCKET ?? 'SUPABASE-UPLOAD-BUCKET';

  const year = new Date().getFullYear();
  const safeName =
    (pendingFile as any).name && typeof (pendingFile as any).name === 'string'
      ? String((pendingFile as any).name).replace(/\s+/g, '_')
      : `file_${Date.now()}`;
  const path = `${year}/${Date.now()}_${safeName}`;

  try {
    // 1) Upload file
    const { data: uploadData, error: uploadErr } = await (window as any).sb.storage
      .from(BUCKET)
      .upload(path, pendingFile);

    if (uploadErr) {
      console.error('Storage upload error', uploadErr);
      throw uploadErr;
    }

    // 2) Ottieni publicUrl se il bucket è pubblico
    let publicUrl: string | null = null;
    try {
      publicUrl = ((window as any).sb.storage.from(BUCKET).getPublicUrl(path)?.data?.publicUrl) ?? null;
    } catch (e) {
      // non fatale: continuiamo a provare signed url
      publicUrl = null;
    }

    // 3) Se publicUrl non disponibile, crea signed url come fallback (1h)
    if (!publicUrl) {
      try {
        const { data: signedData, error: signErr } = await (window as any).sb.storage
          .from(BUCKET)
          .createSignedUrl(path, 60 * 60);
        if (signErr) {
          console.warn('createSignedUrl error', signErr);
        } else {
          publicUrl = signedData?.signedUrl ?? null;
        }
      } catch (e) {
        console.warn('createSignedUrl threw', e);
        publicUrl = null;
      }
    }

    // 4) Costruisci record per la tabella smn_uploads_v1
    const record = {
      payload: {
        ...metadata,
        file_path: path,
        file_url: publicUrl,
        created_at: new Date().toISOString()
      }
    };

    // 5) Inserisci record in DB
    const { data: insertData, error: insertErr } = await (window as any).sb
      .from('smn_uploads_v1')
      .insert([record]);

    if (insertErr) {
      console.error('DB insert error', insertErr);
      // opzionale: cancellare l'oggetto se l'insert fallisce per evitare orfani
      try {
        await (window as any).sb.storage.from(BUCKET).remove([path]);
      } catch (rmErr) {
        console.warn('Failed to remove uploaded file after DB insert error', rmErr);
      }
      throw insertErr;
    }

    // 6) Ritorna info utili
    return {
      path,
      publicUrl,
      storage: uploadData,
      db: insertData
    };
  } catch (err) {
    console.error('finalizePost error', err);
    throw err;
  }
}

export default finalizePost;
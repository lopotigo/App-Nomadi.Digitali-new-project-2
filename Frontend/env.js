window.__ENV__ = {
  VITE_SUPABASE_URL: "https://lqktkipfvcvjcgixzfmn.supabase.co",
  VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxa3RraXBmdmN2amNnaXh6Zm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NTcxNjAsImV4cCI6MjA4MTUzMzE2MH0.WSZkV7uw37pMUxeEVqBK6NVre9m6duP0YobiqWPUg6s",
  VITE_SUPABASE_BUCKET: "SUPABASE_UPLOAD_BUCKET"
};
console.debug("DEBUG: ENV LOADED", window.__ENV__);
// Notifica che l'env è pronto (utile se il bundle si ri-initializza)
window.dispatchEvent(new Event('envReady'));
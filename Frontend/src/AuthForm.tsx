import React, { useState } from "react";

const BACKEND = import.meta.env.VITE_BACKEND_URL ?? ""; // es: "http://localhost:3000" o "" per stesso dominio

export default function AuthForm({ onSuccess }: { onSuccess?: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      const r = await fetch(`${BACKEND}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Login failed");
      // Supporto vari formati: supabase returns { session } or { access_token }
      const accessToken = data?.session?.access_token ?? data?.access_token ?? null;
      if (accessToken) localStorage.setItem("token", accessToken);
      onSuccess?.();
    } catch (err: any) {
      setMsg(err.message || "Errore");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {msg && <div>{msg}</div>}
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Accedi</button>
    </form>
  );
}
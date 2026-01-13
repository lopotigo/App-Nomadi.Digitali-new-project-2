import React, { useState } from "react";
import { supabase } from "./supabaseClient";

type Props = {
  onSuccess?: () => void;
};

export default function AuthForm({ onSuccess }: Props) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!supabase) throw new Error("Supabase non configurato");

      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage(
          "Registrazione inviata. Controlla la tua email per verificare l'account (se abilitato)."
        );
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Login effettuato.");
        onSuccess?.();
      }
    } catch (err: any) {
      setMessage(err.message ?? "Errore durante l'autenticazione");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      <h2>{isSignup ? "Registrati" : "Accedi"}</h2>
      {message && <div style={{ marginBottom: 12 }}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <label style={{ display: "block", marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 8 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: "100%", padding: 8, marginTop: 4 }}
          />
        </label>

        <button type="submit" disabled={loading} style={{ marginRight: 8 }}>
          {loading ? "Caricamento..." : isSignup ? "Registrati" : "Accedi"}
        </button>

        <button
          type="button"
          onClick={() => setIsSignup((s) => !s)}
          style={{ background: "transparent" }}
        >
          {isSignup ? "Ho già un account" : "Crea un account"}
        </button>
      </form>
    </div>
  );
}
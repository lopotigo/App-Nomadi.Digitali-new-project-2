import React from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "./AuthForm";

export default function AuthPage() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <h1>Autenticazione</h1>
      <AuthForm onSuccess={() => navigate("/")} />
    </div>
  );
}
import './supabaseClient'; // importa il client supabase locale
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './app';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Elemento #root non trovato nel DOM');
}

createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
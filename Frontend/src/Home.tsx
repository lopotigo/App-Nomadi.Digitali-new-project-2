import React from 'react'

export default function App() {
  return (
    <div className="app-root">
      <header style={{ padding: 12, background: 'var(--card)', borderBottom: '1px solid #eee' }}>
        <h1 style={{ margin: 0 }}>App Nomadi Digitali (demo)</h1>
      </header>

      <main style={{ padding: 20 }}>
        <div className="card">
          <h2>Benvenuto</h2>
          <p>Questa è la base dell'app. Prossimo passo: creare pagina di login, mappa e chat.</p>
        </div>
      </main>

      <footer style={{ padding: 12, fontSize: 13, color: '#666', textAlign: 'center' }}>
        © {new Date().getFullYear()} Nomadi Digitali
      </footer>
    </div>
  )
}
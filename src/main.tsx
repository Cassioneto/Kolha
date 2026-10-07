import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { descarregarPendentes } from './lib/api';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// PWA: regista o service worker e tenta enviar cargas guardadas sem rede.
try {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
} catch {
  /* navegador sem SW */
}
window.addEventListener('online', () => {
  void descarregarPendentes();
});
void descarregarPendentes();

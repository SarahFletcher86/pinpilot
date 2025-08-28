// index.tsx — Vite entry (root of the project, not in /src)
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

function mount() {
  const el = document.getElementById('app');
  if (!el) {
    // Failsafe so you never see a blank screen without a hint
    const msg = document.createElement('pre');
    msg.style.padding = '16px';
    msg.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace';
    msg.textContent = 'Mount node #app not found in index.html';
    document.body.appendChild(msg);
    return;
  }
  const root = createRoot(el);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

mount();
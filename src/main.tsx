import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Global haptics for all buttons
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(15);
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

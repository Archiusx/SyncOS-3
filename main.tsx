/**
 * SYNC-OS BOOTSTRAP: The React DOM reconciliation entry point.
 * Mounts the main kernel into the HTML root and initiates StrictMode auditing.
 */
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

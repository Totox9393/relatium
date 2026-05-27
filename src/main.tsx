import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ensure we're using the correct base path for assets
const basePath = window.__BASE_PATH__ || '';
document.documentElement.style.setProperty('--base-path', `"${basePath}"`);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
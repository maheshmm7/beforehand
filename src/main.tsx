import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/inter/wght.css';
import '@fontsource-variable/playfair-display/wght.css';
import { App } from './App';
import { WorkspaceProvider } from './state/WorkspaceProvider';
import { applyStoredTheme } from './lib/theme';
import './styles/base.css';

// Before React paints, so the page never flashes the wrong theme.
applyStoredTheme();

// Scroll reveals are only allowed to hide anything once script is running.
document.documentElement.classList.add('motion-ready');

const container = document.getElementById('root');
if (container === null) throw new Error('Missing #root');

createRoot(container).render(
  <StrictMode>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </StrictMode>,
);

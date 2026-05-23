import React from 'react';
import ReactDOM from 'react-dom/client';

import { ZAvatar } from '../src/design/z-avatar';

function App() {
  return (
    <div style={{ padding: '20px', display: 'grid', gap: '20px' }}>
      <h1>ZAvatar E2E Test Page</h1>
      <ZAvatar data-testid="z-avatar" alt="Default avatar" fallback="ZA" />
      <ZAvatar
        data-testid="z-avatar-fallback"
        alt="Fallback avatar"
        fallback="Fallback"
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

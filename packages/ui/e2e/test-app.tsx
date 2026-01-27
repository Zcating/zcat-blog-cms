import React from 'react';
import ReactDOM from 'react-dom/client';

import { ZAvatar } from '../src/design/z-avatar';

function App() {
  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      <h1>ZAvatar E2E Test Page</h1>

      <div>
        <h2>Default Size (md)</h2>
        <ZAvatar
          data-testid="z-avatar"
          alt="Default avatar"
          fallback=" fallback content "
        />
      </div>

      <div>
        <h2>Small Size</h2>
        <ZAvatar
          data-testid="z-avatar-sm"
          size="sm"
          alt="Small avatar"
          fallback="SM"
        />
      </div>

      <div>
        <h2>Large Size</h2>
        <ZAvatar
          data-testid="z-avatar-lg"
          size="lg"
          alt="Large avatar"
          fallback="LG"
        />
      </div>

      <div>
        <h2>With Image</h2>
        <ZAvatar
          data-testid="z-avatar-with-image"
          src="https://github.com/shadcn.png"
          alt="Avatar with image"
          fallback="Image"
        />
      </div>

      <div>
        <h2>Fallback Only</h2>
        <ZAvatar
          data-testid="z-avatar-fallback"
          alt="Fallback avatar"
          fallback=" fallback content "
        />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

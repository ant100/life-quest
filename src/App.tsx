import React from 'react';
import { PhaserGame } from './game/PhaserGame';

export const App: React.FC = () => {
  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: '#121426',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* 
        Game Stage Container:
        - Perfectly centered vertically and horizontally across all phone ratios (iPhone 16 19.5:9, Pixel 20:9, iPad 4:3, Desktop 16:9)
        - Uses min(92vw, 440px) and min(88dvh, 760px) with aspect-ratio 9 / 16 (standard modern mobile)
      */}
      <div
        style={{
          width: 'min(92vw, 440px)',
          height: 'min(88dvh, 760px)',
          aspectRatio: '9 / 16',
          maxHeight: 'calc(100dvh - 32px)',
          maxWidth: 'calc(100vw - 32px)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '3px solid #252a4e',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(123, 197, 234, 0.2)',
        }}
      >
        <PhaserGame />

        {/* UI Overlay Layer */}
        <div
          id="ui-layer"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '16px',
          }}
        >
          {/* High-Legibility dialogue card */}
          <div
            className="firered-textbox"
            style={{
              pointerEvents: 'auto',
              marginBottom: '6px',
            }}
          >
            <div>Setup complete. System ready.</div>
            <div className="firered-prompt-arrow">▼</div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;

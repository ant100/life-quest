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
        backgroundColor: '#0a121e',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* 
        Game Stage Container (Option 3: Ghost in the Pastel)
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
          border: '3px solid #17273d',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(136, 226, 219, 0.18)',
        }}
      >
        {/* Canvas Layer: Pixel art world only */}
        <PhaserGame />

        {/* UI Overlay Layer: Real HTML vector typography */}
        <div
          id="ui-layer"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px 16px',
          }}
        >
          {/* Header Card (Option 3 Palette) */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(23, 39, 61, 0.95)',
              border: '2px solid #3f6b88',
              boxShadow: '0 8px 24px rgba(10, 18, 30, 0.6), inset 0 0 0 1px rgba(136, 226, 219, 0.25)',
              borderRadius: '14px',
              padding: '16px 20px',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#c2a0d9',
                color: '#101c2e',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                padding: '3px 10px',
                borderRadius: '6px',
                marginBottom: '8px',
                textTransform: 'uppercase',
              }}
            >
              Side Quest
            </div>

            <h1
              style={{
                margin: '0 0 4px 0',
                fontSize: 'clamp(28px, 6vw, 34px)',
                fontWeight: 800,
                color: '#88e2db',
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
                textShadow: '0 2px 10px rgba(136, 226, 219, 0.35)',
              }}
            >
              LIFE QUEST
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 700,
                color: '#c2a0d9',
                letterSpacing: '0.2px',
              }}
            >
              Retro Pixel Engine Ready
            </p>

            <span
              style={{
                display: 'inline-block',
                marginTop: '6px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#fdfbf7',
                opacity: 0.85,
              }}
            >
              Option 3: Ghost in the Pastel
            </span>
          </div>

          {/* Bottom Dialogue Box */}
          <div
            className="firered-textbox"
            style={{
              pointerEvents: 'auto',
              marginBottom: '4px',
            }}
          >
            <div>Setup complete. All text rendered via vector typography.</div>
            <div className="firered-prompt-arrow">▼</div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default App;

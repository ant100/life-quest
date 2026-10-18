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
        Game Stage Container (9:16 mobile aspect ratio, centered across all devices)
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
        {/* Canvas Layer: Pixel art world, characters, tiles only */}
        <PhaserGame />

        {/* UI Overlay Layer: All text, cards, dialogs rendered with crisp vector typography */}
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
          {/* Header Card (HTML / CSS DOM element with vector subpixel font rendering) */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(37, 42, 78, 0.95)',
              border: '2px solid #8d72b2',
              boxShadow: '0 8px 24px rgba(18, 20, 38, 0.6), inset 0 0 0 1px rgba(123, 197, 234, 0.3)',
              borderRadius: '14px',
              padding: '16px 20px',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div
              style={{
                display: 'inline-block',
                backgroundColor: '#f39b9b',
                color: '#1b1e38',
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
                color: '#7bc5ea',
                letterSpacing: '-0.5px',
                lineHeight: 1.1,
                textShadow: '0 2px 10px rgba(123, 197, 234, 0.3)',
              }}
            >
              LIFE QUEST
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 700,
                color: '#f39b9b',
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
                color: '#edf2f7',
                opacity: 0.8,
              }}
            >
              Crisp Vector Typography (React Overlay)
            </span>
          </div>

          {/* Bottom Dialogue Box (FireRed styled, pure HTML/CSS) */}
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

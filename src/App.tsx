import React from 'react';
import { PhaserGame } from './game/PhaserGame';

export const App: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#10121f',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding:
          'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) max(12px, env(safe-area-inset-bottom)) max(12px, env(safe-area-inset-left))',
      }}
    >
      {/* 
        Game Stage Container:
        - Lo-Fi Midnight aesthetic with soft slate borders and gentle mint ambient glow
      */}
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: 'min(100vw - 24px, 560px)',
          maxHeight: 'min(100dvh - 24px, 840px)',
          aspectRatio: '2 / 3',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '3px solid #20243d',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 0 60px rgba(0, 0, 0, 0.9), 0 0 25px rgba(125, 226, 209, 0.15)',
          margin: 'auto',
        }}
      >
        <PhaserGame />

        {/* UI Overlay Layer */}
        <div
          id="ui-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 'clamp(14px, 3vw, 24px)',
          }}
        >
          {/* Classic FireRed styled text box with pastel Lo-Fi accents */}
          <div
            className="firered-textbox"
            style={{
              pointerEvents: 'auto',
              marginBottom: '4px',
            }}
          >
            <div>Setup complete</div>
            <div className="firered-prompt-arrow">▼</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

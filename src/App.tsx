import React from 'react';
import { PhaserGame } from './game/PhaserGame';

export const App: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#030712',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Game Stage Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '520px',
          maxHeight: '100dvh',
          aspectRatio: '160 / 240',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid rgba(0, 240, 255, 0.2)',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.9), 0 0 20px rgba(0, 240, 255, 0.1)',
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
            padding: '16px',
          }}
        >
          {/* Cyberpunk Dialog Box overlay */}
          <div
            className="cyber-dialog"
            style={{
              pointerEvents: 'auto',
              marginBottom: '10px',
            }}
          >
            <div className="cyber-dialog-header">
              <span className="cyber-tag">SYSTEM // BOOT</span>
              <span style={{ fontSize: '11px', color: '#00f0ff', letterSpacing: '1px' }}>V0.1.0</span>
            </div>
            <div className="cyber-dialog-text">Setup complete. Ready for Sonnet agent.</div>
            <div className="cyber-prompt-arrow">▶</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

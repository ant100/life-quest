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
        backgroundColor: '#0f1026',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Game Stage Container: Centers on Desktop, Tablet, and Mobile */}
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '520px',
          maxHeight: '100dvh',
          aspectRatio: '320 / 480',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #042f40',
          boxShadow: '0 0 50px rgba(15, 16, 38, 0.95), 0 0 20px rgba(83, 160, 196, 0.25)',
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
          {/* Classic FireRed styled text box */}
          <div
            className="firered-textbox"
            style={{
              pointerEvents: 'auto',
              marginBottom: '10px',
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

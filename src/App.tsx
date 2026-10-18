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
        backgroundColor: '#1b0e1d',
        overflow: 'hidden',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      {/* Phaser Canvas Container */}
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '480px',
          maxHeight: '100%',
          aspectRatio: '160 / 240',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
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
            padding: '12px',
          }}
        >
          {/* FireRed styled Dialog Box overlay */}
          <div
            className="firered-textbox"
            style={{
              pointerEvents: 'auto',
              marginBottom: '8px',
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

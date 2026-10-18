import React from 'react';
import { eventBus, type Direction } from '../game/eventBus';

export const DPad: React.FC = () => {
  const triggerMove = (dir: Direction) => {
    eventBus.emit('dpad:move', dir);
  };

  const triggerAction = () => {
    eventBus.emit('dpad:action', undefined);
  };

  const btnStyle: React.CSSProperties = {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: 'rgba(23, 39, 61, 0.85)',
    border: '2px solid #3f6b88',
    color: '#88e2db',
    fontSize: '16px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
  };

  return (
    <div
      data-testid="dpad-controls"
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0 4px',
      }}
    >
      {/* Cross D-Pad */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 44px)',
          gridTemplateRows: 'repeat(3, 40px)',
          gap: '3px',
          alignItems: 'center',
          justifyItems: 'center',
        }}
      >
        <div />
        <button
          type="button"
          aria-label="Move Up"
          data-testid="dpad-up"
          style={btnStyle}
          onClick={() => triggerMove('up')}
        >
          ▲
        </button>
        <div />

        <button
          type="button"
          aria-label="Move Left"
          data-testid="dpad-left"
          style={btnStyle}
          onClick={() => triggerMove('left')}
        >
          ◀
        </button>
        <div
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '999px',
            background: '#3f6b88',
          }}
        />
        <button
          type="button"
          aria-label="Move Right"
          data-testid="dpad-right"
          style={btnStyle}
          onClick={() => triggerMove('right')}
        >
          ▶
        </button>

        <div />
        <button
          type="button"
          aria-label="Move Down"
          data-testid="dpad-down"
          style={btnStyle}
          onClick={() => triggerMove('down')}
        >
          ▼
        </button>
        <div />
      </div>

      {/* Action 'A' Button */}
      <button
        type="button"
        aria-label="Interact (A)"
        data-testid="dpad-action-a"
        onClick={triggerAction}
        style={{
          width: '58px',
          height: '58px',
          borderRadius: '999px',
          background: '#c2a0d9',
          border: '3px solid #101c2e',
          boxShadow:
            '0 0 0 2px #3f6b88, 0 6px 16px rgba(0, 0, 0, 0.6)',
          color: '#101c2e',
          fontSize: '20px',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        A
      </button>
    </div>
  );
};

import React, { useState } from 'react';
import { audio } from '../audio/audio';

export interface MenuOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
}

export interface MenuProps<T = string> {
  options: MenuOption<T>[];
  onSelect: (value: T) => void;
  selectedValue?: T;
}

export function Menu<T = string>({
  options,
  onSelect,
  selectedValue,
}: MenuProps<T>): React.ReactElement {
  const [hoveredIdx, setHoveredIdx] = useState<number>(0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      {options.map((opt, idx) => {
        const isActive =
          selectedValue !== undefined ? opt.value === selectedValue : idx === hoveredIdx;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onMouseEnter={() => setHoveredIdx(idx)}
            onClick={() => {
              audio.playSfx('select');
              onSelect(opt.value);
            }}
            style={{
              minHeight: '44px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: isActive ? '2px solid #101c2e' : '1.5px solid #cbd5e1',
              background: isActive ? '#eefaf8' : '#f8fafc',
              color: '#101c2e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              textAlign: 'left',
              fontSize: '15px',
              fontWeight: 700,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  color: '#3f6b88',
                  fontWeight: 800,
                  width: '14px',
                  display: 'inline-block',
                }}
              >
                {isActive ? '▶' : ''}
              </span>
              <span>{opt.label}</span>
            </span>
            {opt.sublabel && (
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                {opt.sublabel}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

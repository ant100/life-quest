import React, { useEffect, useState } from 'react';
import { audio } from '../audio/audio';

export interface DialogBoxProps {
  speaker?: string;
  lines: string[];
  onComplete?: () => void;
  charDelayMs?: number;
  children?: React.ReactNode;
  className?: string;
}

export const DialogBox: React.FC<DialogBoxProps> = ({
  speaker,
  lines,
  onComplete,
  charDelayMs = 18,
  children,
  className = '',
}) => {
  const linesKey = lines.join('\u0000');
  const [trackedKey, setTrackedKey] = useState(linesKey);
  const [lineIndex, setLineIndex] = useState(0);
  const [visibleChars, setVisibleChars] = useState(0);

  if (trackedKey !== linesKey) {
    setTrackedKey(linesKey);
    setLineIndex(0);
    setVisibleChars(0);
  }

  const currentLine = lines[lineIndex] ?? '';
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const effectiveChars =
    prefersReducedMotion || charDelayMs <= 0
      ? currentLine.length
      : visibleChars;
  const isLineFinished = effectiveChars >= currentLine.length;

  useEffect(() => {
    if (isLineFinished) {
      return;
    }

    const timer = setTimeout(() => {
      setVisibleChars((prev) => {
        const next = prev + 1;
        if (next % 3 === 0) {
          audio.playSfx('blip');
        }
        return next;
      });
    }, charDelayMs);

    return () => clearTimeout(timer);
  }, [isLineFinished, charDelayMs]);

  const handleAdvance = () => {
    if (!isLineFinished) {
      setVisibleChars(currentLine.length);
      return;
    }

    if (lineIndex + 1 < lines.length) {
      audio.playSfx('select');
      const nextIdx = lineIndex + 1;
      setLineIndex(nextIdx);
      setVisibleChars(0);
    } else if (onComplete) {
      audio.playSfx('select');
      onComplete();
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleAdvance();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const displayedText = isLineFinished
    ? currentLine
    : currentLine.slice(0, effectiveChars);

  return (
    <div
      className={`firered-textbox ${className}`}
      onClick={
        onComplete || !isLineFinished || lineIndex + 1 < lines.length
          ? handleAdvance
          : undefined
      }
      role={onComplete ? 'button' : 'region'}
      tabIndex={onComplete ? 0 : undefined}
      data-testid="dialog-box"
      style={{
        pointerEvents: 'auto',
        cursor: onComplete || !isLineFinished ? 'pointer' : 'default',
      }}
    >
      {speaker && (
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#101c2e',
            color: '#88e2db',
            fontSize: '12px',
            fontWeight: 800,
            padding: '2px 10px',
            borderRadius: '6px',
            marginBottom: '6px',
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
          }}
        >
          {speaker}
        </div>
      )}

      <div style={{ minHeight: '44px', paddingRight: '18px' }}>
        {displayedText}
      </div>

      {children && isLineFinished && (
        <div
          style={{ marginTop: '10px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}

      {(onComplete || lineIndex + 1 < lines.length || !isLineFinished) && (
        <div className="firered-prompt-arrow" aria-hidden="true">
          ▼
        </div>
      )}
    </div>
  );
};

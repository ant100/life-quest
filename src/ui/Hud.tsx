import React from 'react';
import { audio } from '../audio/audio';
import { isQuestDoneForCurrentPeriod } from '../domain/daily';
import { getLevelProgress } from '../domain/xp';
import { useGameStore } from '../store/gameStore';

export interface HudProps {
  onOpenQuestLog: () => void;
  onOpenQuickMenu?: () => void;
}

export const Hud: React.FC<HudProps> = ({ onOpenQuestLog, onOpenQuickMenu }) => {
  const player = useGameStore((s) => s.player);
  const quests = useGameStore((s) => s.quests);
  const setVolumes = useGameStore((s) => s.setVolumes);

  const progress = getLevelProgress(player.level, player.xp);
  const nowIso = new Date().toISOString();
  const activeCount = quests.filter(
    (q) => q.status === 'active' && !isQuestDoneForCurrentPeriod(q, nowIso),
  ).length;

  const isMusicMuted = player.musicVolume <= 0;

  const handleToggleMusic = () => {
    const nextMusic = isMusicMuted ? 0.6 : 0;
    setVolumes(nextMusic, player.sfxVolume);
    audio.setVolumes(nextMusic, player.sfxVolume);
    audio.playSfx('select');
  };

  return (
    <header
      data-testid="hud-bar"
      style={{
        pointerEvents: 'auto',
        background: 'rgba(16, 28, 46, 0.92)',
        border: '2px solid #3f6b88',
        boxShadow:
          '0 6px 20px rgba(10, 18, 30, 0.65), inset 0 0 0 1px rgba(136, 226, 219, 0.2)',
        borderRadius: '12px',
        padding: '8px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        backdropFilter: 'blur(6px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
        }}
      >
        {/* Left: Player Name + Level + EXP Bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '4px',
            }}
          >
            <span
              data-testid="hud-level"
              style={{
                backgroundColor: '#c2a0d9',
                color: '#101c2e',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '5px',
                letterSpacing: '0.4px',
              }}
            >
              LV.{player.level}
            </span>
            <span
              style={{
                fontSize: '15px',
                fontWeight: 800,
                color: '#fdfbf7',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {player.name}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '12px',
                fontWeight: 700,
                color: '#f6c86a',
              }}
            >
              🪙 {player.gold}
            </span>
          </div>

          {/* EXP Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                color: '#88e2db',
                letterSpacing: '0.5px',
              }}
            >
              EXP
            </span>
            <div
              style={{
                flex: 1,
                height: '8px',
                background: '#0a121e',
                borderRadius: '999px',
                border: '1px solid #3f6b88',
                overflow: 'hidden',
              }}
            >
              <div
                data-testid="hud-exp-bar"
                style={{
                  width: `${progress.progressPercent}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #88e2db 0%, #c2a0d9 100%)',
                  transition: 'width 0.35s ease-out',
                }}
              />
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#fdfbf7',
                opacity: 0.85,
                minWidth: '46px',
                textAlign: 'right',
              }}
            >
              {progress.currentLevelXp}/{progress.requiredLevelXp}
            </span>
          </div>
        </div>

        {/* Right: Music Toggle + Quest Log CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleToggleMusic}
            aria-label={isMusicMuted ? 'Unmute music' : 'Mute music'}
            data-testid="hud-music-toggle"
            className="abyss-btn"
            style={{
              minWidth: '44px',
              padding: '0 10px',
              fontSize: '16px',
            }}
          >
            {isMusicMuted ? '🔇' : '🎵'}
          </button>

          {onOpenQuickMenu && (
            <button
              type="button"
              onClick={() => {
                audio.playSfx('select');
                onOpenQuickMenu();
              }}
              aria-label="Town places menu"
              data-testid="hud-places-btn"
              className="abyss-btn"
              style={{
                minWidth: '44px',
                padding: '0 10px',
                fontSize: '13px',
              }}
            >
              🗺️
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              audio.playSfx('select');
              onOpenQuestLog();
            }}
            data-testid="hud-quest-log-btn"
            className="abyss-btn abyss-btn-primary"
            style={{
              padding: '0 12px',
              fontSize: '14px',
              whiteSpace: 'nowrap',
            }}
          >
            📜 Quests ({activeCount})
          </button>
        </div>
      </div>
    </header>
  );
};

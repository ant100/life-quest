import React from 'react';
import { audio } from '../audio/audio';
import { BADGE_DEFINITIONS } from '../domain/badges';
import { getLevelProgress } from '../domain/xp';
import { useGameStore } from '../store/gameStore';

export interface HouseScreenProps {
  onClose: () => void;
}

export const HouseScreen: React.FC<HouseScreenProps> = ({ onClose }) => {
  const player = useGameStore((s) => s.player);
  const quests = useGameStore((s) => s.quests);

  const progress = getLevelProgress(player.level, player.xp);
  const earnedBadgesSet = new Set(player.badges);

  // Build chronological history of all completed quest entries
  const historyEntries = quests
    .flatMap((q) =>
      q.completions.map((c) => ({
        id: `${q.instanceId}-${c.at}`,
        title: q.title,
        category: q.category,
        at: c.at,
        note: c.note,
      })),
    )
    .sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <div className="abyss-modal-backdrop" data-testid="house-screen-modal">
      <div className="abyss-modal">
        <div className="abyss-modal-header">
          <span className="abyss-modal-title">🏠 {player.name}&apos;s Home</span>
          <button
            type="button"
            className="abyss-btn"
            onClick={() => {
              audio.playSfx('cancel');
              onClose();
            }}
            style={{ minHeight: '38px', padding: '4px 10px' }}
          >
            ✕
          </button>
        </div>

        <div className="abyss-modal-body">
          {/* Hero Summary Banner */}
          <div className="abyss-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#fdfbf7',
                  }}
                >
                  {player.name} · Level {player.level}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#88e2db',
                    fontWeight: 700,
                  }}
                >
                  Total EXP: {player.xp} ({progress.currentLevelXp}/
                  {progress.requiredLevelXp} to LV.{player.level + 1})
                </div>
              </div>

              <div
                data-testid="days-adventured-counter"
                style={{
                  textAlign: 'right',
                  background: 'rgba(194, 160, 217, 0.16)',
                  border: '1px solid rgba(194, 160, 217, 0.45)',
                  borderRadius: '8px',
                  padding: '6px 10px',
                }}
              >
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#c2a0d9',
                  }}
                >
                  {player.daysAdventured.length}
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#fdfbf7',
                  }}
                >
                  Days Adventured
                </div>
              </div>
            </div>

            {/* 4 Core Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                marginTop: '8px',
              }}
            >
              {(
                [
                  { key: 'body', label: '⚡ Body', val: player.stats.body },
                  { key: 'mind', label: '📖 Mind', val: player.stats.mind },
                  { key: 'spirit', label: '🌿 Spirit', val: player.stats.spirit },
                  { key: 'wealth', label: '🪙 Wealth', val: player.stats.wealth },
                ] as const
              ).map((stat) => (
                <div
                  key={stat.key}
                  style={{
                    background: '#101c2e',
                    border: '1px solid #3f6b88',
                    borderRadius: '8px',
                    padding: '8px 4px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 800,
                      color: '#88e2db',
                    }}
                  >
                    {stat.val}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#cbd5e1',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 8 Gym-style Badges */}
          <div className="abyss-card">
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#c2a0d9',
                marginBottom: '4px',
              }}
            >
              🏅 Guild Badges ({player.badges.length}/8)
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '6px',
              }}
            >
              {BADGE_DEFINITIONS.map((b) => {
                const earned = earnedBadgesSet.has(b.id);
                return (
                  <div
                    key={b.id}
                    data-testid={`badge-slot-${b.id}`}
                    style={{
                      background: earned
                        ? 'rgba(136, 226, 219, 0.14)'
                        : '#101c2e',
                      border: earned
                        ? '1.5px solid #88e2db'
                        : '1px dashed #3f6b88',
                      borderRadius: '8px',
                      padding: '8px',
                      opacity: earned ? 1 : 0.55,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>
                      {earned ? b.icon : '🔒'}
                    </span>
                    <div>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: earned ? '#88e2db' : '#cbd5e1',
                        }}
                      >
                        {b.name}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: '#cbd5e1',
                          lineHeight: 1.25,
                        }}
                      >
                        {b.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Completed Quest History */}
          <div className="abyss-card">
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#88e2db',
                marginBottom: '4px',
              }}
            >
              📖 Adventure Chronicle ({historyEntries.length})
            </div>

            {historyEntries.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                No quests completed yet. Your story starts today!
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '160px',
                  overflowY: 'auto',
                }}
              >
                {historyEntries.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      background: '#101c2e',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      fontSize: '13px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        color: '#fdfbf7',
                      }}
                    >
                      <span>✓ {entry.title}</span>
                      <span style={{ fontSize: '11px', color: '#88e2db' }}>
                        {entry.at.slice(0, 10)}
                      </span>
                    </div>
                    {entry.note && (
                      <div
                        style={{
                          fontSize: '12px',
                          fontStyle: 'italic',
                          color: '#c2a0d9',
                          marginTop: '2px',
                        }}
                      >
                        “{entry.note}”
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

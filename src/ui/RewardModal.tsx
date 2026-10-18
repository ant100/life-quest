import React, { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import type { RewardOutcome, StatKey } from '../domain/types';
import { getLevelProgress } from '../domain/xp';

export interface RewardModalProps {
  playerName: string;
  reward: RewardOutcome;
  onDismiss: () => void;
}

const STAT_LABELS: Record<StatKey, string> = {
  body: 'BODY',
  mind: 'MIND',
  spirit: 'SPIRIT',
  wealth: 'WEALTH',
};

export const RewardModal: React.FC<RewardModalProps> = ({
  playerName,
  reward,
  onDismiss,
}) => {
  const prevProgress = getLevelProgress(reward.previousLevel, reward.previousXp);
  const nextProgress = getLevelProgress(reward.newLevel, reward.newXp);

  const [barPercent, setBarPercent] = useState(
    reward.levelsGained > 0 ? 0 : prevProgress.progressPercent,
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setBarPercent(nextProgress.progressPercent);
    }, 80);
    return () => clearTimeout(timer);
  }, [nextProgress.progressPercent]);

  const statEntries = (
    Object.entries(reward.statGains) as [StatKey, number | undefined][]
  ).filter(([, val]) => typeof val === 'number' && val > 0);

  return (
    <div
      className="abyss-modal-backdrop"
      data-testid="reward-modal"
      style={{ zIndex: 50 }}
    >
      <div className="abyss-modal animate-float-up">
        <div
          className="abyss-modal-header"
          style={{
            background:
              reward.levelsGained > 0
                ? 'linear-gradient(90deg, #17273d 0%, #2e2047 100%)'
                : '#17273d',
          }}
        >
          <span className="abyss-modal-title">
            {reward.levelsGained > 0 ? '🌟 LEVEL UP!' : '✨ Quest Complete!'}
          </span>
        </div>

        <div className="abyss-modal-body" style={{ gap: '12px' }}>
          {/* Hero Completion Headline */}
          <div
            className="firered-textbox"
            style={{
              padding: '12px 14px',
              fontSize: '16px',
            }}
          >
            <div>
              {playerName} completed <strong>{reward.questTitle}</strong>!
            </div>
          </div>

          {/* Bonus Roll Banner */}
          {reward.bonusType !== 'none' && reward.bonusMessage && (
            <div
              data-testid="reward-bonus-banner"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                background:
                  reward.bonusType === 'critical'
                    ? 'rgba(194, 160, 217, 0.22)'
                    : 'rgba(246, 200, 106, 0.22)',
                border:
                  reward.bonusType === 'critical'
                    ? '1.5px solid #c2a0d9'
                    : '1.5px solid #f6c86a',
                color:
                  reward.bonusType === 'critical' ? '#c2a0d9' : '#f6c86a',
                fontWeight: 800,
                fontSize: '15px',
                textAlign: 'center',
              }}
            >
              ⚡ {reward.bonusMessage}
            </div>
          )}

          {/* EXP & Gold Gains + Animated EXP Bar */}
          <div className="abyss-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                data-testid="reward-xp-gained"
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#88e2db',
                }}
              >
                +{reward.totalXp} EXP
              </span>
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: '#f6c86a',
                }}
              >
                +{reward.totalGold} Gold 🪙
              </span>
            </div>

            <div
              style={{
                height: '12px',
                background: '#0a121e',
                borderRadius: '999px',
                border: '1.5px solid #3f6b88',
                overflow: 'hidden',
                marginTop: '4px',
              }}
            >
              <div
                style={{
                  width: `${barPercent}%`,
                  height: '100%',
                  background:
                    'linear-gradient(90deg, #88e2db 0%, #c2a0d9 100%)',
                  transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: 700,
                color: '#cbd5e1',
              }}
            >
              <span>Level {reward.newLevel}</span>
              <span>
                {nextProgress.currentLevelXp}/{nextProgress.requiredLevelXp} EXP
              </span>
            </div>
          </div>

          {/* Stat Rise Popups */}
          {statEntries.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {statEntries.map(([key, amount]) => (
                <div
                  key={key}
                  data-testid={`stat-gain-${key}`}
                  style={{
                    flex: 1,
                    minWidth: '120px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: 'rgba(136, 226, 219, 0.14)',
                    border: '1px solid #88e2db',
                    color: '#fdfbf7',
                    fontSize: '14px',
                    fontWeight: 800,
                    textAlign: 'center',
                  }}
                >
                  {STAT_LABELS[key]} rose by {amount}!
                </div>
              ))}
            </div>
          )}

          {/* Level Up Celebration */}
          {reward.levelsGained > 0 && (
            <div
              data-testid="reward-level-up-banner"
              style={{
                padding: '12px',
                borderRadius: '10px',
                background:
                  'linear-gradient(135deg, rgba(136, 226, 219, 0.22), rgba(194, 160, 217, 0.25))',
                border: '2px solid #88e2db',
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
                🎉 Reached Level {reward.newLevel}!
              </div>
              <div
                style={{
                  fontSize: '13px',
                  color: '#fdfbf7',
                  marginTop: '2px',
                }}
              >
                Your presence in town grows stronger.
              </div>
            </div>
          )}

          {/* Chain Step Unlocked / Chain Completed */}
          {reward.unlockedNextStep && (
            <div
              data-testid="reward-chain-unlock"
              className="abyss-card"
              style={{ borderColor: '#c2a0d9' }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#c2a0d9',
                }}
              >
                ⛓️ A new path opens…
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#fdfbf7',
                }}
              >
                Next step unlocked: {reward.unlockedNextStep.title}
              </div>
            </div>
          )}

          {reward.completedChainTitle && (
            <div
              data-testid="reward-chain-completed"
              className="abyss-card"
              style={{ borderColor: '#f6c86a' }}
            >
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#f6c86a',
                }}
              >
                🏆 Epic Chain Completed: {reward.completedChainTitle}!
              </div>
            </div>
          )}

          {/* Newly Earned Badges */}
          {reward.newlyEarnedBadges.map((badge) => (
            <div
              key={badge.id}
              data-testid={`reward-badge-${badge.id}`}
              className="abyss-card"
              style={{
                borderColor: '#88e2db',
                background: 'rgba(136, 226, 219, 0.14)',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#88e2db',
                }}
              >
                🏅 Badge Earned: {badge.icon} {badge.name}!
              </div>
              <div style={{ fontSize: '12px', color: '#fdfbf7' }}>
                {badge.description}
              </div>
            </div>
          ))}

          {/* Detox Closing Line */}
          <div
            data-testid="reward-closing-nudge"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: '#0a121e',
              border: '1px solid #3f6b88',
              fontSize: '13px',
              fontStyle: 'italic',
              color: '#c2a0d9',
              textAlign: 'center',
              lineHeight: 1.4,
            }}
          >
            “{reward.closingNudge}”
          </div>

          <button
            type="button"
            data-testid="reward-continue-btn"
            className="abyss-btn abyss-btn-primary"
            onClick={() => {
              audio.playSfx('select');
              onDismiss();
            }}
            style={{ width: '100%' }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

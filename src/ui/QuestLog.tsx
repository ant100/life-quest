import React, { useState } from 'react';
import { audio } from '../audio/audio';
import { isQuestDoneForCurrentPeriod } from '../domain/daily';
import { baseXpForDifficulty } from '../domain/rewards';
import { useGameStore } from '../store/gameStore';

export interface QuestLogProps {
  onClose: () => void;
  onOpenAddQuest: () => void;
  onOpenAddChain: () => void;
}

type TabKey = 'active' | 'epics' | 'done';

export const QuestLog: React.FC<QuestLogProps> = ({
  onClose,
  onOpenAddQuest,
  onOpenAddChain,
}) => {
  const quests = useGameStore((s) => s.quests);
  const chains = useGameStore((s) => s.chains);
  const completeQuest = useGameStore((s) => s.completeQuest);

  const [tab, setTab] = useState<TabKey>('active');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null);

  const nowIso = new Date().toISOString();

  // Active tab shows active quests PLUS recurring quests completed in the current period ("Done for today ✓")
  const visibleActiveQuests = quests.filter(
    (q) =>
      q.status === 'active' ||
      (q.recurrence !== 'once' && isQuestDoneForCurrentPeriod(q, nowIso)),
  );

  const completedQuests = quests.filter((q) => q.completions.length > 0);

  const handleComplete = (instanceId: string) => {
    const note = notes[instanceId];
    const outcome = completeQuest(instanceId, note);
    if (outcome) {
      if (outcome.levelsGained > 0 || outcome.newlyEarnedBadges.length > 0) {
        audio.playJingle('levelup');
      } else {
        audio.playJingle('complete');
      }
      setNotes((prev) => {
        const next = { ...prev };
        delete next[instanceId];
        return next;
      });
    }
  };

  return (
    <div className="abyss-modal-backdrop" data-testid="quest-log-modal">
      <div className="abyss-modal">
        <div className="abyss-modal-header">
          <span className="abyss-modal-title">📜 Adventurer&apos;s Quest Log</span>
          <button
            type="button"
            data-testid="close-quest-log-btn"
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

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 14px 0 14px',
            background: '#101c2e',
          }}
        >
          <button
            type="button"
            data-testid="tab-active"
            onClick={() => {
              audio.playSfx('select');
              setTab('active');
            }}
            className={
              tab === 'active' ? 'abyss-btn abyss-btn-primary' : 'abyss-btn'
            }
            style={{ flex: 1, fontSize: '13px', padding: '6px 8px' }}
          >
            Active ({visibleActiveQuests.length})
          </button>
          <button
            type="button"
            data-testid="tab-epics"
            onClick={() => {
              audio.playSfx('select');
              setTab('epics');
            }}
            className={
              tab === 'epics' ? 'abyss-btn abyss-btn-primary' : 'abyss-btn'
            }
            style={{ flex: 1, fontSize: '13px', padding: '6px 8px' }}
          >
            Epics ({chains.length})
          </button>
          <button
            type="button"
            data-testid="tab-done"
            onClick={() => {
              audio.playSfx('select');
              setTab('done');
            }}
            className={
              tab === 'done' ? 'abyss-btn abyss-btn-primary' : 'abyss-btn'
            }
            style={{ flex: 1, fontSize: '13px', padding: '6px 8px' }}
          >
            Done ({completedQuests.length})
          </button>
        </div>

        <div className="abyss-modal-body">
          {tab === 'active' && (
            <>
              {visibleActiveQuests.length === 0 ? (
                <div
                  className="abyss-card"
                  style={{ textAlign: 'center', padding: '24px 14px' }}
                >
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#88e2db' }}>
                    Your active slate is clear!
                  </p>
                  <p style={{ fontSize: '14px', opacity: 0.85, marginTop: '4px' }}>
                    Visit the Town Quest Board or create a custom quest below.
                  </p>
                </div>
              ) : (
                visibleActiveQuests.map((quest) => {
                  const doneForPeriod = isQuestDoneForCurrentPeriod(quest, nowIso);
                  const xp = baseXpForDifficulty(quest.difficulty);
                  const isNoteOpen = expandedNoteId === quest.instanceId;

                  return (
                    <div
                      key={quest.instanceId}
                      className="abyss-card"
                      data-testid="quest-card"
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '8px',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px',
                              marginBottom: '4px',
                            }}
                          >
                            <span className="abyss-badge-pill">{quest.category}</span>
                            {quest.recurrence !== 'once' && (
                              <span
                                className="abyss-badge-pill"
                                style={{
                                  background: 'rgba(136, 226, 219, 0.16)',
                                  color: '#88e2db',
                                  borderColor: 'rgba(136, 226, 219, 0.4)',
                                }}
                              >
                                {quest.recurrence}
                              </span>
                            )}
                            {quest.chainId && (
                              <span
                                className="abyss-badge-pill"
                                style={{
                                  background: 'rgba(246, 200, 106, 0.18)',
                                  color: '#f6c86a',
                                  borderColor: 'rgba(246, 200, 106, 0.45)',
                                }}
                              >
                                ⛓️ Step {(quest.chainStep ?? 0) + 1}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 800,
                                color: '#88e2db',
                                marginLeft: 'auto',
                              }}
                            >
                              +{xp} EXP
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: '16px',
                              fontWeight: 800,
                              color: '#fdfbf7',
                              lineHeight: 1.3,
                            }}
                          >
                            {quest.title}
                          </div>

                          {quest.description && (
                            <p
                              style={{
                                fontSize: '13px',
                                color: '#cbd5e1',
                                marginTop: '3px',
                                lineHeight: 1.35,
                              }}
                            >
                              {quest.description}
                            </p>
                          )}

                          {quest.flavor && (
                            <p
                              style={{
                                fontSize: '12px',
                                fontStyle: 'italic',
                                color: '#c2a0d9',
                                marginTop: '4px',
                              }}
                            >
                              “{quest.flavor}”
                            </p>
                          )}
                        </div>
                      </div>

                      {!doneForPeriod ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            marginTop: '6px',
                          }}
                        >
                          {isNoteOpen && (
                            <input
                              className="abyss-input"
                              type="text"
                              placeholder="One-line reflection (optional)..."
                              value={notes[quest.instanceId] ?? ''}
                              onChange={(e) =>
                                setNotes((prev) => ({
                                  ...prev,
                                  [quest.instanceId]: e.target.value,
                                }))
                              }
                              style={{ minHeight: '38px', fontSize: '14px' }}
                            />
                          )}

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="abyss-btn"
                              onClick={() =>
                                setExpandedNoteId(
                                  isNoteOpen ? null : quest.instanceId,
                                )
                              }
                              style={{
                                fontSize: '12px',
                                padding: '6px 10px',
                              }}
                            >
                              {isNoteOpen ? 'Hide Note' : '+ Note'}
                            </button>

                            <button
                              type="button"
                              data-testid="quest-done-btn"
                              onClick={() => handleComplete(quest.instanceId)}
                              className="abyss-btn abyss-btn-primary"
                              style={{ flex: 1, fontSize: '15px' }}
                            >
                              Done ✓
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          data-testid="quest-done-period-badge"
                          style={{
                            marginTop: '6px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            background: 'rgba(110, 231, 183, 0.15)',
                            border: '1px solid rgba(110, 231, 183, 0.4)',
                            color: '#6ee7b7',
                            fontSize: '14px',
                            fontWeight: 800,
                            textAlign: 'center',
                          }}
                        >
                          {quest.recurrence === 'weekly'
                            ? 'Done for this week ✓'
                            : 'Done for today ✓'}
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  data-testid="open-add-quest-btn"
                  className="abyss-btn"
                  onClick={() => {
                    audio.playSfx('select');
                    onOpenAddQuest();
                  }}
                  style={{ flex: 1, fontSize: '13px' }}
                >
                  + Write Quest
                </button>
                <button
                  type="button"
                  data-testid="open-add-chain-btn"
                  className="abyss-btn"
                  onClick={() => {
                    audio.playSfx('select');
                    onOpenAddChain();
                  }}
                  style={{ flex: 1, fontSize: '13px' }}
                >
                  + Epic Chain
                </button>
              </div>
            </>
          )}

          {tab === 'epics' && (
            <>
              {chains.length === 0 ? (
                <div
                  className="abyss-card"
                  style={{ textAlign: 'center', padding: '24px 14px' }}
                >
                  <p style={{ fontSize: '16px', fontWeight: 700, color: '#88e2db' }}>
                    No Epic Chains started yet.
                  </p>
                  <p style={{ fontSize: '14px', opacity: 0.85, marginTop: '4px' }}>
                    Start a multi-step adventure from the Quest Board or create your own!
                  </p>
                </div>
              ) : (
                chains.map((chain) => {
                  const totalSteps = chain.steps.length;
                  const doneSteps =
                    chain.status === 'done' ? totalSteps : chain.currentStep;

                  return (
                    <div
                      key={chain.id}
                      className="abyss-card"
                      data-testid="chain-card"
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '16px',
                            fontWeight: 800,
                            color: '#88e2db',
                          }}
                        >
                          🗺️ {chain.title}
                        </span>
                        <span className="abyss-badge-pill">
                          {doneSteps}/{totalSteps} Steps
                        </span>
                      </div>

                      {chain.description && (
                        <p style={{ fontSize: '13px', color: '#cbd5e1' }}>
                          {chain.description}
                        </p>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          marginTop: '6px',
                        }}
                      >
                        {chain.steps.map((step, idx) => {
                          const isDone = idx < doneSteps;
                          const isCurrent =
                            chain.status === 'active' && idx === chain.currentStep;
                          return (
                            <div
                              key={step.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '13px',
                                fontWeight: isCurrent ? 800 : 600,
                                color: isDone
                                  ? '#6ee7b7'
                                  : isCurrent
                                    ? '#fdfbf7'
                                    : '#64748b',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                background: isCurrent
                                  ? 'rgba(136, 226, 219, 0.12)'
                                  : 'transparent',
                              }}
                            >
                              <span>
                                {isDone ? '✓' : isCurrent ? '▶' : '🔒'}
                              </span>
                              <span>
                                {idx + 1}. {step.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}

              <button
                type="button"
                className="abyss-btn abyss-btn-lilac"
                onClick={() => {
                  audio.playSfx('select');
                  onOpenAddChain();
                }}
              >
                + Create Custom Epic Chain
              </button>
            </>
          )}

          {tab === 'done' && (
            <>
              {completedQuests.length === 0 ? (
                <div
                  className="abyss-card"
                  style={{ textAlign: 'center', padding: '24px 14px' }}
                >
                  <p style={{ fontSize: '15px', color: '#cbd5e1' }}>
                    Completed quests will be chronicled here.
                  </p>
                </div>
              ) : (
                completedQuests.map((q) => {
                  const lastComp = q.completions[q.completions.length - 1];
                  return (
                    <div key={q.instanceId} className="abyss-card">
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '15px',
                            fontWeight: 800,
                            color: '#6ee7b7',
                          }}
                        >
                          ✓ {q.title}
                        </span>
                        <span className="abyss-badge-pill">
                          ×{q.completions.length}
                        </span>
                      </div>
                      {lastComp?.note && (
                        <p
                          style={{
                            fontSize: '13px',
                            color: '#fdfbf7',
                            fontStyle: 'italic',
                          }}
                        >
                          “{lastComp.note}”
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

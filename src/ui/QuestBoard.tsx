import React, { useState } from 'react';
import { audio } from '../audio/audio';
import { CHAIN_TEMPLATES } from '../data/chainTemplates';
import { QUEST_LIBRARY } from '../data/questLibrary';
import { pickDailySuggestions, toDateKey } from '../domain/daily';
import { baseXpForDifficulty } from '../domain/rewards';
import { useGameStore } from '../store/gameStore';

export interface QuestBoardProps {
  onClose: () => void;
  onOpenAddQuest: () => void;
  onOpenAddChain: () => void;
}

export const QuestBoard: React.FC<QuestBoardProps> = ({
  onClose,
  onOpenAddQuest,
  onOpenAddChain,
}) => {
  const player = useGameStore((s) => s.player);
  const quests = useGameStore((s) => s.quests);
  const chains = useGameStore((s) => s.chains);
  const acceptQuestTemplate = useGameStore((s) => s.acceptQuestTemplate);
  const startTemplateChain = useGameStore((s) => s.startTemplateChain);
  const consumeDailyReroll = useGameStore((s) => s.useDailyReroll);

  const [showEpics, setShowEpics] = useState(false);

  const todayKey = toDateKey(new Date().toISOString());
  const rerollUsedToday = player.dailyRerollUsedOn === todayKey;

  const suggestions = pickDailySuggestions(
    todayKey,
    player.prefs,
    QUEST_LIBRARY,
    rerollUsedToday ? 1 : 0,
  );

  const activeTemplateIds = new Set(
    quests.filter((q) => q.status === 'active').map((q) => q.id),
  );
  const existingChainIds = new Set(chains.map((c) => c.id));

  const handleReroll = () => {
    const ok = consumeDailyReroll(todayKey);
    if (ok) {
      audio.playSfx('select');
    }
  };

  return (
    <div className="abyss-modal-backdrop" data-testid="quest-board-modal">
      <div className="abyss-modal">
        <div className="abyss-modal-header">
          <span className="abyss-modal-title">📌 Town Quest Board</span>
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
          {/* Today's 3 Daily Suggestions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#88e2db',
              }}
            >
              Today&apos;s 3 Suggestions
            </span>

            <button
              type="button"
              data-testid="reroll-daily-btn"
              disabled={rerollUsedToday}
              onClick={handleReroll}
              className="abyss-btn"
              style={{
                minHeight: '36px',
                padding: '4px 10px',
                fontSize: '12px',
                opacity: rerollUsedToday ? 0.5 : 1,
              }}
            >
              {rerollUsedToday ? 'Rerolled Today ✓' : '🎲 Reroll (1 free/day)'}
            </button>
          </div>

          {suggestions.map((tpl) => {
            const isAccepted = activeTemplateIds.has(tpl.id);
            const xp = baseXpForDifficulty(tpl.difficulty);

            return (
              <div
                key={tpl.id}
                className="abyss-card"
                data-testid="board-suggestion-card"
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span className="abyss-badge-pill">{tpl.category}</span>
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
                  }}
                >
                  {tpl.title}
                </div>

                {tpl.flavor && (
                  <p
                    style={{
                      fontSize: '12px',
                      fontStyle: 'italic',
                      color: '#c2a0d9',
                    }}
                  >
                    “{tpl.flavor}”
                  </p>
                )}

                <button
                  type="button"
                  disabled={isAccepted}
                  data-testid="accept-suggestion-btn"
                  onClick={() => {
                    audio.playSfx('select');
                    acceptQuestTemplate(tpl, 'library');
                  }}
                  className={
                    isAccepted ? 'abyss-btn' : 'abyss-btn abyss-btn-primary'
                  }
                  style={{
                    marginTop: '4px',
                    opacity: isAccepted ? 0.65 : 1,
                  }}
                >
                  {isAccepted ? 'Accepted ✓' : 'Accept Quest'}
                </button>
              </div>
            );
          })}

          {/* Custom Quest & Epic Chain actions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '6px',
              paddingTop: '8px',
              borderTop: '1px solid #3f6b88',
            }}
          >
            <button
              type="button"
              data-testid="board-write-quest-btn"
              className="abyss-btn"
              onClick={() => {
                audio.playSfx('select');
                onOpenAddQuest();
              }}
            >
              ✍️ Write your own quest
            </button>

            <button
              type="button"
              data-testid="board-toggle-epics-btn"
              className="abyss-btn abyss-btn-lilac"
              onClick={() => {
                audio.playSfx('select');
                setShowEpics((v) => !v);
              }}
            >
              🗺️ {showEpics ? 'Hide Epic Quests' : 'Start an epic quest'}
            </button>

            {showEpics && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '4px',
                }}
              >
                {CHAIN_TEMPLATES.map((ct) => {
                  const started = existingChainIds.has(ct.id);
                  return (
                    <div key={ct.id} className="abyss-card">
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
                            color: '#88e2db',
                          }}
                        >
                          {ct.title}
                        </span>
                        <span className="abyss-badge-pill">
                          {ct.steps.length} steps
                        </span>
                      </div>
                      {ct.description && (
                        <p style={{ fontSize: '13px', color: '#cbd5e1' }}>
                          {ct.description}
                        </p>
                      )}
                      <button
                        type="button"
                        disabled={started}
                        onClick={() => {
                          audio.playSfx('select');
                          startTemplateChain(ct.id);
                        }}
                        className={
                          started ? 'abyss-btn' : 'abyss-btn abyss-btn-primary'
                        }
                      >
                        {started ? 'In Progress ✓' : 'Start Epic Chain'}
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="abyss-btn"
                  onClick={() => {
                    audio.playSfx('select');
                    onOpenAddChain();
                  }}
                >
                  + Design Custom Epic Chain
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

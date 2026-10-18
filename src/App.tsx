import React, { useEffect, useState } from 'react';
import { audio } from './audio/audio';
import { PhaserGame } from './game/PhaserGame';
import { eventBus } from './game/eventBus';
import { useGameStore } from './store/gameStore';
import { AddChainForm } from './ui/AddChainForm';
import { AddQuestForm } from './ui/AddQuestForm';
import { DialogBox } from './ui/DialogBox';
import { HouseScreen } from './ui/HouseScreen';
import { Hud } from './ui/Hud';
import { InnScreen } from './ui/InnScreen';
import { QuestBoard } from './ui/QuestBoard';
import { QuestLog } from './ui/QuestLog';
import { RewardModal } from './ui/RewardModal';

export type ActiveModal =
  | null
  | 'questLog'
  | 'questBoard'
  | 'addQuest'
  | 'addChain'
  | 'house'
  | 'inn';

export const App: React.FC = () => {
  const player = useGameStore((s) => s.player);
  const lastReward = useGameStore((s) => s.lastReward);
  const pendingReturnBonus = useGameStore((s) => s.pendingReturnBonus);
  const claimReturnBonus = useGameStore((s) => s.claimReturnBonus);
  const dismissReward = useGameStore((s) => s.dismissReward);
  const syncSessionDate = useGameStore((s) => s.syncSessionDate);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [showQuickBar, setShowQuickBar] = useState(true);
  const [npcDialog, setNpcDialog] = useState<{
    speaker: string;
    lines: string[];
  } | null>(null);

  // Sync session date & check return bonus on mount
  useEffect(() => {
    audio.setVolumes(player.musicVolume, player.sfxVolume);
    syncSessionDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeDialog =
    npcDialog ??
    (pendingReturnBonus?.eligible
      ? {
          speaker: 'Innkeeper Bram',
          lines: [pendingReturnBonus.message],
        }
      : null);

  const hasActiveDialog = activeDialog !== null;

  // Notify Phaser whenever a modal or dialog is open so world input pauses
  useEffect(() => {
    const isAnyUiOpen =
      activeModal !== null || lastReward !== null || hasActiveDialog;
    if (isAnyUiOpen) {
      eventBus.emit('ui:open', undefined);
    } else {
      eventBus.emit('ui:close', undefined);
    }
  }, [activeModal, lastReward, hasActiveDialog]);

  // Listen to Phaser world interactions
  useEffect(() => {
    const offBoard = eventBus.on('interact:board', () => {
      audio.playSfx('select');
      setActiveModal('questBoard');
    });
    const offHouse = eventBus.on('interact:house', () => {
      audio.playSfx('select');
      setActiveModal('house');
    });
    const offInn = eventBus.on('interact:inn', () => {
      audio.playSfx('select');
      setActiveModal('inn');
    });
    const offNpc = eventBus.on('interact:npc', (payload) => {
      audio.playSfx('select');
      setNpcDialog({
        speaker: payload.name,
        lines: [payload.text],
      });
    });
    const offSign = eventBus.on('interact:sign', (payload) => {
      audio.playSfx('select');
      setNpcDialog({
        speaker: payload.title,
        lines: [payload.text],
      });
    });

    return () => {
      offBoard();
      offHouse();
      offInn();
      offNpc();
      offSign();
    };
  }, []);

  return (
    <main
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        display: 'grid',
        placeItems: 'center',
        backgroundColor: '#0a121e',
        overflow: 'hidden',
        boxSizing: 'border-box',
        padding:
          'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
      }}
    >
      {/* 9:16 Portrait Stage Container (Option 3: Ghost in the Pastel) */}
      <div
        style={{
          width: 'min(92vw, 440px)',
          height: 'min(88dvh, 760px)',
          aspectRatio: '9 / 16',
          maxHeight: 'calc(100dvh - 32px)',
          maxWidth: 'calc(100vw - 32px)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '3px solid #17273d',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow:
            '0 0 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(136, 226, 219, 0.18)',
        }}
      >
        {/* Canvas Layer: Pixel art world only */}
        <PhaserGame />

        {/* UI Overlay Layer: Real HTML vector typography */}
        <div
          id="ui-layer"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '12px',
          }}
        >
          {/* Top HUD */}
          <Hud
            onOpenQuestLog={() => setActiveModal('questLog')}
            onOpenQuickMenu={() => setShowQuickBar((v) => !v)}
          />

          {/* Bottom Area: Quick Town Places Menu / Active NPC Dialog */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {showQuickBar && !activeDialog && (
              <nav
                aria-label="Town quick travel"
                data-testid="town-quick-nav"
                style={{
                  pointerEvents: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  background: 'rgba(16, 28, 46, 0.9)',
                  padding: '6px',
                  borderRadius: '10px',
                  border: '1.5px solid #3f6b88',
                  backdropFilter: 'blur(6px)',
                }}
              >
                <button
                  type="button"
                  data-testid="nav-quest-board-btn"
                  className="abyss-btn"
                  onClick={() => {
                    audio.playSfx('select');
                    setActiveModal('questBoard');
                  }}
                  style={{ fontSize: '13px', padding: '6px 8px' }}
                >
                  📌 Board
                </button>
                <button
                  type="button"
                  data-testid="nav-house-btn"
                  className="abyss-btn"
                  onClick={() => {
                    audio.playSfx('select');
                    setActiveModal('house');
                  }}
                  style={{ fontSize: '13px', padding: '6px 8px' }}
                >
                  🏠 House
                </button>
                <button
                  type="button"
                  data-testid="nav-inn-btn"
                  className="abyss-btn"
                  onClick={() => {
                    audio.playSfx('select');
                    setActiveModal('inn');
                  }}
                  style={{ fontSize: '13px', padding: '6px 8px' }}
                >
                  🏮 Inn
                </button>
              </nav>
            )}

            {activeDialog && (
              <DialogBox
                speaker={activeDialog.speaker}
                lines={activeDialog.lines}
                onComplete={() => {
                  if (npcDialog) {
                    setNpcDialog(null);
                  } else if (pendingReturnBonus?.eligible) {
                    claimReturnBonus();
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        {activeModal === 'questLog' && (
          <QuestLog
            onClose={() => setActiveModal(null)}
            onOpenAddQuest={() => setActiveModal('addQuest')}
            onOpenAddChain={() => setActiveModal('addChain')}
          />
        )}

        {activeModal === 'questBoard' && (
          <QuestBoard
            onClose={() => setActiveModal(null)}
            onOpenAddQuest={() => setActiveModal('addQuest')}
            onOpenAddChain={() => setActiveModal('addChain')}
          />
        )}

        {activeModal === 'addQuest' && (
          <AddQuestForm
            onClose={() => setActiveModal('questLog')}
            onCreated={() => setActiveModal('questLog')}
          />
        )}

        {activeModal === 'addChain' && (
          <AddChainForm
            onClose={() => setActiveModal('questLog')}
            onCreated={() => setActiveModal('questLog')}
          />
        )}

        {activeModal === 'house' && (
          <HouseScreen onClose={() => setActiveModal(null)} />
        )}

        {activeModal === 'inn' && (
          <InnScreen onClose={() => setActiveModal(null)} />
        )}

        {lastReward && (
          <RewardModal
            playerName={player.name}
            reward={lastReward}
            onDismiss={dismissReward}
          />
        )}
      </div>
    </main>
  );
};

export default App;

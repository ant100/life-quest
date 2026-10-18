import React, { useRef, useState } from 'react';
import { audio } from '../audio/audio';
import { parseImportedJson } from '../domain/importExport';
import { computeReturnBonus } from '../domain/returnBonus';
import { useGameStore } from '../store/gameStore';

export interface InnScreenProps {
  onClose: () => void;
}

export const InnScreen: React.FC<InnScreenProps> = ({ onClose }) => {
  const player = useGameStore((s) => s.player);
  const pendingReturnBonus = useGameStore((s) => s.pendingReturnBonus);
  const returnBonusClaimedOn = useGameStore((s) => s.returnBonusClaimedOn);
  const claimReturnBonus = useGameStore((s) => s.claimReturnBonus);
  const setVolumes = useGameStore((s) => s.setVolumes);
  const renamePlayer = useGameStore((s) => s.renamePlayer);
  const exportSaveJson = useGameStore((s) => s.exportSaveJson);
  const importFromJson = useGameStore((s) => s.importFromJson);
  const resetGame = useGameStore((s) => s.resetGame);

  const [nameInput, setNameInput] = useState(player.name);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingSaveReplaceJson, setPendingSaveReplaceJson] = useState<
    string | null
  >(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pasteText, setPasteText] = useState('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const nowIso = new Date().toISOString();
  const todayKey = nowIso.slice(0, 10);
  const computedBonus =
    pendingReturnBonus ?? computeReturnBonus(player.lastSeen, todayKey);
  const canClaimBonus =
    computedBonus.eligible && returnBonusClaimedOn !== todayKey;

  const handleClaimBonus = () => {
    const res = claimReturnBonus(nowIso);
    if (res) {
      audio.playJingle('complete');
      setStatusMessage(res.message);
    }
  };

  const handleVolumeChange = (music: number, sfx: number) => {
    setVolumes(music, sfx);
    audio.setVolumes(music, sfx);
  };

  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    renamePlayer(nameInput.trim());
    audio.playSfx('select');
    setStatusMessage(`Name updated to "${nameInput.trim()}".`);
  };

  const handleExport = () => {
    audio.playSfx('select');
    const json = exportSaveJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `life-quest-save-${todayKey}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage('Save file exported!');
  };

  const processRawImportJson = (rawText: string) => {
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const parsed = parseImportedJson(rawText);
      if (parsed.kind === 'save') {
        setPendingSaveReplaceJson(rawText);
        return;
      }
      const result = importFromJson(rawText);
      audio.playJingle('complete');
      setStatusMessage(result.summary);
      setPasteText('');
      setShowPasteBox(false);
    } catch (err) {
      audio.playSfx('cancel');
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to import JSON.',
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    processRawImportJson(text);
    e.target.value = '';
  };

  const handleConfirmSaveReplace = () => {
    if (!pendingSaveReplaceJson) return;
    try {
      const res = importFromJson(pendingSaveReplaceJson);
      audio.playJingle('complete');
      setStatusMessage(res.summary);
      setPendingSaveReplaceJson(null);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to restore save.',
      );
    }
  };

  return (
    <div className="abyss-modal-backdrop" data-testid="inn-screen-modal">
      <div className="abyss-modal">
        <div className="abyss-modal-header">
          <span className="abyss-modal-title">🏮 The Hearthstone Inn</span>
          <button
            type="button"
            data-testid="close-inn-btn"
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
          {/* Innkeeper Dialogue & Return Bonus */}
          <div className="abyss-card">
            <div
              style={{
                fontSize: '13px',
                fontWeight: 800,
                color: '#c2a0d9',
                textTransform: 'uppercase',
              }}
            >
              Innkeeper Bram
            </div>

            {canClaimBonus ? (
              <div data-testid="inn-return-bonus-banner">
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#fdfbf7',
                    marginBottom: '8px',
                  }}
                >
                  “{computedBonus.message}”
                </p>
                <button
                  type="button"
                  data-testid="claim-return-bonus-btn"
                  onClick={handleClaimBonus}
                  className="abyss-btn abyss-btn-primary"
                  style={{ width: '100%' }}
                >
                  ✨ Claim Rest Bonus (+{computedBonus.bonusXp} EXP)
                </button>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#fdfbf7', lineHeight: 1.4 }}>
                “Welcome to the Hearthstone Inn, {player.name}! Rest your feet by
                the fire, tune your settings, or import a Quest Pack.”
              </p>
            )}
          </div>

          {statusMessage && (
            <div
              data-testid="inn-status-msg"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(110, 231, 183, 0.16)',
                border: '1px solid #6ee7b7',
                color: '#6ee7b7',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div
              data-testid="inn-error-msg"
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: 'rgba(252, 165, 165, 0.16)',
                border: '1px solid #fca5a5',
                color: '#fca5a5',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Audio Settings */}
          <div className="abyss-card">
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#88e2db',
              }}
            >
              🎵 Audio Settings
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                Music ({Math.round(player.musicVolume * 100)}%)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  aria-label="Music volume"
                  value={player.musicVolume}
                  onChange={(e) =>
                    handleVolumeChange(
                      parseFloat(e.target.value),
                      player.sfxVolume,
                    )
                  }
                />
                <button
                  type="button"
                  data-testid="inn-music-toggle"
                  className="abyss-btn"
                  onClick={() =>
                    handleVolumeChange(
                      player.musicVolume > 0 ? 0 : 0.6,
                      player.sfxVolume,
                    )
                  }
                  style={{ minHeight: '36px', padding: '4px 10px', fontSize: '12px' }}
                >
                  {player.musicVolume > 0 ? 'Mute' : 'Unmute'}
                </button>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 700 }}>
                SFX ({Math.round(player.sfxVolume * 100)}%)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  aria-label="SFX volume"
                  value={player.sfxVolume}
                  onChange={(e) =>
                    handleVolumeChange(
                      player.musicVolume,
                      parseFloat(e.target.value),
                    )
                  }
                />
                <button
                  type="button"
                  data-testid="inn-sfx-toggle"
                  className="abyss-btn"
                  onClick={() =>
                    handleVolumeChange(
                      player.musicVolume,
                      player.sfxVolume > 0 ? 0 : 0.8,
                    )
                  }
                  style={{ minHeight: '36px', padding: '4px 10px', fontSize: '12px' }}
                >
                  {player.sfxVolume > 0 ? 'Mute' : 'Unmute'}
                </button>
              </div>
            </div>
          </div>

          {/* Rename Adventurer */}
          <form className="abyss-card" onSubmit={handleRename}>
            <label
              htmlFor="inn-rename-input"
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#88e2db',
              }}
            >
              🪪 Adventurer Name
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="inn-rename-input"
                className="abyss-input"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              <button type="submit" className="abyss-btn abyss-btn-primary">
                Save
              </button>
            </div>
          </form>

          {/* Import / Export Save or QuestPack */}
          <div className="abyss-card">
            <div
              style={{
                fontSize: '14px',
                fontWeight: 800,
                color: '#c2a0d9',
              }}
            >
              📦 Save File &amp; Quest Packs
            </div>
            <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
              Import a QuestPack (such as <code>seeds/ann.json</code>) to add
              new quests &amp; epic chains without losing your progress, or back
              up your full save.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              data-testid="inn-import-file-input"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                data-testid="inn-import-btn"
                className="abyss-btn abyss-btn-primary"
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1 }}
              >
                📂 Import JSON File
              </button>

              <button
                type="button"
                data-testid="inn-export-btn"
                className="abyss-btn"
                onClick={handleExport}
                style={{ flex: 1 }}
              >
                💾 Export Save
              </button>
            </div>

            <button
              type="button"
              data-testid="inn-toggle-paste-btn"
              className="abyss-btn"
              onClick={() => setShowPasteBox((v) => !v)}
              style={{ fontSize: '12px', minHeight: '36px' }}
            >
              {showPasteBox
                ? 'Hide Paste JSON Box'
                : '📋 Or Paste QuestPack / Save JSON'}
            </button>

            {showPasteBox && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  marginTop: '4px',
                }}
              >
                <textarea
                  data-testid="inn-import-json-textarea"
                  className="abyss-input"
                  rows={4}
                  placeholder="Paste QuestPack or SaveFile JSON here..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  style={{ fontSize: '13px' }}
                />
                <button
                  type="button"
                  data-testid="inn-submit-paste-btn"
                  className="abyss-btn abyss-btn-primary"
                  onClick={() => processRawImportJson(pasteText)}
                >
                  Import Pasted JSON
                </button>
              </div>
            )}

            {pendingSaveReplaceJson && (
              <div
                data-testid="confirm-save-replace-box"
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'rgba(246, 200, 106, 0.15)',
                  border: '1px solid #f6c86a',
                  marginTop: '6px',
                }}
              >
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#f6c86a',
                    marginBottom: '8px',
                  }}
                >
                  This is a full save file. Replace your current progress with
                  this save?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="abyss-btn"
                    onClick={() => setPendingSaveReplaceJson(null)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-save-replace-btn"
                    className="abyss-btn abyss-btn-primary"
                    onClick={handleConfirmSaveReplace}
                    style={{ flex: 1 }}
                  >
                    Replace Save
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Reset Game */}
          <div className="abyss-card">
            {!confirmReset ? (
              <button
                type="button"
                data-testid="inn-reset-game-btn"
                className="abyss-btn"
                onClick={() => setConfirmReset(true)}
                style={{ color: '#fca5a5', borderColor: '#7f1d1d' }}
              >
                🔄 Reset Adventure
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#fca5a5',
                  }}
                >
                  Are you sure you want to start a brand-new adventure?
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="abyss-btn"
                    onClick={() => setConfirmReset(false)}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    data-testid="confirm-reset-btn"
                    className="abyss-btn"
                    onClick={() => {
                      resetGame();
                      onClose();
                    }}
                    style={{
                      flex: 1,
                      background: '#dc2626',
                      color: '#fff',
                      borderColor: '#dc2626',
                    }}
                  >
                    Yes, Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

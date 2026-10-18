import React, { useState } from 'react';
import { audio } from '../audio/audio';
import type { Category, Difficulty, Recurrence } from '../domain/types';
import { useGameStore } from '../store/gameStore';

export interface AddQuestFormProps {
  onClose: () => void;
  onCreated?: () => void;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'personal', label: '✨ Personal' },
  { value: 'detox', label: '🌿 Detox' },
  { value: 'body', label: '⚡ Body' },
  { value: 'mind', label: '📖 Mind' },
  { value: 'wealth', label: '🪙 Wealth' },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 1, label: '★ Easy (15 EXP)' },
  { value: 2, label: '★★ Medium (30 EXP)' },
  { value: 3, label: '★★★ Epic (60 EXP)' },
];

const RECURRENCES: { value: Recurrence; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

export const AddQuestForm: React.FC<AddQuestFormProps> = ({
  onClose,
  onCreated,
}) => {
  const addCustomQuest = useGameStore((s) => s.addCustomQuest);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('personal');
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [recurrence, setRecurrence] = useState<Recurrence>('once');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a quest title.');
      return;
    }
    audio.playSfx('select');
    addCustomQuest({
      title: title.trim(),
      category,
      difficulty,
      recurrence,
    });
    if (onCreated) onCreated();
    onClose();
  };

  return (
    <div className="abyss-modal-backdrop" data-testid="add-quest-modal">
      <div className="abyss-modal">
        <div className="abyss-modal-header">
          <span className="abyss-modal-title">✍️ Write Your Own Quest</span>
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

        <form className="abyss-modal-body" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="custom-quest-title"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#88e2db',
                marginBottom: '6px',
              }}
            >
              Quest Title (required)
            </label>
            <input
              id="custom-quest-title"
              data-testid="custom-quest-title-input"
              className="abyss-input"
              type="text"
              placeholder="e.g. Call Grandma, 20m guitar practice..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
              autoFocus
            />
            {error && (
              <p
                style={{
                  color: '#fca5a5',
                  fontSize: '13px',
                  marginTop: '4px',
                  fontWeight: 600,
                }}
              >
                {error}
              </p>
            )}
          </div>

          <div>
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#c2a0d9',
                marginBottom: '6px',
              }}
            >
              Category
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={
                    category === c.value
                      ? 'abyss-btn abyss-btn-primary'
                      : 'abyss-btn'
                  }
                  style={{ fontSize: '13px', padding: '6px 10px' }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#c2a0d9',
                marginBottom: '6px',
              }}
            >
              Difficulty
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={
                    difficulty === d.value
                      ? 'abyss-btn abyss-btn-primary'
                      : 'abyss-btn'
                  }
                  style={{ fontSize: '13px', padding: '6px 10px', flex: 1 }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#c2a0d9',
                marginBottom: '6px',
              }}
            >
              Recurrence
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {RECURRENCES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRecurrence(r.value)}
                  className={
                    recurrence === r.value
                      ? 'abyss-btn abyss-btn-primary'
                      : 'abyss-btn'
                  }
                  style={{ fontSize: '13px', padding: '6px 10px', flex: 1 }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginTop: '6px',
            }}
          >
            <button
              type="button"
              className="abyss-btn"
              onClick={() => {
                audio.playSfx('cancel');
                onClose();
              }}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              data-testid="submit-custom-quest-btn"
              className="abyss-btn abyss-btn-primary"
              style={{ flex: 2 }}
            >
              Accept Quest
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

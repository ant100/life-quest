import React, { useState } from 'react';
import { audio } from '../audio/audio';
import { useGameStore } from '../store/gameStore';

export interface AddChainFormProps {
  onClose: () => void;
  onCreated?: () => void;
}

export const AddChainForm: React.FC<AddChainFormProps> = ({
  onClose,
  onCreated,
}) => {
  const addCustomChain = useGameStore((s) => s.addCustomChain);
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState<string[]>(['', '']);
  const [error, setError] = useState('');

  const handleStepChange = (index: number, value: string) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
    setError('');
  };

  const handleAddStep = () => {
    if (steps.length >= 10) return;
    audio.playSfx('select');
    setSteps((prev) => [...prev, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 2) return;
    audio.playSfx('cancel');
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    const validSteps = steps.map((s) => s.trim()).filter(Boolean);

    if (!cleanTitle) {
      setError('Please enter an epic quest title.');
      return;
    }
    if (validSteps.length < 2) {
      setError('Please enter at least 2 steps for your epic quest.');
      return;
    }

    audio.playSfx('select');
    addCustomChain({
      title: cleanTitle,
      stepTitles: validSteps,
    });
    if (onCreated) onCreated();
    onClose();
  };

  return (
    <div className="abyss-modal-backdrop" data-testid="add-chain-modal">
      <div className="abyss-modal">
        <div className="abyss-modal-header">
          <span className="abyss-modal-title">🗺️ Create Epic Quest Chain</span>
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
              htmlFor="custom-chain-title"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 700,
                color: '#88e2db',
                marginBottom: '6px',
              }}
            >
              Epic Adventure Title
            </label>
            <input
              id="custom-chain-title"
              data-testid="custom-chain-title-input"
              className="abyss-input"
              type="text"
              placeholder="e.g. Run a 10K, Launch Personal Website..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError('');
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#c2a0d9',
              }}
            >
              Steps (2 to 10 — only the current step is active at a time)
            </span>

            {steps.map((stepVal, idx) => (
              <div
                key={idx}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#88e2db',
                    minWidth: '22px',
                  }}
                >
                  #{idx + 1}
                </span>
                <input
                  className="abyss-input"
                  data-testid={`custom-chain-step-${idx}`}
                  type="text"
                  placeholder={`Step ${idx + 1} milestone...`}
                  value={stepVal}
                  onChange={(e) => handleStepChange(idx, e.target.value)}
                />
                {steps.length > 2 && (
                  <button
                    type="button"
                    className="abyss-btn"
                    onClick={() => handleRemoveStep(idx)}
                    aria-label={`Remove step ${idx + 1}`}
                    style={{ padding: '0 10px' }}
                  >
                    −
                  </button>
                )}
              </div>
            ))}

            {steps.length < 10 && (
              <button
                type="button"
                data-testid="add-chain-step-btn"
                className="abyss-btn"
                onClick={handleAddStep}
                style={{ alignSelf: 'flex-start', fontSize: '13px' }}
              >
                + Add Step ({steps.length}/10)
              </button>
            )}
          </div>

          {error && (
            <p
              style={{
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
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
              data-testid="submit-custom-chain-btn"
              className="abyss-btn abyss-btn-primary"
              style={{ flex: 2 }}
            >
              Begin Epic Chain
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

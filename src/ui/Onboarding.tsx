import React, { useEffect, useState } from 'react';
import { audio } from '../audio/audio';
import { CHAIN_TEMPLATES } from '../data/chainTemplates';
import { QUEST_LIBRARY } from '../data/questLibrary';
import { pickStarterQuests } from '../domain/daily';
import type { Category, SpriteIndex } from '../domain/types';
import { useGameStore } from '../store/gameStore';

const BASE = import.meta.env.BASE_URL || '/';

const SPRITE_OPTIONS: {
  index: SpriteIndex;
  label: string;
  file: string;
}[] = [
  { index: 0, label: 'Azure Ninja', file: `${BASE}assets/characters/ninja_blue.png` },
  {
    index: 1,
    label: 'Cobalt Samurai',
    file: `${BASE}assets/characters/samurai_blue.png`,
  },
  {
    index: 2,
    label: 'Jade Ronin',
    file: `${BASE}assets/characters/samurai_green.png`,
  },
  { index: 3, label: 'Town Scout', file: `${BASE}assets/characters/boy.png` },
];

const MOOD_OPTIONS: { id: string; label: string; desc: string }[] = [
  { id: 'exhausted', label: '😮‍💨 Exhausted', desc: 'Gentle, low-effort wins first' },
  { id: 'stuck', label: '🪨 Stuck', desc: 'Break inertia with small steps' },
  { id: 'restless', label: '⚡ Restless', desc: 'Channel energy into action' },
  { id: 'okay', label: '🌱 Doing OK', desc: 'Ready for a balanced mix' },
];

const FOCUS_OPTIONS: { category: Category; label: string; sub: string }[] = [
  { category: 'detox', label: '🌿 Calm', sub: 'Unplug & rest your eyes' },
  { category: 'body', label: '⚡ Health', sub: 'Walk, stretch & sleep' },
  { category: 'mind', label: '📖 Growth', sub: 'Read, create & reflect' },
  { category: 'wealth', label: '🪙 Money', sub: 'Save & automate calmly' },
];

export const Onboarding: React.FC = () => {
  const completeOnboarding = useGameStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [name, setName] = useState('');
  const [sprite, setSprite] = useState<SpriteIndex>(0);
  const [mood, setMood] = useState('exhausted');
  const [focus, setFocus] = useState<Category[]>(['detox', 'body']);
  const [selectedChainId, setSelectedChainId] = useState<string>('');
  const [customMode, setCustomMode] = useState(false);
  const [customChainTitle, setCustomChainTitle] = useState('');
  const [customSteps, setCustomSteps] = useState<string[]>(['', '']);

  useEffect(() => {
    audio.playMusic('mentor');
  }, []);

  const toggleFocus = (cat: Category) => {
    audio.playSfx('select');
    setFocus((prev) => {
      if (prev.includes(cat)) {
        return prev.length > 1 ? prev.filter((c) => c !== cat) : prev;
      }
      return [...prev, cat];
    });
  };

  const starterPreview = pickStarterQuests({ mood, focus }, QUEST_LIBRARY);

  const handleFinish = () => {
    audio.playSfx('complete');
    const cleanCustomSteps = customSteps.map((s) => s.trim()).filter(Boolean);
    const hasValidCustomChain =
      customMode &&
      customChainTitle.trim().length > 0 &&
      cleanCustomSteps.length >= 2;

    completeOnboarding({
      name: name.trim() || 'Traveler',
      sprite,
      mood,
      focus,
      selectedChainTemplateId:
        !hasValidCustomChain && selectedChainId ? selectedChainId : undefined,
      customChain: hasValidCustomChain
        ? {
            title: customChainTitle.trim(),
            stepTitles: cleanCustomSteps,
          }
        : undefined,
    });

    audio.playMusic('town');
  };

  return (
    <div
      className="abyss-modal-backdrop"
      data-testid="onboarding-screen"
      style={{
        background: 'rgba(10, 18, 30, 0.94)',
        zIndex: 60,
      }}
    >
      <div className="abyss-modal" style={{ maxHeight: '100%' }}>
        {/* Header with Mentor Portrait */}
        <div className="abyss-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              aria-hidden="true"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '2px solid #88e2db',
                backgroundColor: '#101c2e',
                backgroundImage: `url(${BASE}assets/characters/master.png)`,
                backgroundPosition: '0 0',
                backgroundSize: '400% 700%',
                imageRendering: 'pixelated',
              }}
            />
            <div>
              <div className="abyss-modal-title" style={{ fontSize: '16px' }}>
                Professor Rowan
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#c2a0d9',
                }}
              >
                Step {step + 1} of 5 · Setup ≤ 60s
              </div>
            </div>
          </div>
        </div>

        <div className="abyss-modal-body" style={{ gap: '12px' }}>
          {/* STEP 0: NAME */}
          {step === 0 && (
            <>
              <div className="firered-textbox">
                “Welcome to <strong>Life Quest</strong>! Your real life is the
                adventure—this game just keeps score. What is your name,
                traveler?”
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  audio.unlock();
                  audio.playMusic('mentor');
                  audio.playSfx('select');
                  setStep(1);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
              >
                <input
                  data-testid="onboarding-name-input"
                  className="abyss-input"
                  type="text"
                  placeholder="Enter your name (e.g. Ann)..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />

                <button
                  type="submit"
                  data-testid="onboarding-next-btn"
                  className="abyss-btn abyss-btn-primary"
                >
                  Continue →
                </button>
              </form>
            </>
          )}

          {/* STEP 1: CHOOSE SPRITE */}
          {step === 1 && (
            <>
              <div className="firered-textbox">
                “Good to meet you, <strong>{name.trim() || 'Traveler'}</strong>!
                Choose your adventurer sprite:”
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                }}
              >
                {SPRITE_OPTIONS.map((opt) => {
                  const selected = sprite === opt.index;
                  return (
                    <button
                      key={opt.index}
                      type="button"
                      data-testid={`sprite-option-${opt.index}`}
                      onClick={() => {
                        audio.playSfx('select');
                        setSprite(opt.index);
                      }}
                      className="abyss-card"
                      style={{
                        alignItems: 'center',
                        padding: '12px 8px',
                        borderColor: selected ? '#88e2db' : '#3f6b88',
                        background: selected
                          ? 'rgba(136, 226, 219, 0.16)'
                          : '#17273d',
                      }}
                    >
                      <div
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundImage: `url(${opt.file})`,
                          backgroundPosition: '0 0',
                          backgroundSize: '400% 700%',
                          imageRendering: 'pixelated',
                        }}
                      />
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 800,
                          color: selected ? '#88e2db' : '#fdfbf7',
                        }}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                data-testid="onboarding-next-btn"
                className="abyss-btn abyss-btn-primary"
                onClick={() => {
                  audio.playSfx('select');
                  setStep(2);
                }}
              >
                Continue →
              </button>
            </>
          )}

          {/* STEP 2: MOOD */}
          {step === 2 && (
            <>
              <div className="firered-textbox">
                “How have you been feeling lately? No wrong answers—we calibrate
                your quests to match your energy.”
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MOOD_OPTIONS.map((m) => {
                  const selected = mood === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      data-testid={`mood-option-${m.id}`}
                      onClick={() => {
                        audio.playSfx('select');
                        setMood(m.id);
                      }}
                      className="abyss-card"
                      style={{
                        textAlign: 'left',
                        borderColor: selected ? '#88e2db' : '#3f6b88',
                        background: selected
                          ? 'rgba(136, 226, 219, 0.16)'
                          : '#17273d',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: selected ? '#88e2db' : '#fdfbf7',
                        }}
                      >
                        {selected ? '▶ ' : ''}
                        {m.label}
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                        {m.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                data-testid="onboarding-next-btn"
                className="abyss-btn abyss-btn-primary"
                onClick={() => {
                  audio.playSfx('select');
                  setStep(3);
                }}
              >
                Continue →
              </button>
            </>
          )}

          {/* STEP 3: FOCUS CATEGORIES */}
          {step === 3 && (
            <>
              <div className="firered-textbox">
                “What would you like more of? Pick as many as you like:”
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                }}
              >
                {FOCUS_OPTIONS.map((f) => {
                  const active = focus.includes(f.category);
                  return (
                    <button
                      key={f.category}
                      type="button"
                      data-testid={`focus-option-${f.category}`}
                      onClick={() => toggleFocus(f.category)}
                      className="abyss-card"
                      style={{
                        textAlign: 'left',
                        borderColor: active ? '#88e2db' : '#3f6b88',
                        background: active
                          ? 'rgba(136, 226, 219, 0.16)'
                          : '#17273d',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 800,
                          color: active ? '#88e2db' : '#fdfbf7',
                        }}
                      >
                        {active ? '✓ ' : ''}
                        {f.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                        {f.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="abyss-card" style={{ padding: '10px' }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    color: '#c2a0d9',
                  }}
                >
                  3 Starter Quests Ready for Today:
                </div>
                {starterPreview.map((q) => (
                  <div
                    key={q.id}
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#fdfbf7',
                    }}
                  >
                    • {q.title}
                  </div>
                ))}
              </div>

              <button
                type="button"
                data-testid="onboarding-next-btn"
                className="abyss-btn abyss-btn-primary"
                onClick={() => {
                  audio.playSfx('select');
                  setStep(4);
                }}
              >
                Continue →
              </button>
            </>
          )}

          {/* STEP 4: OPTIONAL EPIC QUEST CHAIN */}
          {step === 4 && (
            <>
              <div className="firered-textbox">
                “Is there a big adventure on your mind? Pick an Epic Chain to
                unlock step-by-step, write your own, or skip straight to Town!”
              </div>

              {!customMode ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {CHAIN_TEMPLATES.map((ct) => {
                    const chosen = selectedChainId === ct.id;
                    return (
                      <button
                        key={ct.id}
                        type="button"
                        data-testid={`onboarding-chain-${ct.id}`}
                        onClick={() => {
                          audio.playSfx('select');
                          setSelectedChainId(chosen ? '' : ct.id);
                        }}
                        className="abyss-card"
                        style={{
                          textAlign: 'left',
                          padding: '10px',
                          borderColor: chosen ? '#88e2db' : '#3f6b88',
                          background: chosen
                            ? 'rgba(136, 226, 219, 0.16)'
                            : '#17273d',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 800,
                              color: chosen ? '#88e2db' : '#fdfbf7',
                            }}
                          >
                            {chosen ? '✓ ' : '🗺️ '}
                            {ct.title}
                          </span>
                          <span className="abyss-badge-pill">
                            {ct.steps.length} steps
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                          First step: {ct.steps[0]?.title}
                        </div>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    className="abyss-btn"
                    onClick={() => {
                      audio.playSfx('select');
                      setCustomMode(true);
                    }}
                    style={{ fontSize: '13px' }}
                  >
                    ✍️ Or write my own Epic Adventure
                  </button>
                </div>
              ) : (
                <div className="abyss-card">
                  <input
                    className="abyss-input"
                    type="text"
                    placeholder="Epic chain title..."
                    value={customChainTitle}
                    onChange={(e) => setCustomChainTitle(e.target.value)}
                  />
                  {customSteps.map((st, idx) => (
                    <input
                      key={idx}
                      className="abyss-input"
                      type="text"
                      placeholder={`Step ${idx + 1}...`}
                      value={st}
                      onChange={(e) =>
                        setCustomSteps((prev) =>
                          prev.map((v, i) => (i === idx ? e.target.value : v)),
                        )
                      }
                    />
                  ))}
                  {customSteps.length < 10 && (
                    <button
                      type="button"
                      className="abyss-btn"
                      onClick={() => setCustomSteps((prev) => [...prev, ''])}
                      style={{ fontSize: '12px', minHeight: '36px' }}
                    >
                      + Add Step
                    </button>
                  )}
                  <button
                    type="button"
                    className="abyss-btn"
                    onClick={() => setCustomMode(false)}
                    style={{ fontSize: '12px', minHeight: '36px' }}
                  >
                    ← Back to Templates
                  </button>
                </div>
              )}

              <button
                type="button"
                data-testid="onboarding-finish-btn"
                className="abyss-btn abyss-btn-primary"
                onClick={handleFinish}
              >
                {selectedChainId || (customMode && customChainTitle.trim())
                  ? 'Begin Adventure in Town! →'
                  : 'Skip & Enter Town →'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

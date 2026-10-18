import fs from 'node:fs';
import path from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { AddChainForm } from './AddChainForm';
import { AddQuestForm } from './AddQuestForm';
import { DialogBox } from './DialogBox';
import { HouseScreen } from './HouseScreen';
import { Hud } from './Hud';
import { InnScreen } from './InnScreen';
import { Onboarding } from './Onboarding';
import { QuestBoard } from './QuestBoard';
import { QuestLog } from './QuestLog';
import { RewardModal } from './RewardModal';

describe('UI Overlays & Onboarding (Milestones 2 & 4)', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetGame('2026-10-18T09:00:00Z');
    useGameStore.getState().completeOnboarding({
      name: 'Ann',
      sprite: 0,
      mood: 'exhausted',
      focus: ['detox', 'body'],
      now: '2026-10-18T09:00:00Z',
    });
  });

  it('completes the 5-step Professor Rowan Onboarding flow and auto-accepts 3 starter quests', () => {
    useGameStore.getState().resetGame('2026-10-18T09:00:00Z');
    expect(useGameStore.getState().onboardingDone).toBe(false);

    render(<Onboarding />);

    // Step 0: Name
    fireEvent.change(screen.getByTestId('onboarding-name-input'), {
      target: { value: 'Ann' },
    });
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));

    // Step 1: Sprite
    fireEvent.click(screen.getByTestId('sprite-option-1'));
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));

    // Step 2: Mood
    fireEvent.click(screen.getByTestId('mood-option-exhausted'));
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));

    // Step 3: Focus
    fireEvent.click(screen.getByTestId('focus-option-mind'));
    fireEvent.click(screen.getByTestId('onboarding-next-btn'));

    // Step 4: Finish -> Town
    fireEvent.click(screen.getByTestId('onboarding-finish-btn'));

    const state = useGameStore.getState();
    expect(state.onboardingDone).toBe(true);
    expect(state.player.name).toBe('Ann');
    expect(state.player.sprite).toBe(1);
    expect(state.quests).toHaveLength(3);
  });

  it('renders HUD with player level, EXP bar, and active quest count', () => {
    const onOpenLog = vi.fn();
    render(<Hud onOpenQuestLog={onOpenLog} />);

    expect(screen.getByTestId('hud-level').textContent).toBe('LV.1');
    expect(screen.getByText('Ann')).toBeTruthy();

    const questBtn = screen.getByTestId('hud-quest-log-btn');
    expect(questBtn.textContent).toContain('Quests (3)');
    fireEvent.click(questBtn);
    expect(onOpenLog).toHaveBeenCalledOnce();
  });

  it('completes a quest in QuestLog with 1 tap and triggers RewardOutcome', () => {
    render(
      <QuestLog
        onClose={() => {}}
        onOpenAddQuest={() => {}}
        onOpenAddChain={() => {}}
      />,
    );

    const doneButtons = screen.getAllByTestId('quest-done-btn');
    expect(doneButtons.length).toBe(3);

    fireEvent.click(doneButtons[0]!);

    const reward = useGameStore.getState().lastReward;
    expect(reward).not.toBeNull();
    expect(reward?.totalXp).toBeGreaterThan(0);

    render(
      <RewardModal
        playerName="Ann"
        reward={reward!}
        onDismiss={() => useGameStore.getState().dismissReward()}
      />,
    );

    expect(screen.getByTestId('reward-modal')).toBeTruthy();
    expect(screen.getByTestId('reward-closing-nudge')).toBeTruthy();
  });

  it('offers 3 daily suggestions on the QuestBoard and allows 1 free reroll per day', () => {
    render(
      <QuestBoard
        onClose={() => {}}
        onOpenAddQuest={() => {}}
        onOpenAddChain={() => {}}
      />,
    );

    const cards = screen.getAllByTestId('board-suggestion-card');
    expect(cards).toHaveLength(3);

    const rerollBtn = screen.getByTestId('reroll-daily-btn') as HTMLButtonElement;
    expect(rerollBtn.disabled).toBe(false);
    fireEvent.click(rerollBtn);
    expect(rerollBtn.disabled).toBe(true);
  });

  it('creates custom quests and custom chains via AddQuestForm and AddChainForm', () => {
    const onCloseQ = vi.fn();
    render(<AddQuestForm onClose={onCloseQ} />);

    fireEvent.change(screen.getByTestId('custom-quest-title-input'), {
      target: { value: 'Practice Spanish 15m' },
    });
    fireEvent.click(screen.getByTestId('submit-custom-quest-btn'));
    expect(onCloseQ).toHaveBeenCalledOnce();
    expect(
      useGameStore.getState().quests.some((q) => q.title === 'Practice Spanish 15m'),
    ).toBe(true);

    const onCloseC = vi.fn();
    render(<AddChainForm onClose={onCloseC} />);
    fireEvent.change(screen.getByTestId('custom-chain-title-input'), {
      target: { value: 'Half Marathon Prep' },
    });
    fireEvent.change(screen.getByTestId('custom-chain-step-0'), {
      target: { value: 'Run 5 km' },
    });
    fireEvent.change(screen.getByTestId('custom-chain-step-1'), {
      target: { value: 'Run 10 km' },
    });
    fireEvent.click(screen.getByTestId('submit-custom-chain-btn'));
    expect(onCloseC).toHaveBeenCalledOnce();
    expect(
      useGameStore.getState().chains.some((c) => c.title === 'Half Marathon Prep'),
    ).toBe(true);
  });

  it('imports seeds/ann.json in InnScreen without resetting progress', () => {
    // Complete 1 quest first to build progress
    const firstQ = useGameStore.getState().quests[0]!;
    useGameStore.getState().completeQuest(firstQ.instanceId, undefined, () => 0.5);
    const xpBefore = useGameStore.getState().player.xp;
    expect(xpBefore).toBeGreaterThan(0);

    render(<HouseScreen onClose={() => {}} />);
    expect(screen.getByTestId('days-adventured-counter')).toBeTruthy();

    render(<InnScreen onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('inn-toggle-paste-btn'));

    const annSeedPath = path.resolve(__dirname, '../../seeds/ann.json');
    const annPackJson = fs.readFileSync(annSeedPath, 'utf8');

    fireEvent.change(screen.getByTestId('inn-import-json-textarea'), {
      target: { value: annPackJson },
    });
    fireEvent.click(screen.getByTestId('inn-submit-paste-btn'));

    expect(screen.getByTestId('inn-status-msg').textContent).toContain(
      "Ann's Adventures",
    );

    const stateAfter = useGameStore.getState();
    expect(stateAfter.player.xp).toBe(xpBefore);
    expect(
      stateAfter.chains.map((c) => c.title),
    ).toEqual(expect.arrayContaining(['Road to Santiago', 'Get Promoted']));
    expect(
      stateAfter.quests.some((q) => q.title === "Master's study session (1 h)"),
    ).toBe(true);
  });

  it('renders DialogBox and advances on click', () => {
    const onDone = vi.fn();
    render(
      <DialogBox
        speaker="Professor Rowan"
        lines={['Hello there!']}
        charDelayMs={0}
        onComplete={onDone}
      />,
    );
    const box = screen.getByTestId('dialog-box');
    fireEvent.click(box);
    fireEvent.click(box);
    expect(onDone).toHaveBeenCalled();
  });
});

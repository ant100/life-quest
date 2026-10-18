import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGameStore } from '../store/gameStore';
import { AddChainForm } from './AddChainForm';
import { AddQuestForm } from './AddQuestForm';
import { DialogBox } from './DialogBox';
import { HouseScreen } from './HouseScreen';
import { Hud } from './Hud';
import { InnScreen } from './InnScreen';
import { QuestBoard } from './QuestBoard';
import { QuestLog } from './QuestLog';
import { RewardModal } from './RewardModal';

describe('UI Overlays (Milestone 2)', () => {
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

  it('displays stats, badges, and Days Adventured in HouseScreen and imports QuestPack in InnScreen', () => {
    render(<HouseScreen onClose={() => {}} />);
    expect(screen.getByTestId('days-adventured-counter')).toBeTruthy();
    expect(screen.getByTestId('badge-slot-first-step')).toBeTruthy();

    render(<InnScreen onClose={() => {}} />);
    fireEvent.click(screen.getByTestId('inn-toggle-paste-btn'));

    const packJson = JSON.stringify({
      packVersion: 1,
      name: 'Test Pack',
      quests: [
        {
          id: 'tp-q1',
          title: 'Evening Tea',
          category: 'detox',
          difficulty: 1,
          recurrence: 'daily',
          stats: { spirit: 1 },
        },
      ],
      chains: [],
    });

    fireEvent.change(screen.getByTestId('inn-import-json-textarea'), {
      target: { value: packJson },
    });
    fireEvent.click(screen.getByTestId('inn-submit-paste-btn'));

    expect(screen.getByTestId('inn-status-msg').textContent).toContain('Test Pack');
    expect(
      useGameStore.getState().quests.some((q) => q.title === 'Evening Tea'),
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
    fireEvent.click(box); // finish line if needed or advance
    fireEvent.click(box);
    expect(onDone).toHaveBeenCalled();
  });
});

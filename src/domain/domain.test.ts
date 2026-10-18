import fs from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { CHAIN_TEMPLATES } from '../data/chainTemplates';
import { QUEST_LIBRARY } from '../data/questLibrary';
import { migratePersistedState, useGameStore } from '../store/gameStore';
import { evaluateBadges } from './badges';
import {
  advanceChainOnStepComplete,
  createCustomChainTemplate,
  createCustomQuestTemplate,
  instantiateQuest,
  startChain,
} from './chains';
import {
  getIsoWeekKey,
  isQuestDoneForCurrentPeriod,
  pickDailySuggestions,
  pickStarterQuests,
  refreshRecurringQuests,
} from './daily';
import {
  mergeQuestPack,
  parseImportedJson,
  validateQuestPack,
} from './importExport';
import { computeReturnBonus } from './returnBonus';
import {
  applyStatGains,
  baseGoldForDifficulty,
  baseXpForDifficulty,
  rollBonus,
} from './rewards';
import { applyXp, getLevelProgress, xpForLevel } from './xp';

describe('xp & level curve', () => {
  it('computes xpForLevel(n) = 50 * n * (n + 1) / 2', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(1)).toBe(50);
    expect(xpForLevel(2)).toBe(150);
    expect(xpForLevel(3)).toBe(300);
    expect(xpForLevel(4)).toBe(500);
  });

  it('reaches level 2 within 2 to 3 quests on day 1', () => {
    // 2 quests of difficulty 2 (30 XP each) = 60 XP >= 50 XP -> Level 2
    const afterFirst = applyXp(1, 0, 30);
    expect(afterFirst.newLevel).toBe(1);
    expect(afterFirst.didLevelUp).toBe(false);

    const afterSecond = applyXp(afterFirst.newLevel, afterFirst.newXp, 30);
    expect(afterSecond.newLevel).toBe(2);
    expect(afterSecond.didLevelUp).toBe(true);
    expect(afterSecond.levelsGained).toBe(1);
  });

  it('handles multiple level-ups at once and calculates bar progress', () => {
    const res = applyXp(1, 0, 160);
    expect(res.newLevel).toBe(3);
    expect(res.levelsGained).toBe(2);

    const prog = getLevelProgress(2, 100);
    // Level 2 spans 50..150 (100 XP span); at 100 total XP -> 50%
    expect(prog.currentLevelXp).toBe(50);
    expect(prog.requiredLevelXp).toBe(100);
    expect(prog.progressPercent).toBe(50);
  });
});

describe('rewards & bonus roll', () => {
  it('rolls critical hit (2x EXP) when rng < 0.15', () => {
    const res = rollBonus(() => 0.05);
    expect(res.bonusType).toBe('critical');
    expect(res.xpMultiplier).toBe(2);
    expect(res.bonusGold).toBe(0);
  });

  it('rolls lucky find (+15 gold) when 0.15 <= rng < 0.20', () => {
    let call = 0;
    const seq = [0.17, 0.2];
    const res = rollBonus(() => seq[call++] ?? 0);
    expect(res.bonusType).toBe('lucky');
    expect(res.xpMultiplier).toBe(1);
    expect(res.bonusGold).toBe(15);
    expect(res.message).toContain('Lucky find');
  });

  it('rolls standard reward when rng >= 0.20', () => {
    const res = rollBonus(() => 0.55);
    expect(res.bonusType).toBe('none');
    expect(res.xpMultiplier).toBe(1);
    expect(res.bonusGold).toBe(0);
  });

  it('computes base XP (15/30/60), base gold (5*diff), and stat gains', () => {
    expect(baseXpForDifficulty(1)).toBe(15);
    expect(baseXpForDifficulty(2)).toBe(30);
    expect(baseXpForDifficulty(3)).toBe(60);
    expect(baseGoldForDifficulty(2)).toBe(10);

    const stats = applyStatGains(
      { body: 1, mind: 1, spirit: 1, wealth: 1 },
      { body: 2, spirit: 1 },
    );
    expect(stats).toEqual({ body: 3, mind: 1, spirit: 2, wealth: 1 });
  });
});

describe('daily suggestions & recurrence reset', () => {
  it('picks 3 deterministic suggestions per date and changes on reroll or date change', () => {
    const prefs = { mood: 'exhausted', focus: ['detox' as const] };
    const pick1 = pickDailySuggestions('2026-10-18', prefs, QUEST_LIBRARY, 0);
    const pick2 = pickDailySuggestions('2026-10-18', prefs, QUEST_LIBRARY, 0);
    const reroll = pickDailySuggestions('2026-10-18', prefs, QUEST_LIBRARY, 1);
    const nextDay = pickDailySuggestions('2026-10-19', prefs, QUEST_LIBRARY, 0);

    expect(pick1).toHaveLength(3);
    expect(pick1.map((q) => q.id)).toEqual(pick2.map((q) => q.id));
    expect(reroll.map((q) => q.id)).not.toEqual(pick1.map((q) => q.id));
    expect(nextDay.map((q) => q.id)).not.toEqual(pick1.map((q) => q.id));
  });

  it('weights daily picks heavily toward chosen focus categories', () => {
    const detoxFocus = { focus: ['detox' as const] };
    let detoxCount = 0;
    for (let day = 1; day <= 20; day++) {
      const date = `2026-10-${String(day).padStart(2, '0')}`;
      const picks = pickDailySuggestions(date, detoxFocus, QUEST_LIBRARY, 0);
      detoxCount += picks.filter((p) => p.category === 'detox').length;
    }
    // Out of 60 total picks, detox (~27% of library) with 3.5x weight should appear well over 25 times
    expect(detoxCount).toBeGreaterThan(25);
  });

  it('resets daily and weekly recurring quests on a new period while keeping history', () => {
    const dailyTpl = QUEST_LIBRARY.find((q) => q.recurrence === 'daily')!;
    const weeklyTpl = QUEST_LIBRARY.find((q) => q.recurrence === 'weekly')!;

    const dailyQuest = {
      ...instantiateQuest(dailyTpl, {
        instanceId: 'd-1',
        source: 'library',
        acceptedAt: '2026-10-12T09:00:00Z',
      }),
      status: 'done' as const,
      completions: [{ at: '2026-10-12T10:00:00Z' }],
    };

    const weeklyQuest = {
      ...instantiateQuest(weeklyTpl, {
        instanceId: 'w-1',
        source: 'library',
        acceptedAt: '2026-10-12T09:00:00Z',
      }),
      status: 'done' as const,
      completions: [{ at: '2026-10-12T10:00:00Z' }], // 2026-W42
    };

    expect(isQuestDoneForCurrentPeriod(dailyQuest, '2026-10-12T18:00:00Z')).toBe(true);
    expect(isQuestDoneForCurrentPeriod(dailyQuest, '2026-10-13T08:00:00Z')).toBe(false);

    // Same week (Wednesday Oct 14, 2026 is still W42)
    expect(getIsoWeekKey('2026-10-12')).toBe(getIsoWeekKey('2026-10-14'));
    expect(isQuestDoneForCurrentPeriod(weeklyQuest, '2026-10-14T10:00:00Z')).toBe(true);

    // Next week (Monday Oct 19, 2026 is W43)
    const refreshed = refreshRecurringQuests([dailyQuest, weeklyQuest], '2026-10-19T09:00:00Z');
    expect(refreshed[0]?.status).toBe('active');
    expect(refreshed[0]?.completions).toHaveLength(1);
    expect(refreshed[1]?.status).toBe('active');
    expect(refreshed[1]?.completions).toHaveLength(1);
  });
});

describe('chains & custom creation', () => {
  it('validates custom quest and chain creation (2 to 10 steps)', () => {
    expect(() => createCustomQuestTemplate({ id: 'q1', title: '   ' })).toThrow();
    const customQ = createCustomQuestTemplate({ id: 'q1', title: 'Walk the dog' });
    expect(customQ.category).toBe('personal');
    expect(customQ.difficulty).toBe(2);

    expect(() =>
      createCustomChainTemplate({ id: 'c1', title: 'Short', stepTitles: ['Only one'] }),
    ).toThrow();

    const customChain = createCustomChainTemplate({
      id: 'c1',
      title: 'Clean Garage',
      stepTitles: ['Sort boxes', 'Donate unused items', 'Sweep floor'],
    });
    expect(customChain.steps).toHaveLength(3);
    expect(customChain.steps[2]?.difficulty).toBe(3);
  });

  it('unlocks steps sequentially and marks chain done on final step', () => {
    const tpl = createCustomChainTemplate({
      id: 'c-two',
      title: 'Two Step',
      stepTitles: ['Step A', 'Step B'],
    });
    const { chain, firstStepQuest } = startChain(tpl, '2026-10-18T10:00:00Z');
    expect(chain.currentStep).toBe(0);
    expect(firstStepQuest.chainStep).toBe(0);

    const step1Done = advanceChainOnStepComplete(chain, 0, '2026-10-18T11:00:00Z');
    expect(step1Done.updatedChain.currentStep).toBe(1);
    expect(step1Done.updatedChain.status).toBe('active');
    expect(step1Done.unlockedStepQuest?.title).toBe('Step B');
    expect(step1Done.chainCompleted).toBe(false);

    const step2Done = advanceChainOnStepComplete(
      step1Done.updatedChain,
      1,
      '2026-10-18T12:00:00Z',
    );
    expect(step2Done.updatedChain.status).toBe('done');
    expect(step2Done.unlockedStepQuest).toBeUndefined();
    expect(step2Done.chainCompleted).toBe(true);
  });
});

describe('badges', () => {
  it('evaluates all 8 badges accurately and never duplicates existing badges', () => {
    const makeCompletions = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ at: `2026-10-${String(i + 1).padStart(2, '0')}` }));

    const newlyEarned = evaluateBadges({
      player: {
        badges: ['first-step'], // already has first-step
        daysAdventured: Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`),
      },
      quests: [
        { category: 'detox', completions: makeCompletions(5) },
        { category: 'body', completions: makeCompletions(10) },
        { category: 'mind', completions: makeCompletions(10) },
        { category: 'wealth', completions: makeCompletions(1) },
      ],
      chains: [{ status: 'done' }],
    });

    const ids = newlyEarned.map((b) => b.id);
    expect(ids).not.toContain('first-step');
    expect(ids).toEqual([
      'unplugged',
      'iron-legs',
      'sage',
      'coin-keeper',
      'chain-breaker',
      'regular',
      'wanderer',
    ]);
  });
});

describe('returnBonus', () => {
  it('grants a warm welcome-back bonus after 2+ days away with zero guilt messaging', () => {
    expect(computeReturnBonus('2026-10-18', '2026-10-18').eligible).toBe(false);
    expect(computeReturnBonus('2026-10-17', '2026-10-18').eligible).toBe(false);

    const threeDays = computeReturnBonus('2026-10-15', '2026-10-18');
    expect(threeDays.eligible).toBe(true);
    expect(threeDays.daysAway).toBe(3);
    expect(threeDays.bonusXp).toBeGreaterThan(0);
    expect(threeDays.message).toContain('You rested for 3 days. You feel refreshed!');
    expect(threeDays.message.toLowerCase()).not.toMatch(/fail|missed|lost|streak|shame|penalty/);
  });
});

describe('importExport & QuestPack merge', () => {
  it('validates and merges a QuestPack without resetting existing player progress', () => {
    const existingQuest = instantiateQuest(QUEST_LIBRARY[0]!, {
      instanceId: 'existing-1',
      source: 'library',
      acceptedAt: '2026-10-18T08:00:00Z',
    });

    const rawPack = JSON.stringify({
      packVersion: 1,
      name: "Ann's Adventures",
      quests: [
        {
          id: 'ann-masters-study',
          title: "Master's study session (1 h)",
          category: 'personal',
          difficulty: 2,
          recurrence: 'weekly',
          stats: { mind: 2 },
        },
      ],
      chains: [
        {
          id: 'ann-santiago',
          title: 'Road to Santiago',
          steps: [
            {
              id: 'santiago-1',
              title: '5 km walk',
              category: 'body',
              difficulty: 1,
              recurrence: 'once',
              stats: { body: 1 },
            },
            {
              id: 'santiago-2',
              title: '10 km walk',
              category: 'body',
              difficulty: 2,
              recurrence: 'once',
              stats: { body: 2 },
            },
          ],
        },
      ],
    });

    const parsed = parseImportedJson(rawPack);
    expect(parsed.kind).toBe('pack');
    if (parsed.kind !== 'pack') throw new Error('Expected pack');

    const validPack = validateQuestPack(parsed.data);
    const merged = mergeQuestPack(
      { quests: [existingQuest], chains: [] },
      validPack,
      '2026-10-18T12:00:00Z',
    );

    expect(merged.addedQuestsCount).toBe(1);
    expect(merged.addedChainsCount).toBe(1);
    // Original quest + 1 standalone pack quest + 1 first step of Road to Santiago
    expect(merged.quests).toHaveLength(3);
    expect(merged.chains).toHaveLength(1);
    expect(merged.chains[0]?.title).toBe('Road to Santiago');
  });
});

describe('gameStore integration', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.getState().resetGame('2026-10-18T09:00:00Z');
  });

  it('completes onboarding with 3 starter quests and levels up within 2-3 completed quests', () => {
    const store = useGameStore.getState();
    store.completeOnboarding({
      name: 'Ann',
      sprite: 1,
      mood: 'exhausted',
      focus: ['detox', 'body'],
      selectedChainTemplateId: CHAIN_TEMPLATES[0]!.id,
      now: '2026-10-18T09:00:00Z',
    });

    const afterOnboarding = useGameStore.getState();
    expect(afterOnboarding.onboardingDone).toBe(true);
    expect(afterOnboarding.player.name).toBe('Ann');
    // 3 starter quests + 1 chain step quest
    expect(afterOnboarding.quests.length).toBe(4);

    // Complete first 3 quests (fixed RNG = 0.5 -> no crit, tests pure base XP curve)
    for (const q of afterOnboarding.quests.slice(0, 3)) {
      useGameStore
        .getState()
        .completeQuest(q.instanceId, 'Felt great!', () => 0.5, '2026-10-18T10:00:00Z');
    }

    const finalState = useGameStore.getState();
    expect(finalState.player.level).toBeGreaterThanOrEqual(2);
    expect(finalState.player.badges).toContain('first-step');
    expect(finalState.player.daysAdventured).toEqual(['2026-10-18']);
  });

  it('migrates persisted state safely', () => {
    const migrated = migratePersistedState({ onboardingDone: true }, 0);
    expect(migrated.onboardingDone).toBe(true);
    expect(migrated.player?.level).toBe(1);
    expect(pickStarterQuests({ focus: ['mind'] }, QUEST_LIBRARY)).toHaveLength(3);
  });
});

describe('architecture boundary: domain/ has zero React or Phaser imports', () => {
  it('contains no react or phaser imports in src/domain/*', () => {
    const domainDir = path.resolve(__dirname);
    const files = fs.readdirSync(domainDir).filter((f) => f.endsWith('.ts'));

    for (const file of files) {
      const content = fs.readFileSync(path.join(domainDir, file), 'utf8');
      expect(content).not.toMatch(/from\s+['"]react['"]/i);
      expect(content).not.toMatch(/from\s+['"]phaser['"]/i);
    }
  });
});

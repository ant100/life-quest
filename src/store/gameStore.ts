import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CHAIN_TEMPLATES } from '../data/chainTemplates';
import { QUEST_LIBRARY } from '../data/questLibrary';
import { evaluateBadges } from '../domain/badges';
import {
  advanceChainOnStepComplete,
  createCustomChainTemplate,
  createCustomQuestTemplate,
  instantiateQuest,
  startChain,
} from '../domain/chains';
import {
  isQuestDoneForCurrentPeriod,
  pickStarterQuests,
  refreshRecurringQuests,
  toDateKey,
} from '../domain/daily';
import {
  createSaveFile,
  mergeQuestPack,
  parseImportedJson,
} from '../domain/importExport';
import { computeReturnBonus } from '../domain/returnBonus';
import {
  applyStatGains,
  baseGoldForDifficulty,
  baseXpForDifficulty,
  pickClosingNudge,
  resolveQuestStatGains,
  rollBonus,
} from '../domain/rewards';
import { defaultRng, type Rng } from '../domain/rng';
import type {
  Category,
  Chain,
  Difficulty,
  Player,
  Quest,
  QuestTemplate,
  Recurrence,
  ReturnBonusResult,
  RewardOutcome,
  SpriteIndex,
} from '../domain/types';
import { applyXp } from '../domain/xp';

export const STORE_STORAGE_KEY = 'life-quest-save-v1';
export const STORE_SCHEMA_VERSION = 1;

export function createInitialPlayer(nowIso = new Date().toISOString()): Player {
  return {
    name: 'Traveler',
    sprite: 0,
    level: 1,
    xp: 0,
    stats: {
      body: 1,
      mind: 1,
      spirit: 1,
      wealth: 1,
    },
    gold: 0,
    daysAdventured: [],
    badges: [],
    prefs: {
      mood: 'exhausted',
      focus: ['detox', 'body'],
    },
    lastSeen: toDateKey(nowIso),
    musicVolume: 0.6,
    sfxVolume: 0.8,
  };
}

export interface OnboardingPayload {
  name: string;
  sprite: SpriteIndex;
  mood: string;
  focus: Category[];
  selectedChainTemplateId?: string;
  customChain?: {
    title: string;
    stepTitles: string[];
  };
  now?: string;
}

export interface GameState {
  onboardingDone: boolean;
  player: Player;
  quests: Quest[];
  chains: Chain[];
  returnBonusClaimedOn?: string;
  lastReward: RewardOutcome | null;
  pendingReturnBonus: ReturnBonusResult | null;

  // Actions
  completeOnboarding: (payload: OnboardingPayload) => void;
  acceptQuestTemplate: (
    template: QuestTemplate,
    source?: Quest['source'],
    now?: string,
  ) => Quest;
  addCustomQuest: (
    input: {
      title: string;
      description?: string;
      category?: Category;
      difficulty?: Difficulty;
      recurrence?: Recurrence;
    },
    now?: string,
  ) => Quest;
  startTemplateChain: (templateId: string, now?: string) => Chain | null;
  addCustomChain: (
    input: {
      title: string;
      description?: string;
      stepTitles: string[];
      category?: Category;
    },
    now?: string,
  ) => Chain;
  completeQuest: (
    instanceId: string,
    note?: string,
    rng?: Rng,
    now?: string,
  ) => RewardOutcome | null;
  dismissReward: () => void;
  useDailyReroll: (today?: string) => boolean;
  syncSessionDate: (now?: string) => ReturnBonusResult;
  claimReturnBonus: (now?: string) => ReturnBonusResult | null;
  setVolumes: (musicVolume: number, sfxVolume: number) => void;
  renamePlayer: (name: string) => void;
  setSprite: (sprite: SpriteIndex) => void;
  exportSaveJson: (now?: string) => string;
  importFromJson: (
    rawJson: string,
    now?: string,
  ) => { kind: 'pack' | 'save'; summary: string };
  resetGame: (now?: string) => void;
}

export function migratePersistedState(
  persistedState: unknown,
  _version: number,
): Partial<GameState> {
  if (!persistedState || typeof persistedState !== 'object') {
    return {
      onboardingDone: false,
      player: createInitialPlayer(),
      quests: [],
      chains: [],
    };
  }

  const state = persistedState as Partial<GameState>;
  const initialPlayer = createInitialPlayer();
  const rawPlayer = state.player ?? initialPlayer;

  const migratedPlayer: Player = {
    ...initialPlayer,
    ...rawPlayer,
    stats: {
      ...initialPlayer.stats,
      ...(rawPlayer.stats ?? {}),
    },
    prefs: {
      mood: rawPlayer.prefs?.mood ?? initialPlayer.prefs.mood,
      focus:
        Array.isArray(rawPlayer.prefs?.focus) && rawPlayer.prefs.focus.length > 0
          ? rawPlayer.prefs.focus
          : initialPlayer.prefs.focus,
    },
    daysAdventured: Array.isArray(rawPlayer.daysAdventured)
      ? rawPlayer.daysAdventured
      : [],
    badges: Array.isArray(rawPlayer.badges) ? rawPlayer.badges : [],
  };

  return {
    onboardingDone: Boolean(state.onboardingDone),
    player: migratedPlayer,
    quests: Array.isArray(state.quests) ? state.quests : [],
    chains: Array.isArray(state.chains) ? state.chains : [],
    returnBonusClaimedOn: state.returnBonusClaimedOn,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      onboardingDone: false,
      player: createInitialPlayer(),
      quests: [],
      chains: [],
      returnBonusClaimedOn: undefined,
      lastReward: null,
      pendingReturnBonus: null,

      completeOnboarding: (payload) => {
        const now = payload.now ?? new Date().toISOString();
        const todayKey = toDateKey(now);
        const focus: Category[] =
          payload.focus.length > 0 ? payload.focus : ['detox', 'body'];
        const cleanName = payload.name.trim() || 'Traveler';

        const starterTemplates = pickStarterQuests(
          { mood: payload.mood, focus },
          QUEST_LIBRARY,
        );

        const starterQuests: Quest[] = starterTemplates.map((tpl, idx) =>
          instantiateQuest(tpl, {
            instanceId: `starter-${tpl.id}-${idx}`,
            source: 'library',
            acceptedAt: now,
          }),
        );

        const chains: Chain[] = [];

        if (payload.customChain && payload.customChain.title.trim()) {
          const customChainTpl = createCustomChainTemplate({
            id: `custom-chain-${Date.now()}`,
            title: payload.customChain.title,
            stepTitles: payload.customChain.stepTitles,
            category: focus[0] ?? 'personal',
          });
          const { chain, firstStepQuest } = startChain(customChainTpl, now);
          chains.push(chain);
          starterQuests.push(firstStepQuest);
        } else if (payload.selectedChainTemplateId) {
          const tpl = CHAIN_TEMPLATES.find(
            (c) => c.id === payload.selectedChainTemplateId,
          );
          if (tpl) {
            const { chain, firstStepQuest } = startChain(tpl, now);
            chains.push(chain);
            starterQuests.push(firstStepQuest);
          }
        }

        set((state) => ({
          onboardingDone: true,
          player: {
            ...state.player,
            name: cleanName,
            sprite: payload.sprite,
            prefs: {
              mood: payload.mood,
              focus,
            },
            lastSeen: todayKey,
          },
          quests: starterQuests,
          chains,
          lastReward: null,
          pendingReturnBonus: null,
        }));
      },

      acceptQuestTemplate: (template, source = 'library', now) => {
        const acceptedAt = now ?? new Date().toISOString();
        const instanceId = `${source}-${template.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const newQuest = instantiateQuest(template, {
          instanceId,
          source,
          acceptedAt,
        });

        set((state) => ({
          quests: [...state.quests, newQuest],
        }));

        return newQuest;
      },

      addCustomQuest: (input, now) => {
        const acceptedAt = now ?? new Date().toISOString();
        const uid = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const template = createCustomQuestTemplate({
          id: `custom-${uid}`,
          title: input.title,
          description: input.description,
          category: input.category,
          difficulty: input.difficulty,
          recurrence: input.recurrence,
        });
        const newQuest = instantiateQuest(template, {
          instanceId: `inst-${template.id}`,
          source: 'custom',
          acceptedAt,
        });

        set((state) => ({
          quests: [...state.quests, newQuest],
        }));

        return newQuest;
      },

      startTemplateChain: (templateId, now) => {
        const state = get();
        const existing = state.chains.find((c) => c.id === templateId);
        if (existing) {
          return existing;
        }
        const tpl = CHAIN_TEMPLATES.find((c) => c.id === templateId);
        if (!tpl) {
          return null;
        }
        const acceptedAt = now ?? new Date().toISOString();
        const { chain, firstStepQuest } = startChain(tpl, acceptedAt);

        set((s) => ({
          chains: [...s.chains, chain],
          quests: [...s.quests, firstStepQuest],
        }));

        return chain;
      },

      addCustomChain: (input, now) => {
        const acceptedAt = now ?? new Date().toISOString();
        const uid = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const tpl = createCustomChainTemplate({
          id: `custom-chain-${uid}`,
          title: input.title,
          description: input.description,
          stepTitles: input.stepTitles,
          category: input.category,
        });
        const { chain, firstStepQuest } = startChain(tpl, acceptedAt);

        set((s) => ({
          chains: [...s.chains, chain],
          quests: [...s.quests, firstStepQuest],
        }));

        return chain;
      },

      completeQuest: (instanceId, note, rng = defaultRng, now) => {
        const state = get();
        const nowIso = now ?? new Date().toISOString();
        const todayKey = toDateKey(nowIso);

        const targetQuest = state.quests.find((q) => q.instanceId === instanceId);
        if (!targetQuest) {
          return null;
        }

        if (isQuestDoneForCurrentPeriod(targetQuest, nowIso)) {
          return null;
        }

        const bonus = rollBonus(rng);
        const baseXp = baseXpForDifficulty(targetQuest.difficulty);
        const totalXp = baseXp * bonus.xpMultiplier;
        const baseGold = baseGoldForDifficulty(targetQuest.difficulty);
        const bonusGold = bonus.bonusGold;
        const totalGold = baseGold + bonusGold;

        const statGains = resolveQuestStatGains(
          targetQuest.stats,
          targetQuest.category,
          targetQuest.difficulty,
        );
        const nextStats = applyStatGains(state.player.stats, statGains);
        const xpOutcome = applyXp(state.player.level, state.player.xp, totalXp);

        const updatedQuest: Quest = {
          ...targetQuest,
          status: 'done',
          completions: [
            ...targetQuest.completions,
            {
              at: nowIso,
              note: note?.trim() || undefined,
            },
          ],
        };

        let nextQuests = state.quests.map((q) =>
          q.instanceId === instanceId ? updatedQuest : q,
        );
        let nextChains = [...state.chains];
        let unlockedNextStep: Quest | undefined;
        let completedChainTitle: string | undefined;

        if (
          targetQuest.chainId !== undefined &&
          targetQuest.chainStep !== undefined
        ) {
          nextChains = state.chains.map((chain) => {
            if (chain.id !== targetQuest.chainId) {
              return chain;
            }
            const res = advanceChainOnStepComplete(
              chain,
              targetQuest.chainStep!,
              nowIso,
            );
            if (res.unlockedStepQuest) {
              unlockedNextStep = res.unlockedStepQuest;
            }
            if (res.chainCompleted) {
              completedChainTitle = chain.title;
            }
            return res.updatedChain;
          });

          if (unlockedNextStep) {
            nextQuests = [...nextQuests, unlockedNextStep];
          }
        }

        const nextDaysAdventured = state.player.daysAdventured.includes(todayKey)
          ? state.player.daysAdventured
          : [...state.player.daysAdventured, todayKey];

        const newlyEarnedBadges = evaluateBadges({
          player: {
            badges: state.player.badges,
            daysAdventured: nextDaysAdventured,
          },
          quests: nextQuests,
          chains: nextChains,
        });

        const nextBadges = [
          ...state.player.badges,
          ...newlyEarnedBadges.map((b) => b.id),
        ];

        const closingNudge = pickClosingNudge(rng);

        const outcome: RewardOutcome = {
          questTitle: targetQuest.title,
          baseXp,
          totalXp,
          baseGold,
          bonusGold,
          totalGold,
          bonusType: bonus.bonusType,
          bonusMessage: bonus.message,
          statGains,
          previousLevel: xpOutcome.previousLevel,
          newLevel: xpOutcome.newLevel,
          levelsGained: xpOutcome.levelsGained,
          previousXp: xpOutcome.previousXp,
          newXp: xpOutcome.newXp,
          xpForNextLevel: xpOutcome.xpForNextLevel,
          newlyEarnedBadges,
          unlockedNextStep,
          completedChainTitle,
          closingNudge,
        };

        set({
          player: {
            ...state.player,
            level: xpOutcome.newLevel,
            xp: xpOutcome.newXp,
            stats: nextStats,
            gold: state.player.gold + totalGold,
            daysAdventured: nextDaysAdventured,
            badges: nextBadges,
            lastSeen: todayKey,
          },
          quests: nextQuests,
          chains: nextChains,
          lastReward: outcome,
        });

        return outcome;
      },

      dismissReward: () => {
        set({ lastReward: null });
      },

      useDailyReroll: (today) => {
        const state = get();
        const todayKey = toDateKey(today ?? new Date().toISOString());
        if (state.player.dailyRerollUsedOn === todayKey) {
          return false;
        }
        set({
          player: {
            ...state.player,
            dailyRerollUsedOn: todayKey,
          },
        });
        return true;
      },

      syncSessionDate: (now) => {
        const state = get();
        const nowIso = now ?? new Date().toISOString();
        const todayKey = toDateKey(nowIso);
        const refreshedQuests = refreshRecurringQuests(state.quests, nowIso);
        const bonus = computeReturnBonus(state.player.lastSeen, todayKey);

        if (bonus.eligible && state.returnBonusClaimedOn !== todayKey) {
          set({
            quests: refreshedQuests,
            pendingReturnBonus: bonus,
          });
          return bonus;
        }

        set({
          quests: refreshedQuests,
          player: {
            ...state.player,
            lastSeen: todayKey,
          },
          pendingReturnBonus: null,
        });
        return {
          eligible: false,
          daysAway: bonus.daysAway,
          bonusXp: 0,
          message: '',
        };
      },

      claimReturnBonus: (now) => {
        const state = get();
        const nowIso = now ?? new Date().toISOString();
        const todayKey = toDateKey(nowIso);
        const bonus =
          state.pendingReturnBonus ??
          computeReturnBonus(state.player.lastSeen, todayKey);

        if (!bonus.eligible || state.returnBonusClaimedOn === todayKey) {
          set({
            pendingReturnBonus: null,
            player: {
              ...state.player,
              lastSeen: todayKey,
            },
          });
          return null;
        }

        const xpRes = applyXp(state.player.level, state.player.xp, bonus.bonusXp);

        set({
          player: {
            ...state.player,
            level: xpRes.newLevel,
            xp: xpRes.newXp,
            lastSeen: todayKey,
          },
          returnBonusClaimedOn: todayKey,
          pendingReturnBonus: null,
        });

        return bonus;
      },

      setVolumes: (musicVolume, sfxVolume) => {
        const clampedMusic = Math.max(0, Math.min(1, musicVolume));
        const clampedSfx = Math.max(0, Math.min(1, sfxVolume));
        set((state) => ({
          player: {
            ...state.player,
            musicVolume: clampedMusic,
            sfxVolume: clampedSfx,
          },
        }));
      },

      renamePlayer: (name) => {
        const clean = name.trim();
        if (!clean) return;
        set((state) => ({
          player: {
            ...state.player,
            name: clean,
          },
        }));
      },

      setSprite: (sprite) => {
        set((state) => ({
          player: {
            ...state.player,
            sprite,
          },
        }));
      },

      exportSaveJson: (now) => {
        const state = get();
        const save = createSaveFile(
          {
            onboardingDone: state.onboardingDone,
            player: state.player,
            quests: state.quests,
            chains: state.chains,
            returnBonusClaimedOn: state.returnBonusClaimedOn,
          },
          now ?? new Date().toISOString(),
        );
        return JSON.stringify(save, null, 2);
      },

      importFromJson: (rawJson, now) => {
        const parsed = parseImportedJson(rawJson);
        const nowIso = now ?? new Date().toISOString();

        if (parsed.kind === 'pack') {
          const state = get();
          const merged = mergeQuestPack(
            { quests: state.quests, chains: state.chains },
            parsed.data,
            nowIso,
          );
          set({
            quests: merged.quests,
            chains: merged.chains,
          });
          return {
            kind: 'pack',
            summary: `Imported "${parsed.data.name}": added ${merged.addedQuestsCount} quest(s) and ${merged.addedChainsCount} epic chain(s).`,
          };
        }

        const saveData = parsed.data;
        set({
          onboardingDone: saveData.onboardingDone,
          player: saveData.player,
          quests: saveData.quests,
          chains: saveData.chains,
          returnBonusClaimedOn: saveData.returnBonusClaimedOn,
          lastReward: null,
          pendingReturnBonus: null,
        });
        return {
          kind: 'save',
          summary: `Restored save file for ${saveData.player.name} (Level ${saveData.player.level}).`,
        };
      },

      resetGame: (now) => {
        set({
          onboardingDone: false,
          player: createInitialPlayer(now),
          quests: [],
          chains: [],
          returnBonusClaimedOn: undefined,
          lastReward: null,
          pendingReturnBonus: null,
        });
      },
    }),
    {
      name: STORE_STORAGE_KEY,
      version: STORE_SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState, version) =>
        migratePersistedState(persistedState, version) as GameState,
      partialize: (state) =>
        ({
          onboardingDone: state.onboardingDone,
          player: state.player,
          quests: state.quests,
          chains: state.chains,
          returnBonusClaimedOn: state.returnBonusClaimedOn,
        }) as unknown as GameState,
    },
  ),
);

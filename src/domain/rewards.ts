import { defaultRng, type Rng } from './rng';
import type {
  BonusRollResult,
  Category,
  Difficulty,
  StatKey,
} from './types';

export const BASE_XP_BY_DIFFICULTY: Record<Difficulty, number> = {
  1: 15,
  2: 30,
  3: 60,
};

export const LUCKY_FIND_MESSAGES = [
  'Lucky find! You spotted a pouch of gold coins under a mossy stone!',
  'Lucky find! A grateful villager tipped you extra gold!',
  'Lucky find! You found a shiny coin tucked inside an old coat!',
];

export const CLOSING_NUDGES = [
  "Your quest awaits out there. Go on, I'll keep the fire warm.",
  'The ledger is updated. Put your phone away and enjoy the real world.',
  'Well done, adventurer. Close the screen and rest your eyes.',
  "That's enough screen time for a hero. The real world calls.",
  'Progress saved. Step away from the glow and take a deep breath.',
];

export function baseXpForDifficulty(difficulty: Difficulty): number {
  return BASE_XP_BY_DIFFICULTY[difficulty] ?? 15;
}

export function baseGoldForDifficulty(difficulty: Difficulty): number {
  return 5 * difficulty;
}

/**
 * Rolls for variable reward on quest completion:
 * - [0.00, 0.15): 15% chance of "Critical hit! EXP ×2"
 * - [0.15, 0.20): 5% chance of "Lucky find!" + bonus gold (15g)
 * - [0.20, 1.00): normal reward
 */
export function rollBonus(rng: Rng = defaultRng): BonusRollResult {
  const r = rng();
  if (r < 0.15) {
    return {
      bonusType: 'critical',
      xpMultiplier: 2,
      bonusGold: 0,
      message: 'Critical hit! EXP ×2!',
    };
  }
  if (r < 0.2) {
    const idx = Math.floor(rng() * LUCKY_FIND_MESSAGES.length) % LUCKY_FIND_MESSAGES.length;
    return {
      bonusType: 'lucky',
      xpMultiplier: 1,
      bonusGold: 15,
      message: LUCKY_FIND_MESSAGES[idx] ?? LUCKY_FIND_MESSAGES[0],
    };
  }
  return {
    bonusType: 'none',
    xpMultiplier: 1,
    bonusGold: 0,
  };
}

export function defaultStatsForCategory(
  category: Category,
  difficulty: Difficulty = 1,
): Partial<Record<StatKey, number>> {
  const amount = difficulty >= 3 ? 2 : 1;
  switch (category) {
    case 'body':
      return { body: amount };
    case 'mind':
      return { mind: amount };
    case 'wealth':
      return { wealth: amount };
    case 'detox':
    case 'personal':
    default:
      return { spirit: amount };
  }
}

export function resolveQuestStatGains(
  stats: Partial<Record<StatKey, number>> | undefined,
  category: Category,
  difficulty: Difficulty,
): Partial<Record<StatKey, number>> {
  if (stats && Object.keys(stats).length > 0) {
    return { ...stats };
  }
  return defaultStatsForCategory(category, difficulty);
}

export function applyStatGains(
  currentStats: Record<StatKey, number>,
  gains: Partial<Record<StatKey, number>>,
): Record<StatKey, number> {
  return {
    body: currentStats.body + (gains.body ?? 0),
    mind: currentStats.mind + (gains.mind ?? 0),
    spirit: currentStats.spirit + (gains.spirit ?? 0),
    wealth: currentStats.wealth + (gains.wealth ?? 0),
  };
}

export function pickClosingNudge(rng: Rng = defaultRng): string {
  const idx = Math.floor(rng() * CLOSING_NUDGES.length) % CLOSING_NUDGES.length;
  return CLOSING_NUDGES[idx] ?? CLOSING_NUDGES[0]!;
}

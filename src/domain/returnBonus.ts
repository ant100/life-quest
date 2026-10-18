import { toDateKey } from './daily';
import type { ReturnBonusResult } from './types';

/**
 * Calculates calendar days elapsed between two dates (YYYY-MM-DD or ISO timestamps).
 */
export function daysBetweenDates(earlierDateStr: string, laterDateStr: string): number {
  const startKey = toDateKey(earlierDateStr);
  const endKey = toDateKey(laterDateStr);

  const [sy, sm, sd] = startKey.split('-').map(Number);
  const [ey, em, ed] = endKey.split('-').map(Number);

  const startUtc = Date.UTC(sy ?? 2026, (sm ?? 1) - 1, sd ?? 1);
  const endUtc = Date.UTC(ey ?? 2026, (em ?? 1) - 1, ed ?? 1);

  return Math.floor((endUtc - startUtc) / 86400000);
}

/**
 * Computes the Innkeeper's welcome-back bonus if the player has been away for 2+ days.
 * Never includes any negative or guilt-inducing messaging.
 */
export function computeReturnBonus(lastSeen: string, now: string): ReturnBonusResult {
  if (!lastSeen) {
    return {
      eligible: false,
      daysAway: 0,
      bonusXp: 0,
      message: '',
    };
  }

  const daysAway = daysBetweenDates(lastSeen, now);
  if (daysAway < 2) {
    return {
      eligible: false,
      daysAway: Math.max(0, daysAway),
      bonusXp: 0,
      message: '',
    };
  }

  const bonusXp = Math.min(45, 15 + (daysAway - 2) * 5);
  return {
    eligible: true,
    daysAway,
    bonusXp,
    message: `You rested for ${daysAway} days. You feel refreshed! (+${bonusXp} EXP)`,
  };
}

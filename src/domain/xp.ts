/**
 * Cumulative XP threshold required to finish level `n` and advance to `n + 1`.
 * Formula from spec: xpForLevel(n) = 50 * n * (n + 1) / 2
 * - Level 1 -> Level 2 requires 50 XP (achievable in 2-3 quests on Day 1)
 * - Level 2 -> Level 3 requires 150 cumulative XP (+100 XP)
 * - Level 3 -> Level 4 requires 300 cumulative XP (+150 XP)
 */
export function xpForLevel(n: number): number {
  if (n <= 0) return 0;
  return (50 * n * (n + 1)) / 2;
}

/**
 * Determine the player's current level from cumulative XP.
 * Level starts at 1 for 0 XP.
 */
export function levelFromXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;
  while (safeXp >= xpForLevel(level)) {
    level++;
  }
  return level;
}

export interface XpApplicationResult {
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  didLevelUp: boolean;
  previousXp: number;
  newXp: number;
  xpForNextLevel: number;
}

/**
 * Applies gained XP to a player's current level & cumulative XP,
 * detecting single or multiple level-ups.
 */
export function applyXp(
  currentLevel: number,
  currentXp: number,
  gainedXp: number,
): XpApplicationResult {
  const safeGained = Math.max(0, Math.floor(gainedXp));
  const previousXp = Math.max(0, Math.floor(currentXp));
  const newXp = previousXp + safeGained;
  const computedLevel = levelFromXp(newXp);
  const newLevel = Math.max(currentLevel, computedLevel);
  const levelsGained = Math.max(0, newLevel - currentLevel);

  return {
    previousLevel: currentLevel,
    newLevel,
    levelsGained,
    didLevelUp: levelsGained > 0,
    previousXp,
    newXp,
    xpForNextLevel: xpForLevel(newLevel),
  };
}

export interface LevelProgress {
  currentLevelXp: number;
  requiredLevelXp: number;
  progressPercent: number;
  nextLevelThreshold: number;
}

/**
 * Computes progress within the current level for rendering the EXP bar.
 */
export function getLevelProgress(level: number, totalXp: number): LevelProgress {
  const floorThreshold = xpForLevel(Math.max(0, level - 1));
  const nextThreshold = xpForLevel(Math.max(1, level));
  const requiredLevelXp = Math.max(1, nextThreshold - floorThreshold);
  const currentLevelXp = Math.max(0, totalXp - floorThreshold);
  const progressPercent = Math.min(100, Math.max(0, (currentLevelXp / requiredLevelXp) * 100));

  return {
    currentLevelXp,
    requiredLevelXp,
    progressPercent,
    nextLevelThreshold: nextThreshold,
  };
}

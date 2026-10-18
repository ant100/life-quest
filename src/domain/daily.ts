import { hashString, mulberry32 } from './rng';
import type { Category, Quest, QuestTemplate } from './types';

/**
 * Normalizes an ISO timestamp or date string into YYYY-MM-DD.
 */
export function toDateKey(isoOrDate: string): string {
  const trimmed = isoOrDate.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Computes an ISO 8601 week key (e.g. "2026-W42") from a date string.
 * Weeks start on Monday.
 */
export function getIsoWeekKey(isoOrDate: string): string {
  const dateKey = toDateKey(isoOrDate);
  const [y, m, d] = dateKey.split('-').map(Number);
  const utc = new Date(Date.UTC(y ?? 2026, (m ?? 1) - 1, d ?? 1));
  const dayNum = utc.getUTCDay() || 7; // Monday = 1 .. Sunday = 7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Checks whether a quest has already been completed in the current recurrence window.
 */
export function isQuestDoneForCurrentPeriod(
  quest: Pick<Quest, 'recurrence' | 'status' | 'completions'>,
  currentDateStr: string,
): boolean {
  if (quest.recurrence === 'once') {
    return quest.status === 'done' || quest.completions.length > 0;
  }

  if (quest.completions.length === 0) {
    return false;
  }

  if (quest.recurrence === 'daily') {
    const todayKey = toDateKey(currentDateStr);
    return quest.completions.some((c) => toDateKey(c.at) === todayKey);
  }

  if (quest.recurrence === 'weekly') {
    const currentWeek = getIsoWeekKey(currentDateStr);
    return quest.completions.some((c) => getIsoWeekKey(c.at) === currentWeek);
  }

  return false;
}

/**
 * Automatically resets recurring ('daily' or 'weekly') quests to 'active'
 * when a new day/week begins, preserving their completion history.
 */
export function refreshRecurringQuests(quests: Quest[], currentDateStr: string): Quest[] {
  return quests.map((quest) => {
    if (quest.status === 'archived' || quest.recurrence === 'once') {
      return quest;
    }
    const doneNow = isQuestDoneForCurrentPeriod(quest, currentDateStr);
    const desiredStatus = doneNow ? 'done' : 'active';
    if (quest.status === desiredStatus) {
      return quest;
    }
    return {
      ...quest,
      status: desiredStatus,
    };
  });
}

/**
 * Deterministically picks `count` (default 3) daily quest suggestions for a given date,
 * weighted by the player's focus categories.
 */
export function pickDailySuggestions(
  date: string,
  prefs: { mood?: string; focus: Category[] },
  library: QuestTemplate[],
  seedOffset = 0,
  excludeTemplateIds: string[] = [],
  count = 3,
): QuestTemplate[] {
  if (library.length === 0 || count <= 0) {
    return [];
  }

  const dateKey = toDateKey(date);
  const focusKey = [...prefs.focus].sort().join(',');
  const seed = hashString(`${dateKey}|${focusKey}|reroll:${seedOffset}`);
  const rng = mulberry32(seed);

  const excludeSet = new Set(excludeTemplateIds);
  let pool = library.filter((t) => !excludeSet.has(t.id));
  if (pool.length < count) {
    pool = [...library];
  }

  const focusSet = new Set<Category>(prefs.focus);
  const remaining = [...pool];
  const chosen: QuestTemplate[] = [];

  while (chosen.length < count && remaining.length > 0) {
    const weights = remaining.map((item) => {
      let weight = focusSet.has(item.category) ? 3.5 : 1;
      if (prefs.mood === 'exhausted' && item.difficulty === 1) {
        weight *= 1.5;
      }
      return weight;
    });

    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    let pick = rng() * totalWeight;
    let selectedIndex = 0;

    for (let i = 0; i < remaining.length; i++) {
      pick -= weights[i]!;
      if (pick <= 0) {
        selectedIndex = i;
        break;
      }
    }

    const [selected] = remaining.splice(selectedIndex, 1);
    if (selected) {
      chosen.push(selected);
    }
  }

  return chosen;
}

/**
 * Picks 3 approachable starter quests during onboarding based on player mood & focus.
 * Ensures at least one difficulty 2 quest so completing 2-3 starter quests reaches 50 XP (Level 2).
 */
export function pickStarterQuests(
  prefs: { mood?: string; focus: Category[] },
  library: QuestTemplate[],
): QuestTemplate[] {
  const approachable = library.filter((q) => q.difficulty <= 2);
  const sourcePool = approachable.length >= 3 ? approachable : library;
  const picks = pickDailySuggestions('starter-pack-v1', prefs, sourcePool, 0, [], 3);

  // Guarantee total possible XP from the 3 starter quests is >= 50 XP so level 2 happens in 2-3 quests
  const totalPossibleXp = picks.reduce(
    (sum, q) => sum + (q.difficulty === 1 ? 15 : q.difficulty === 2 ? 30 : 60),
    0,
  );

  if (totalPossibleXp < 60 && picks.length === 3) {
    const focusSet = new Set(prefs.focus);
    const chosenIds = new Set(picks.map((p) => p.id));
    const diff2Candidate =
      library.find((q) => q.difficulty === 2 && focusSet.has(q.category) && !chosenIds.has(q.id)) ??
      library.find((q) => q.difficulty === 2 && !chosenIds.has(q.id));
    if (diff2Candidate) {
      picks[2] = diff2Candidate;
    }
  }

  return picks;
}

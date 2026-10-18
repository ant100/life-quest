import type { BadgeDefinition, Category, Chain, Player, Quest } from './types';

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-step',
    name: 'First Step',
    description: 'Complete your first quest.',
    icon: '🥾',
  },
  {
    id: 'unplugged',
    name: 'Unplugged',
    description: 'Complete 5 detox quests.',
    icon: '🌿',
  },
  {
    id: 'iron-legs',
    name: 'Iron Legs',
    description: 'Complete 10 body quests.',
    icon: '⚡',
  },
  {
    id: 'sage',
    name: 'Sage',
    description: 'Complete 10 mind quests.',
    icon: '📖',
  },
  {
    id: 'coin-keeper',
    name: 'Coin Keeper',
    description: 'Complete your first wealth quest.',
    icon: '🪙',
  },
  {
    id: 'chain-breaker',
    name: 'Chain Breaker',
    description: 'Finish any epic quest chain.',
    icon: '⛓️',
  },
  {
    id: 'regular',
    name: 'Regular',
    description: 'Reach 7 Days Adventured.',
    icon: '🔥',
  },
  {
    id: 'wanderer',
    name: 'Wanderer',
    description: 'Reach 30 Days Adventured.',
    icon: '🧭',
  },
];

export interface BadgeEvaluationContext {
  player: Pick<Player, 'badges' | 'daysAdventured'>;
  quests: Pick<Quest, 'category' | 'completions'>[];
  chains: Pick<Chain, 'status'>[];
}

export function countCompletionsByCategory(
  quests: Pick<Quest, 'category' | 'completions'>[],
): { total: number; byCategory: Record<Category, number> } {
  const byCategory: Record<Category, number> = {
    detox: 0,
    body: 0,
    mind: 0,
    wealth: 0,
    personal: 0,
  };
  let total = 0;

  for (const q of quests) {
    const count = q.completions.length;
    if (count > 0) {
      total += count;
      byCategory[q.category] = (byCategory[q.category] ?? 0) + count;
    }
  }

  return { total, byCategory };
}

/**
 * Evaluates all 8 badges against current state and returns newly earned BadgeDefinitions
 * that are not yet present in `player.badges`.
 */
export function evaluateBadges(context: BadgeEvaluationContext): BadgeDefinition[] {
  const existing = new Set(context.player.badges);
  const { total, byCategory } = countCompletionsByCategory(context.quests);
  const daysCount = new Set(context.player.daysAdventured).size;
  const anyChainDone = context.chains.some((c) => c.status === 'done');

  const earnedIds: string[] = [];

  if (total >= 1) earnedIds.push('first-step');
  if (byCategory.detox >= 5) earnedIds.push('unplugged');
  if (byCategory.body >= 10) earnedIds.push('iron-legs');
  if (byCategory.mind >= 10) earnedIds.push('sage');
  if (byCategory.wealth >= 1) earnedIds.push('coin-keeper');
  if (anyChainDone) earnedIds.push('chain-breaker');
  if (daysCount >= 7) earnedIds.push('regular');
  if (daysCount >= 30) earnedIds.push('wanderer');

  return BADGE_DEFINITIONS.filter((b) => earnedIds.includes(b.id) && !existing.has(b.id));
}

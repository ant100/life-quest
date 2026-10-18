import { defaultStatsForCategory } from './rewards';
import type {
  Category,
  Chain,
  ChainTemplate,
  Difficulty,
  Quest,
  QuestTemplate,
  Recurrence,
} from './types';

export interface InstantiateQuestOptions {
  instanceId: string;
  source: Quest['source'];
  acceptedAt: string;
  chainId?: string;
  chainStep?: number;
}

export function instantiateQuest(
  template: QuestTemplate,
  options: InstantiateQuestOptions,
): Quest {
  return {
    ...template,
    stats: { ...template.stats },
    instanceId: options.instanceId,
    source: options.source,
    chainId: options.chainId,
    chainStep: options.chainStep,
    status: 'active',
    acceptedAt: options.acceptedAt,
    completions: [],
  };
}

export interface CustomQuestInput {
  id: string;
  title: string;
  description?: string;
  category?: Category;
  difficulty?: Difficulty;
  recurrence?: Recurrence;
  flavor?: string;
}

export function createCustomQuestTemplate(input: CustomQuestInput): QuestTemplate {
  const cleanTitle = input.title.trim();
  if (!cleanTitle) {
    throw new Error('Quest title is required.');
  }
  const category: Category = input.category ?? 'personal';
  const difficulty: Difficulty = input.difficulty ?? 2;
  const recurrence: Recurrence = input.recurrence ?? 'once';

  return {
    id: input.id,
    title: cleanTitle,
    description: input.description?.trim() || undefined,
    category,
    difficulty,
    recurrence,
    stats: defaultStatsForCategory(category, difficulty),
    flavor: input.flavor?.trim() || 'Every small step shapes the legend.',
  };
}

export interface CustomChainInput {
  id: string;
  title: string;
  description?: string;
  stepTitles: string[];
  category?: Category;
  source?: Chain['source'];
}

export function createCustomChainTemplate(input: CustomChainInput): ChainTemplate {
  const cleanTitle = input.title.trim();
  if (!cleanTitle) {
    throw new Error('Chain title is required.');
  }
  const validSteps = input.stepTitles.map((s) => s.trim()).filter(Boolean);
  if (validSteps.length < 2 || validSteps.length > 10) {
    throw new Error('A chain must have between 2 and 10 steps.');
  }

  const category: Category = input.category ?? 'personal';
  const steps: QuestTemplate[] = validSteps.map((stepTitle, index) => {
    const isFinalStep = index === validSteps.length - 1;
    const difficulty: Difficulty = isFinalStep ? 3 : 2;
    return {
      id: `${input.id}-step-${index + 1}`,
      title: stepTitle,
      description: `Step ${index + 1} of ${validSteps.length} in "${cleanTitle}"`,
      category,
      difficulty,
      recurrence: 'once',
      stats: defaultStatsForCategory(category, difficulty),
      flavor: isFinalStep
        ? 'The summit of a long journey.'
        : 'A stepping stone along the grand path.',
    };
  });

  return {
    id: input.id,
    title: cleanTitle,
    description: input.description?.trim() || undefined,
    steps,
    source: input.source ?? 'custom',
  };
}

export function startChain(
  template: ChainTemplate,
  acceptedAt: string,
  instanceIdPrefix?: string,
): { chain: Chain; firstStepQuest: Quest } {
  const firstTemplate = template.steps[0];
  if (!firstTemplate) {
    throw new Error(`Chain "${template.title}" has no steps.`);
  }

  const chain: Chain = {
    ...template,
    steps: template.steps.map((s) => ({ ...s, stats: { ...s.stats } })),
    currentStep: 0,
    status: 'active',
  };

  const prefix = instanceIdPrefix ?? `${chain.id}-inst`;
  const firstStepQuest = instantiateQuest(firstTemplate, {
    instanceId: `${prefix}-step-0`,
    source: 'chain',
    acceptedAt,
    chainId: chain.id,
    chainStep: 0,
  });

  return { chain, firstStepQuest };
}

export interface AdvanceChainResult {
  updatedChain: Chain;
  unlockedStepQuest?: Quest;
  chainCompleted: boolean;
}

/**
 * Advances an active chain when its current step is completed.
 * Only the current step unlocks the next step ("A new path opens…").
 */
export function advanceChainOnStepComplete(
  chain: Chain,
  completedStepIndex: number,
  acceptedAt: string,
  nextInstanceId?: string,
): AdvanceChainResult {
  if (chain.status === 'done' || completedStepIndex !== chain.currentStep) {
    return {
      updatedChain: chain,
      chainCompleted: false,
    };
  }

  const nextIndex = chain.currentStep + 1;
  if (nextIndex >= chain.steps.length) {
    return {
      updatedChain: {
        ...chain,
        currentStep: chain.steps.length,
        status: 'done',
      },
      chainCompleted: true,
    };
  }

  const nextTemplate = chain.steps[nextIndex]!;
  const unlockedStepQuest = instantiateQuest(nextTemplate, {
    instanceId: nextInstanceId ?? `${chain.id}-inst-step-${nextIndex}`,
    source: 'chain',
    acceptedAt,
    chainId: chain.id,
    chainStep: nextIndex,
  });

  return {
    updatedChain: {
      ...chain,
      currentStep: nextIndex,
      status: 'active',
    },
    unlockedStepQuest,
    chainCompleted: false,
  };
}

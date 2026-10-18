import { instantiateQuest, startChain } from './chains';
import type {
  Category,
  Chain,
  ChainTemplate,
  Difficulty,
  Quest,
  QuestPack,
  QuestTemplate,
  Recurrence,
  SaveFile,
} from './types';

const VALID_CATEGORIES = new Set<Category>(['detox', 'body', 'mind', 'wealth', 'personal']);
const VALID_DIFFICULTIES = new Set<Difficulty>([1, 2, 3]);
const VALID_RECURRENCES = new Set<Recurrence>(['once', 'daily', 'weekly']);

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export function validateQuestTemplate(raw: unknown, label = 'quest'): QuestTemplate {
  if (!isObject(raw)) {
    throw new Error(`Invalid ${label}: expected an object.`);
  }
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!id || !title) {
    throw new Error(`Invalid ${label}: "id" and "title" are required strings.`);
  }

  const category = (raw.category ?? 'personal') as Category;
  if (!VALID_CATEGORIES.has(category)) {
    throw new Error(`Invalid ${label} "${title}": unsupported category "${String(raw.category)}".`);
  }

  const difficulty = (raw.difficulty ?? 2) as Difficulty;
  if (!VALID_DIFFICULTIES.has(difficulty)) {
    throw new Error(
      `Invalid ${label} "${title}": difficulty must be 1, 2, or 3 (got ${String(raw.difficulty)}).`,
    );
  }

  const recurrence = (raw.recurrence ?? 'once') as Recurrence;
  if (!VALID_RECURRENCES.has(recurrence)) {
    throw new Error(
      `Invalid ${label} "${title}": recurrence must be once, daily, or weekly.`,
    );
  }

  const stats: QuestTemplate['stats'] = {};
  if (isObject(raw.stats)) {
    for (const key of ['body', 'mind', 'spirit', 'wealth'] as const) {
      const v = raw.stats[key];
      if (typeof v === 'number' && Number.isFinite(v)) {
        stats[key] = v;
      }
    }
  }

  return {
    id,
    title,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    category,
    difficulty,
    recurrence,
    stats,
    flavor: typeof raw.flavor === 'string' ? raw.flavor : undefined,
  };
}

export function validateChainTemplate(raw: unknown): ChainTemplate {
  if (!isObject(raw)) {
    throw new Error('Invalid chain template: expected an object.');
  }
  const id = typeof raw.id === 'string' ? raw.id.trim() : '';
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!id || !title) {
    throw new Error('Invalid chain template: "id" and "title" are required.');
  }
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) {
    throw new Error(`Invalid chain "${title}": "steps" must be a non-empty array.`);
  }
  const steps = raw.steps.map((s, idx) =>
    validateQuestTemplate(s, `chain "${title}" step ${idx + 1}`),
  );
  const source =
    raw.source === 'template' || raw.source === 'custom' || raw.source === 'pack'
      ? raw.source
      : 'pack';

  return {
    id,
    title,
    description: typeof raw.description === 'string' ? raw.description : undefined,
    steps,
    source,
  };
}

export function validateQuestPack(raw: unknown): QuestPack {
  if (!isObject(raw)) {
    throw new Error('Invalid QuestPack: expected a JSON object.');
  }
  if (raw.packVersion !== 1) {
    throw new Error(`Unsupported QuestPack version: ${String(raw.packVersion)}. Expected 1.`);
  }
  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) {
    throw new Error('Invalid QuestPack: "name" is required.');
  }
  if (!Array.isArray(raw.quests) || !Array.isArray(raw.chains)) {
    throw new Error('Invalid QuestPack: "quests" and "chains" must be arrays.');
  }

  const quests = raw.quests.map((q, idx) => validateQuestTemplate(q, `pack quest #${idx + 1}`));
  const chains = raw.chains.map((c) => validateChainTemplate(c));

  return {
    packVersion: 1,
    name,
    quests,
    chains,
  };
}

export function validateSaveFile(raw: unknown): SaveFile {
  if (!isObject(raw)) {
    throw new Error('Invalid save file: expected a JSON object.');
  }
  if (raw.saveVersion !== 1) {
    throw new Error(`Unsupported saveVersion: ${String(raw.saveVersion)}. Expected 1.`);
  }
  if (!isObject(raw.player) || typeof raw.player.name !== 'string') {
    throw new Error('Invalid save file: missing valid player object.');
  }
  if (!Array.isArray(raw.quests) || !Array.isArray(raw.chains)) {
    throw new Error('Invalid save file: quests and chains must be arrays.');
  }

  return raw as unknown as SaveFile;
}

export type ParsedImportPayload =
  | { kind: 'pack'; data: QuestPack }
  | { kind: 'save'; data: SaveFile };

/**
 * Parses a JSON string and determines whether it is a QuestPack or a full SaveFile.
 */
export function parseImportedJson(jsonText: string): ParsedImportPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON file. Please select a valid .json Save or QuestPack file.');
  }

  if (!isObject(parsed)) {
    throw new Error('Imported JSON must be an object.');
  }

  if ('packVersion' in parsed) {
    return { kind: 'pack', data: validateQuestPack(parsed) };
  }

  if ('saveVersion' in parsed) {
    return { kind: 'save', data: validateSaveFile(parsed) };
  }

  throw new Error(
    'Unrecognized JSON format: expected either "packVersion: 1" (QuestPack) or "saveVersion: 1" (SaveFile).',
  );
}

export interface MergeQuestPackResult {
  quests: Quest[];
  chains: Chain[];
  addedQuestsCount: number;
  addedChainsCount: number;
}

/**
 * Merges a QuestPack into the player's existing quests and chains without resetting progress.
 * Skips quests/chains whose IDs are already present.
 */
export function mergeQuestPack(
  currentState: { quests: Quest[]; chains: Chain[] },
  pack: QuestPack,
  acceptedAt: string,
): MergeQuestPackResult {
  const existingQuestTemplateIds = new Set(currentState.quests.map((q) => q.id));
  const existingChainIds = new Set(currentState.chains.map((c) => c.id));

  const nextQuests = [...currentState.quests];
  const nextChains = [...currentState.chains];
  let addedQuestsCount = 0;
  let addedChainsCount = 0;

  for (const qt of pack.quests) {
    if (!existingQuestTemplateIds.has(qt.id)) {
      const questInstance = instantiateQuest(qt, {
        instanceId: `pack-${qt.id}-${acceptedAt}`,
        source: 'pack',
        acceptedAt,
      });
      nextQuests.push(questInstance);
      existingQuestTemplateIds.add(qt.id);
      addedQuestsCount++;
    }
  }

  for (const ct of pack.chains) {
    if (!existingChainIds.has(ct.id)) {
      const { chain, firstStepQuest } = startChain(
        { ...ct, source: 'pack' },
        acceptedAt,
        `pack-chain-${ct.id}`,
      );
      nextChains.push(chain);
      nextQuests.push(firstStepQuest);
      existingChainIds.add(ct.id);
      addedChainsCount++;
    }
  }

  return {
    quests: nextQuests,
    chains: nextChains,
    addedQuestsCount,
    addedChainsCount,
  };
}

export function createSaveFile(
  state: Omit<SaveFile, 'saveVersion' | 'exportedAt'>,
  exportedAt = new Date().toISOString(),
): SaveFile {
  return {
    saveVersion: 1,
    exportedAt,
    onboardingDone: state.onboardingDone,
    player: state.player,
    quests: state.quests,
    chains: state.chains,
    returnBonusClaimedOn: state.returnBonusClaimedOn,
  };
}

export type Category = 'detox' | 'body' | 'mind' | 'wealth' | 'personal';
export type StatKey = 'body' | 'mind' | 'spirit' | 'wealth';
export type Recurrence = 'once' | 'daily' | 'weekly';
export type Difficulty = 1 | 2 | 3; // EXP 15 / 30 / 60
export type Mood = 'exhausted' | 'stuck' | 'restless' | 'okay';
export type SpriteIndex = 0 | 1 | 2 | 3;

export interface QuestTemplate {
  id: string;
  title: string;
  description?: string;
  category: Category;
  difficulty: Difficulty;
  recurrence: Recurrence;
  stats: Partial<Record<StatKey, number>>;
  flavor?: string; // one RPG-flavored line, e.g. "The wall stares back."
}

export interface QuestCompletion {
  at: string; // ISO timestamp or YYYY-MM-DD
  note?: string;
}

export interface Quest extends QuestTemplate {
  instanceId: string;
  source: 'library' | 'custom' | 'chain' | 'pack';
  chainId?: string;
  chainStep?: number;
  status: 'active' | 'done' | 'archived';
  acceptedAt: string;
  completions: QuestCompletion[];
}

export interface Chain {
  id: string;
  title: string;
  description?: string;
  steps: QuestTemplate[];
  currentStep: number;
  status: 'active' | 'done';
  source: 'template' | 'custom' | 'pack';
}

export type ChainTemplate = Omit<Chain, 'currentStep' | 'status'>;

export interface QuestPack {
  packVersion: 1;
  name: string;
  quests: QuestTemplate[];
  chains: ChainTemplate[];
}

export interface Player {
  name: string;
  sprite: SpriteIndex;
  level: number;
  xp: number;
  stats: Record<StatKey, number>;
  gold: number;
  daysAdventured: string[]; // ISO dates YYYY-MM-DD
  badges: string[];
  prefs: {
    mood?: string;
    focus: Category[];
  };
  lastSeen: string; // ISO date YYYY-MM-DD
  musicVolume: number;
  sfxVolume: number;
  dailyRerollUsedOn?: string; // ISO date YYYY-MM-DD
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type BonusType = 'none' | 'critical' | 'lucky';

export interface BonusRollResult {
  bonusType: BonusType;
  xpMultiplier: number;
  bonusGold: number;
  message?: string;
}

export interface RewardOutcome {
  questTitle: string;
  baseXp: number;
  totalXp: number;
  baseGold: number;
  bonusGold: number;
  totalGold: number;
  bonusType: BonusType;
  bonusMessage?: string;
  statGains: Partial<Record<StatKey, number>>;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  previousXp: number;
  newXp: number;
  xpForNextLevel: number;
  newlyEarnedBadges: BadgeDefinition[];
  unlockedNextStep?: Quest;
  completedChainTitle?: string;
  closingNudge: string;
}

export interface ReturnBonusResult {
  eligible: boolean;
  daysAway: number;
  bonusXp: number;
  message: string;
}

export interface SaveFile {
  saveVersion: 1;
  exportedAt: string;
  onboardingDone: boolean;
  player: Player;
  quests: Quest[];
  chains: Chain[];
  returnBonusClaimedOn?: string;
}

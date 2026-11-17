import type { GameSettings, SaveData } from './types';

export const SAVE_STORAGE_KEY = 'bad_santa_nightmare_save_v1';
export const TOTAL_LEVELS = 30;
export const TRUE_ENDING_PRESENTS_THRESHOLD = 18;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createDefaultSaveData(): SaveData {
  return {
    highestUnlockedLevel: 1,
    totalScore: 0,
    totalBells: 0,
    levelProgress: {},
    settings: {
      soundEnabled: true,
      musicEnabled: true,
      mobileControls: 'auto',
      unlockAllLevels: false,
    },
  };
}

function getDefaultStorage(): StorageLike | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function loadSaveData(storage: StorageLike | null = getDefaultStorage()): SaveData {
  const fallback = createDefaultSaveData();
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(SAVE_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      highestUnlockedLevel: clampLevel(parsed.highestUnlockedLevel ?? 1),
      totalScore: typeof parsed.totalScore === 'number' ? Math.max(0, Math.floor(parsed.totalScore)) : 0,
      totalBells: typeof parsed.totalBells === 'number' ? Math.max(0, Math.floor(parsed.totalBells)) : 0,
      levelProgress: parsed.levelProgress && typeof parsed.levelProgress === 'object' ? parsed.levelProgress : {},
      settings: {
        soundEnabled: parsed.settings?.soundEnabled ?? true,
        musicEnabled: parsed.settings?.musicEnabled ?? true,
        mobileControls:
          parsed.settings?.mobileControls === 'always' || parsed.settings?.mobileControls === 'off'
            ? parsed.settings.mobileControls
            : 'auto',
        unlockAllLevels: Boolean(parsed.settings?.unlockAllLevels),
      },
    };
  } catch {
    return fallback;
  }
}

export function persistSaveData(data: SaveData, storage: StorageLike | null = getDefaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(SAVE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota / private browsing write errors gracefully
  }
}

export function clampLevel(levelId: number): number {
  return Math.max(1, Math.min(TOTAL_LEVELS, Math.floor(levelId)));
}

export function isLevelUnlocked(save: SaveData, levelId: number): boolean {
  if (save.settings.unlockAllLevels) return true;
  return levelId <= save.highestUnlockedLevel;
}

export function recordLevelVictory(
  save: SaveData,
  params: {
    levelId: number;
    score: number;
    bells: number;
    presentsFound: number;
    elapsedSeconds: number;
  },
  storage: StorageLike | null = getDefaultStorage(),
): SaveData {
  const prev = save.levelProgress[params.levelId];
  const nextProgress = {
    ...save.levelProgress,
    [params.levelId]: {
      completed: true,
      bestScore: Math.max(prev?.bestScore ?? 0, Math.round(params.score)),
      bestTimeSeconds:
        prev?.bestTimeSeconds != null
          ? Math.min(prev.bestTimeSeconds, Math.round(params.elapsedSeconds))
          : Math.round(params.elapsedSeconds),
      presentsFound: Math.max(prev?.presentsFound ?? 0, params.presentsFound),
    },
  };

  const nextUnlocked = Math.max(
    save.highestUnlockedLevel,
    clampLevel(params.levelId + 1),
  );

  const totalScore = Object.values(nextProgress).reduce((sum, rec) => sum + rec.bestScore, 0);

  const updated: SaveData = {
    ...save,
    highestUnlockedLevel: nextUnlocked,
    totalScore,
    totalBells: save.totalBells + Math.max(0, Math.round(params.bells)),
    levelProgress: nextProgress,
  };

  persistSaveData(updated, storage);
  return updated;
}

export function updateSettings(
  save: SaveData,
  patch: Partial<GameSettings>,
  storage: StorageLike | null = getDefaultStorage(),
): SaveData {
  const updated: SaveData = {
    ...save,
    settings: {
      ...save.settings,
      ...patch,
    },
  };
  persistSaveData(updated, storage);
  return updated;
}

export function countTotalPresentsFound(save: SaveData): number {
  return Object.values(save.levelProgress).reduce(
    (sum, rec) => sum + (rec.presentsFound || 0),
    0,
  );
}

export function determineFinalEnding(save: SaveData): 'standard_escape' | 'true_savior' {
  return countTotalPresentsFound(save) >= TRUE_ENDING_PRESENTS_THRESHOLD
    ? 'true_savior'
    : 'standard_escape';
}

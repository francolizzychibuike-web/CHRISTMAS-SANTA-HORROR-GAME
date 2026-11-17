export type GameScreenState = 'title' | 'playing' | 'paused' | 'gameover';

export type GameOutcomeKind = 'victory' | 'defeat' | 'final_victory';

export type EndingKind = 'standard_escape' | 'true_savior';

export enum SantaState {
  PATROL = 'PATROL',
  ALERT_LAUGH = 'ALERT_LAUGH',
  CHASE = 'CHASE',
  SEARCH_HIDING = 'SEARCH_HIDING',
  SCRIPTED_AMBUSH = 'SCRIPTED_AMBUSH',
}

export enum EnemyKind {
  SNOWMAN = 'SNOWMAN',
  TOY_SOLDIER = 'TOY_SOLDIER',
  REINDEER = 'REINDEER',
  FLYING_TOY = 'FLYING_TOY',
  ELF = 'ELF',
}

export enum PowerUpKind {
  SPEED_BOOST = 'SPEED_BOOST',
  PROTECTION = 'PROTECTION',
  INVISIBLE = 'INVISIBLE',
  EXTRA_LIFE = 'EXTRA_LIFE',
}

export enum CollectibleKind {
  KEY = 'KEY',
  GOLDEN_BELL = 'GOLDEN_BELL',
  SECRET_PRESENT = 'SECRET_PRESENT',
}

export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'ground' | 'ledge' | 'bridge' | 'ice' | 'roof';
}

export interface SlopeDef {
  x: number;
  y: number; // top of left edge or right edge depending on dir
  w: number;
  h: number;
  direction: 'down_right' | 'down_left';
}

export interface LowObstacleDef {
  x: number;
  y: number; // top of obstacle
  w: number;
  h: number; // bottom leaves 34px clearance above ground so standing (54px) collides, sliding (26px) passes!
  kind: 'icicle_beam' | 'tunnel_arch' | 'toy_gate' | 'fallen_tree';
}

export interface HidingSpotDef {
  id: string;
  x: number;
  y: number; // ground y
  kind: 'wardrobe' | 'snowdrift' | 'gift_crate' | 'locker';
}

export interface PuzzleGateDef {
  id: string;
  gateX: number;
  gateY: number;
  gateH: number;
  leverX: number;
  leverY: number;
}

export interface EnemySpawnDef {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  patrolMinX: number;
  patrolMaxX: number;
}

export interface CollectibleSpawnDef {
  id: string;
  kind: CollectibleKind | PowerUpKind;
  x: number;
  y: number;
}

export interface AmbushZoneDef {
  id: string;
  triggerX: number;
  spawnX: number;
  spawnY: number;
}

export interface LevelPalette {
  skyTop: string;
  skyBottom: string;
  horizonTint: string;
  groundFill: string;
  groundSnow: string;
  accentLight: string;
  fogAlpha: number;
  darknessAlpha: number;
  stormIntensity: number; // 0.2 to 1.0
  iceFriction: number; // 1.0 normal snow, 0.35 slick ice
}

export interface LevelConfig {
  id: number; // 1..30
  name: string;
  chapter: string;
  subtitle: string;
  worldWidth: number;
  worldHeight: number;
  groundY: number;
  spawnX: number;
  spawnY: number;
  exitX: number;
  exitY: number;
  checkpointX: number;
  checkpointY: number;
  keysRequired: number;
  santaPatrolMinX: number;
  santaPatrolMaxX: number;
  santaStartX: number;
  santaStartY: number;
  santaBaseSpeed: number;
  santaChaseSpeed: number;
  santaDetectionRange: number;
  palette: LevelPalette;
  platforms: PlatformDef[];
  slopes: SlopeDef[];
  lowObstacles: LowObstacleDef[];
  hidingSpots: HidingSpotDef[];
  puzzleGates: PuzzleGateDef[];
  enemies: EnemySpawnDef[];
  collectibles: CollectibleSpawnDef[];
  ambushZones: AmbushZoneDef[];
}

export interface InputState {
  left: boolean;
  right: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  slide: boolean;
  sprint: boolean;
  interactJustPressed: boolean;
}

export interface HudSnapshot {
  levelId: number;
  levelName: string;
  lives: number;
  maxLives: number;
  score: number;
  bells: number;
  keysCollected: number;
  keysRequired: number;
  presentsCollected: number;
  presentsTotal: number;
  stamina: number; // 0..100
  isSliding: boolean;
  isHidden: boolean;
  santaState: SantaState;
  santaDistance: number;
  speedBoostLeft: number;
  shieldLeft: number;
  invisibleLeft: number;
  interactPrompt: string | null;
  checkpointReached: boolean;
  elapsedSeconds: number;
}

export interface RunStats {
  outcome: GameOutcomeKind;
  levelId: number;
  levelName: string;
  score: number;
  bestScore: number;
  bells: number;
  keysCollected: number;
  keysRequired: number;
  presentsCollected: number;
  presentsTotal: number;
  elapsedSeconds: number;
  damageTaken: number;
  endingKind?: EndingKind;
  totalPresentsAcrossGame?: number;
}

export interface LevelProgressRecord {
  completed: boolean;
  bestScore: number;
  bestTimeSeconds: number | null;
  presentsFound: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  mobileControls: 'auto' | 'always' | 'off';
  unlockAllLevels: boolean;
}

export interface SaveData {
  highestUnlockedLevel: number;
  totalScore: number;
  totalBells: number;
  levelProgress: Record<number, LevelProgressRecord>;
  settings: GameSettings;
}

import test from 'node:test';
import assert from 'node:assert/strict';

import { LEVELS, getLevelById } from './levels';
import {
  PLAYER_SLIDE_HEIGHT,
  PLAYER_STAND_HEIGHT,
  canStandUp,
  computeSlideJumpVelocity,
  computeSlopeSlideVelocity,
  evaluateJumpAction,
  evaluateSlopeAtX,
  shouldTriggerJump,
} from './physicsLogic';
import { stepSantaAI } from './santaAI';
import {
  TRUE_ENDING_PRESENTS_THRESHOLD,
  createDefaultSaveData,
  determineFinalEnding,
  isLevelUnlocked,
  loadSaveData,
  recordLevelVictory,
  updateSettings,
  type StorageLike,
} from './saveSystem';
import { CollectibleKind, SantaState } from './types';

function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
  };
}

test('all 30 required levels exist with exact titles and valid playable geometry', () => {
  assert.equal(LEVELS.length, 30);

  const expectedNames = [
    'The Christmas Village',
    'The Snowy Street',
    'The Frozen Bridge',
    'The Christmas Forest',
    'The Haunted Toy Shop',
    'The Abandoned School',
    'The Snowman Graveyard',
    'The Frozen River',
    'The Christmas Market',
    "Santa's Workshop",
    'The Dark Tunnel',
    'The Haunted Train Station',
    'The Reindeer Barn',
    'The Ice Cave',
    'The Christmas Hotel',
    'The Abandoned Shopping Mall',
    'The Snowstorm',
    'The Frozen Castle',
    'The Secret Toy Factory',
    "Santa's Mansion",
    'The Underground Passage',
    'The Haunted Christmas Garden',
    'The Dark Mountain',
    'The Frozen Lake',
    "Santa's Secret Laboratory",
    'The Nightmare Forest',
    'The Final Workshop',
    'The Christmas Dungeon',
    "Santa's Final Chase",
    'The Ultimate Escape',
  ];

  for (let i = 0; i < 30; i++) {
    const level = getLevelById(i + 1);
    assert.equal(level.id, i + 1);
    assert.equal(level.name, expectedNames[i]);
    // Open safe spawn stretch >= 600px wide
    assert.ok(level.platforms[0].w >= 600, `Level ${level.id} opening platform too narrow`);
    assert.ok(level.hidingSpots.length >= 2, `Level ${level.id} needs hiding spots`);
    assert.ok(level.lowObstacles.length >= 2, `Level ${level.id} needs low obstacles to slide under`);
    assert.ok(level.slopes.length >= 1, `Level ${level.id} needs at least one snow slope`);

    // Every level has at least as many key collectibles as keysRequired
    const keyCount = level.collectibles.filter((c) => c.kind === CollectibleKind.KEY).length;
    assert.ok(
      keyCount >= level.keysRequired,
      `Level ${level.id} has ${keyCount} keys but requires ${level.keysRequired}`,
    );

    // Every puzzle gate has lever placed before gate
    for (const pg of level.puzzleGates) {
      assert.ok(pg.leverX < pg.gateX, `Level ${level.id} lever must be reachable before gate`);
    }
  }

  // Progressive difficulty check: Level 30 Santa is faster than Level 1 Santa
  assert.ok(getLevelById(30).santaChaseSpeed > getLevelById(1).santaChaseSpeed);
});

test('sliding physics accelerate down slopes and enforce low-clearance crouch', () => {
  const slope = { x: 100, y: 400, w: 200, h: 80, direction: 'down_right' as const };
  const contact = evaluateSlopeAtX(slope, 200);
  assert.ok(contact && contact.onSlope);
  assert.equal(contact.surfaceY, 440);
  assert.equal(contact.downhillSign, 1);

  const nextVx = computeSlopeSlideVelocity({
    currentVx: 220,
    dt: 0.1,
    slope: contact,
    iceFriction: 0.9,
    facing: 1,
  });
  assert.ok(nextVx > 220, 'Sliding down a slope should increase velocity');

  // Low obstacle positioned at 34px clearance above ground (groundY = 560)
  // Standing height = 54 -> collides; sliding height = 26 -> fits!
  const lowObs = [{ x: 300, y: 560 - 34 - 60, w: 100, h: 60, kind: 'icicle_beam' as const }];
  assert.equal(PLAYER_SLIDE_HEIGHT < 34, true);
  assert.equal(PLAYER_STAND_HEIGHT > 34, true);
  assert.equal(canStandUp(350, 560, lowObs), false);
  assert.equal(canStandUp(150, 560, lowObs), true);

  const jumpOut = computeSlideJumpVelocity(320, 1);
  assert.ok(jumpOut.vx > 320);
  assert.ok(jumpOut.vy < 0);

  assert.equal(shouldTriggerJump(0.05, 0.05), true);
  assert.equal(shouldTriggerJump(0, 0.05), false);

  // Double jump state machine checks
  assert.equal(
    evaluateJumpAction({
      coyoteTimer: 0.08,
      jumpBufferTimer: 0.1,
      jumpJustPressed: true,
      airJumpsRemaining: 1,
      grounded: true,
    }),
    'ground',
  );

  // Holding jump in mid-air does NOT trigger air jump
  assert.equal(
    evaluateJumpAction({
      coyoteTimer: 0,
      jumpBufferTimer: 0.05,
      jumpJustPressed: false,
      airJumpsRemaining: 1,
      grounded: false,
    }),
    'none',
  );

  // Distinct second press in mid-air triggers double jump
  assert.equal(
    evaluateJumpAction({
      coyoteTimer: 0,
      jumpBufferTimer: 0.12,
      jumpJustPressed: true,
      airJumpsRemaining: 1,
      grounded: false,
    }),
    'air',
  );

  // No third jump once airJumpsRemaining is exhausted
  assert.equal(
    evaluateJumpAction({
      coyoteTimer: 0,
      jumpBufferTimer: 0.12,
      jumpJustPressed: true,
      airJumpsRemaining: 0,
      grounded: false,
    }),
    'none',
  );
});

test('Evil Santa AI transitions cleanly between patrol, laugh telegraph, chase, hiding search, and back', () => {
  // 1. Patrol detects nearby visible player -> ALERT_LAUGH
  const alertOut = stepSantaAI({
    santaX: 500,
    santaY: 560,
    santaVx: 100,
    santaFacing: 1,
    state: SantaState.PATROL,
    stateTimer: 0,
    patrolMinX: 300,
    patrolMaxX: 900,
    baseSpeed: 130,
    chaseSpeed: 260,
    detectionRange: 380,
    playerX: 700,
    playerY: 560,
    playerIsHidden: false,
    playerIsInvisible: false,
    playerExitProgress: 0.2,
    lastKnownPlayerX: null,
    dt: 0.016,
  });
  assert.equal(alertOut.nextState, SantaState.ALERT_LAUGH);
  assert.equal(alertOut.triggeredLaugh, true);

  // 2. Alert timer expires -> CHASE, and speeds up as player nears exit
  const chaseEarly = stepSantaAI({
    santaX: 500,
    santaY: 560,
    santaVx: 0,
    santaFacing: 1,
    state: SantaState.ALERT_LAUGH,
    stateTimer: 0.01,
    patrolMinX: 300,
    patrolMaxX: 900,
    baseSpeed: 130,
    chaseSpeed: 260,
    detectionRange: 380,
    playerX: 700,
    playerY: 560,
    playerIsHidden: false,
    playerIsInvisible: false,
    playerExitProgress: 0.1,
    lastKnownPlayerX: 700,
    dt: 0.02,
  });
  assert.equal(chaseEarly.nextState, SantaState.CHASE);

  const chaseLate = stepSantaAI({
    santaX: 500,
    santaY: 560,
    santaVx: 260,
    santaFacing: 1,
    state: SantaState.CHASE,
    stateTimer: 2.0,
    patrolMinX: 300,
    patrolMaxX: 900,
    baseSpeed: 130,
    chaseSpeed: 260,
    detectionRange: 380,
    playerX: 720,
    playerY: 560,
    playerIsHidden: false,
    playerIsInvisible: false,
    playerExitProgress: 0.95,
    lastKnownPlayerX: 720,
    dt: 0.016,
  });
  assert.ok(chaseLate.targetVx > 260 * 1.2, 'Santa must accelerate when player nears exit');

  // 3. Player hides -> Santa enters SEARCH_HIDING, then returns to PATROL
  const searchOut = stepSantaAI({
    santaX: 640,
    santaY: 560,
    santaVx: 260,
    santaFacing: 1,
    state: SantaState.CHASE,
    stateTimer: 2.0,
    patrolMinX: 300,
    patrolMaxX: 900,
    baseSpeed: 130,
    chaseSpeed: 260,
    detectionRange: 380,
    playerX: 720,
    playerY: 560,
    playerIsHidden: true,
    playerIsInvisible: false,
    playerExitProgress: 0.5,
    lastKnownPlayerX: 720,
    dt: 0.016,
  });
  assert.equal(searchOut.nextState, SantaState.SEARCH_HIDING);

  const backToPatrol = stepSantaAI({
    santaX: 710,
    santaY: 560,
    santaVx: 80,
    santaFacing: 1,
    state: SantaState.SEARCH_HIDING,
    stateTimer: 0.01,
    patrolMinX: 300,
    patrolMaxX: 900,
    baseSpeed: 130,
    chaseSpeed: 260,
    detectionRange: 380,
    playerX: 720,
    playerY: 560,
    playerIsHidden: true,
    playerIsInvisible: false,
    playerExitProgress: 0.5,
    lastKnownPlayerX: 720,
    dt: 0.02,
  });
  assert.equal(backToPatrol.nextState, SantaState.PATROL);
});

test('save system unlocks levels, persists settings, and computes endings', () => {
  const storage = createMemoryStorage();
  let save = createDefaultSaveData();
  assert.equal(isLevelUnlocked(save, 1), true);
  assert.equal(isLevelUnlocked(save, 2), false);

  save = recordLevelVictory(
    save,
    { levelId: 1, score: 1500, bells: 4, presentsFound: 1, elapsedSeconds: 38 },
    storage,
  );
  assert.equal(save.highestUnlockedLevel, 2);
  assert.equal(isLevelUnlocked(save, 2), true);

  save = updateSettings(save, { soundEnabled: false, unlockAllLevels: true }, storage);
  const reloaded = loadSaveData(storage);
  assert.equal(reloaded.settings.soundEnabled, false);
  assert.equal(isLevelUnlocked(reloaded, 30), true);

  assert.equal(determineFinalEnding(reloaded), 'standard_escape');
  for (let lvl = 2; lvl <= TRUE_ENDING_PRESENTS_THRESHOLD; lvl++) {
    save = recordLevelVictory(
      save,
      { levelId: lvl, score: 1000, bells: 2, presentsFound: 1, elapsedSeconds: 40 },
      storage,
    );
  }
  assert.equal(determineFinalEnding(save), 'true_savior');
});

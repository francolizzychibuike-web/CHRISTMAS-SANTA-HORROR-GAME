import { SantaState } from './types';

export interface SantaDecisionInput {
  santaX: number;
  santaY: number;
  santaVx: number;
  santaFacing: 1 | -1;
  state: SantaState;
  stateTimer: number;
  patrolMinX: number;
  patrolMaxX: number;
  baseSpeed: number;
  chaseSpeed: number;
  detectionRange: number;
  playerX: number;
  playerY: number;
  playerIsHidden: boolean;
  playerIsInvisible: boolean;
  playerExitProgress: number; // 0.0 (start) -> 1.0 (at exit)
  lastKnownPlayerX: number | null;
  dt: number;
}

export interface SantaDecisionOutput {
  nextState: SantaState;
  nextStateTimer: number;
  targetVx: number;
  nextFacing: 1 | -1;
  nextLastKnownPlayerX: number | null;
  triggeredLaugh: boolean;
}

/**
 * Pure deterministic AI state machine for Evil Santa:
 * - Patrols assigned zone
 * - Detects visible, non-hidden players within detectionRange & vertical band
 * - Plays brief telegraph laugh (ALERT_LAUGH) before full CHASE
 * - Speeds up dynamically as player approaches the exit
 * - Searches around hiding spot (SEARCH_HIDING) if player hides nearby
 * - Returns to PATROL once player evades detection
 */
export function stepSantaAI(input: SantaDecisionInput): SantaDecisionOutput {
  const dx = input.playerX - input.santaX;
  const dy = input.playerY - input.santaY;
  const dist = Math.hypot(dx, dy);
  const canDetectPlayer =
    !input.playerIsHidden &&
    !input.playerIsInvisible &&
    dist <= input.detectionRange &&
    Math.abs(dy) <= 210;

  let nextState = input.state;
  let nextTimer = Math.max(0, input.stateTimer - input.dt);
  let targetVx = 0;
  let nextFacing: 1 | -1 = input.santaFacing;
  let lastKnownX = input.lastKnownPlayerX;
  let triggeredLaugh = false;

  // Exit proximity urgency: Santa becomes up to +28% faster near the exit
  const urgencyMultiplier = 1 + Math.max(0, Math.min(1, input.playerExitProgress)) * 0.28;

  switch (input.state) {
    case SantaState.PATROL: {
      if (canDetectPlayer) {
        nextState = SantaState.ALERT_LAUGH;
        nextTimer = 0.42;
        lastKnownX = input.playerX;
        nextFacing = dx >= 0 ? 1 : -1;
        triggeredLaugh = true;
        targetVx = 0;
        break;
      }

      // Patrol back and forth between patrolMinX and patrolMaxX
      if (input.santaX <= input.patrolMinX + 8) {
        nextFacing = 1;
      } else if (input.santaX >= input.patrolMaxX - 8) {
        nextFacing = -1;
      }
      targetVx = nextFacing * input.baseSpeed;
      break;
    }

    case SantaState.SCRIPTED_AMBUSH: {
      nextState = SantaState.ALERT_LAUGH;
      nextTimer = 0.35;
      lastKnownX = input.playerX;
      nextFacing = dx >= 0 ? 1 : -1;
      triggeredLaugh = true;
      targetVx = 0;
      break;
    }

    case SantaState.ALERT_LAUGH: {
      nextFacing = dx >= 0 ? 1 : -1;
      targetVx = nextFacing * (input.baseSpeed * 0.35);
      if (nextTimer <= 0) {
        nextState = SantaState.CHASE;
        nextTimer = 4.5;
        lastKnownX = input.playerX;
      }
      break;
    }

    case SantaState.CHASE: {
      if (input.playerIsHidden || input.playerIsInvisible) {
        // Player slipped into a hiding spot or turned invisible!
        nextState = SantaState.SEARCH_HIDING;
        nextTimer = 3.2;
        lastKnownX = input.playerX;
        targetVx = 0;
        break;
      }

      if (canDetectPlayer) {
        lastKnownX = input.playerX;
        nextTimer = 3.6; // keep chase timer refreshed while in sight
      }

      if (nextTimer <= 0 && dist > input.detectionRange * 1.25) {
        nextState = SantaState.SEARCH_HIDING;
        nextTimer = 2.4;
        targetVx = 0;
        break;
      }

      const goalX = lastKnownX ?? input.playerX;
      const toGoal = goalX - input.santaX;
      if (Math.abs(toGoal) > 6) {
        nextFacing = toGoal >= 0 ? 1 : -1;
        targetVx = nextFacing * input.chaseSpeed * urgencyMultiplier;
      } else {
        targetVx = 0;
      }
      break;
    }

    case SantaState.SEARCH_HIDING: {
      if (canDetectPlayer) {
        nextState = SantaState.CHASE;
        nextTimer = 4.0;
        lastKnownX = input.playerX;
        nextFacing = dx >= 0 ? 1 : -1;
        targetVx = nextFacing * input.chaseSpeed * urgencyMultiplier;
        break;
      }

      const searchCenter = lastKnownX ?? input.santaX;
      const offsetFromCenter = input.santaX - searchCenter;

      if (Math.abs(offsetFromCenter) > 85) {
        nextFacing = offsetFromCenter > 0 ? -1 : 1;
      } else if (Math.floor(nextTimer * 2.2) % 2 === 0) {
        nextFacing = 1;
      } else {
        nextFacing = -1;
      }

      targetVx = nextFacing * (input.baseSpeed * 0.72);

      if (nextTimer <= 0) {
        nextState = SantaState.PATROL;
        nextTimer = 0;
        lastKnownX = null;
      }
      break;
    }
  }

  return {
    nextState,
    nextStateTimer: nextTimer,
    targetVx,
    nextFacing,
    nextLastKnownPlayerX: lastKnownX,
    triggeredLaugh,
  };
}

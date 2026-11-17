import type { LowObstacleDef, SlopeDef } from './types';

export const PLAYER_WIDTH = 28;
export const PLAYER_STAND_HEIGHT = 54;
export const PLAYER_SLIDE_HEIGHT = 26;

export const MOVE_WALK_SPEED = 235;
export const MOVE_SPRINT_SPEED = 345;
export const SLIDE_MIN_SPEED = 290;
export const SLIDE_MAX_SPEED = 560;
export const SLIDE_BOOST_IMPULSE = 145;
export const JUMP_VELOCITY = -525;
export const DOUBLE_JUMP_VELOCITY = -485;
export const MAX_AIR_JUMPS = 1;
export const GRAVITY_Y = 1280;
export const COYOTE_TIME_SECONDS = 0.11;
export const JUMP_BUFFER_SECONDS = 0.12;

export interface SlopeContact {
  onSlope: boolean;
  surfaceY: number;
  slopeAngleRad: number;
  downhillSign: number; // +1 if downhill goes right, -1 if downhill goes left
}

/**
 * Computes the slope surface Y at a given world X if the player horizontally overlaps the slope.
 */
export function evaluateSlopeAtX(slope: SlopeDef, x: number): SlopeContact | null {
  if (x < slope.x || x > slope.x + slope.w) {
    return null;
  }
  const t = Math.max(0, Math.min(1, (x - slope.x) / slope.w));
  if (slope.direction === 'down_right') {
    // Left side is high (slope.y), right side is low (slope.y + slope.h)
    const surfaceY = slope.y + t * slope.h;
    const slopeAngleRad = Math.atan2(slope.h, slope.w);
    return {
      onSlope: true,
      surfaceY,
      slopeAngleRad,
      downhillSign: 1,
    };
  } else {
    // Left side is low (slope.y + slope.h), right side is high (slope.y)
    const surfaceY = slope.y + (1 - t) * slope.h;
    const slopeAngleRad = Math.atan2(slope.h, slope.w);
    return {
      onSlope: true,
      surfaceY,
      slopeAngleRad,
      downhillSign: -1,
    };
  }
}

/**
 * Updates horizontal sliding velocity with slope acceleration and snow/ice friction.
 */
export function computeSlopeSlideVelocity(params: {
  currentVx: number;
  dt: number;
  slope: SlopeContact | null;
  iceFriction: number; // 0.35 = slick ice, 1.0 = normal snow
  facing: 1 | -1;
}): number {
  const { currentVx, dt, slope, iceFriction, facing } = params;
  let vx = currentVx;

  if (slope && slope.onSlope) {
    // Accelerate strongly down snowy/icy hills
    const slopeAccel = 720 * Math.sin(slope.slopeAngleRad) + 210;
    vx += slope.downhillSign * slopeAccel * dt;
  } else {
    // Flat snow / ice momentum decay
    const decayRate = 290 * iceFriction;
    if (Math.abs(vx) <= decayRate * dt) {
      vx = facing * 65;
    } else {
      vx -= Math.sign(vx) * decayRate * dt;
    }
  }

  if (vx > SLIDE_MAX_SPEED) vx = SLIDE_MAX_SPEED;
  if (vx < -SLIDE_MAX_SPEED) vx = -SLIDE_MAX_SPEED;
  return vx;
}

/**
 * Checks whether the player has vertical clearance to stand up from a slide
 * without clipping into a low-hanging obstacle.
 */
export function canStandUp(
  playerCenterX: number,
  playerFeetY: number,
  lowObstacles: LowObstacleDef[],
): boolean {
  const halfW = PLAYER_WIDTH * 0.5;
  const standTop = playerFeetY - PLAYER_STAND_HEIGHT;

  for (const obs of lowObstacles) {
    const horizOverlap =
      playerCenterX + halfW > obs.x + 2 &&
      playerCenterX - halfW < obs.x + obs.w - 2;
    if (!horizOverlap) continue;

    const obsBottom = obs.y + obs.h;
    // If standing head would intrude into the obstacle bottom (and feet are below obstacle top)
    if (standTop < obsBottom && playerFeetY > obs.y) {
      return false;
    }
  }
  return true;
}

/**
 * Checks coyote time and jump buffer to decide if a jump triggers on this frame.
 */
export function shouldTriggerJump(coyoteTimer: number, jumpBufferTimer: number): boolean {
  return coyoteTimer > 0 && jumpBufferTimer > 0;
}

export type JumpActionKind = 'ground' | 'air' | 'none';

/**
 * Decides whether the player triggers a ground/coyote jump, a mid-air double jump, or nothing.
 */
export function evaluateJumpAction(params: {
  coyoteTimer: number;
  jumpBufferTimer: number;
  jumpJustPressed: boolean;
  airJumpsRemaining: number;
  grounded: boolean;
}): JumpActionKind {
  if (shouldTriggerJump(params.coyoteTimer, params.jumpBufferTimer)) {
    return 'ground';
  }
  if (!params.grounded && params.jumpJustPressed && params.airJumpsRemaining > 0) {
    return 'air';
  }
  return 'none';
}

/**
 * Computes slide-jump horizontal boost when jumping mid-slide.
 */
export function computeSlideJumpVelocity(vx: number, facing: 1 | -1): { vx: number; vy: number } {
  const boostVx = Math.abs(vx) > 220 ? vx * 1.06 : facing * 265;
  const clampedVx = Math.max(-SLIDE_MAX_SPEED, Math.min(SLIDE_MAX_SPEED, boostVx));
  return {
    vx: clampedVx,
    vy: JUMP_VELOCITY * 0.96,
  };
}

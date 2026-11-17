import Phaser from 'phaser';
import { gameAudio } from './audio';
import {
  COYOTE_TIME_SECONDS,
  DOUBLE_JUMP_VELOCITY,
  JUMP_BUFFER_SECONDS,
  JUMP_VELOCITY,
  MAX_AIR_JUMPS,
  MOVE_SPRINT_SPEED,
  MOVE_WALK_SPEED,
  PLAYER_SLIDE_HEIGHT,
  PLAYER_STAND_HEIGHT,
  PLAYER_WIDTH,
  SLIDE_BOOST_IMPULSE,
  SLIDE_MIN_SPEED,
  canStandUp,
  computeSlideJumpVelocity,
  computeSlopeSlideVelocity,
  evaluateJumpAction,
  evaluateSlopeAtX,
  type SlopeContact,
} from './physicsLogic';
import type { InputState, LevelConfig } from './types';

export class PlayerController {
  public sprite: Phaser.Physics.Arcade.Sprite;
  public facing: 1 | -1 = 1;
  public isSliding = false;
  public isHidden = false;
  public stamina = 100;

  public speedBoostLeft = 0;
  public shieldLeft = 0;
  public invisibleLeft = 0;
  public invulnLeft = 0;

  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private airJumpsRemaining = MAX_AIR_JUMPS;
  private slideMomentumVx = 0;
  private wasGrounded = false;
  private footstepAccum = 0;
  private slideDustAccum = 0;
  private shieldRing: Phaser.GameObjects.Arc;
  private lanternGlow: Phaser.GameObjects.Image;
  private dustEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(
    private scene: Phaser.Scene,
    private level: LevelConfig,
  ) {
    this.sprite = scene.physics.add.sprite(level.spawnX, level.spawnY - 30, 'player_idle');
    this.sprite.setDepth(20);
    this.sprite.setCollideWorldBounds(true);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_WIDTH, PLAYER_STAND_HEIGHT);
    body.setOffset((40 - PLAYER_WIDTH) * 0.5, 58 - PLAYER_STAND_HEIGHT);

    this.lanternGlow = scene.add.image(this.sprite.x, this.sprite.y, 'soft_glow_amber');
    this.lanternGlow.setDepth(18);
    this.lanternGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.shieldRing = scene.add.circle(this.sprite.x, this.sprite.y, 32, 0x10b981, 0.18);
    this.shieldRing.setStrokeStyle(2.5, 0x34d399, 0.9);
    this.shieldRing.setDepth(21);
    this.shieldRing.setVisible(false);

    this.dustEmitter = scene.add.particles(0, 0, 'snowflake', {
      speed: { min: 25, max: 90 },
      angle: { min: 150, max: 210 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.85, end: 0 },
      lifespan: 340,
      emitting: false,
    });
    this.dustEmitter.setDepth(19);
  }

  public getBody(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  public update(dt: number, input: InputState): void {
    const body = this.getBody();

    // Update power-up & invulnerability timers
    if (this.speedBoostLeft > 0) this.speedBoostLeft = Math.max(0, this.speedBoostLeft - dt);
    if (this.shieldLeft > 0) this.shieldLeft = Math.max(0, this.shieldLeft - dt);
    if (this.invisibleLeft > 0) this.invisibleLeft = Math.max(0, this.invisibleLeft - dt);
    if (this.invulnLeft > 0) this.invulnLeft = Math.max(0, this.invulnLeft - dt);

    // Visual aura updates
    this.shieldRing.setVisible(this.shieldLeft > 0);
    this.shieldRing.setPosition(this.sprite.x, this.sprite.y);
    this.lanternGlow.setPosition(this.sprite.x, this.sprite.y - 4);
    this.lanternGlow.setVisible(!this.isHidden);

    if (this.isHidden) {
      body.setVelocity(0, 0);
      body.allowGravity = false;
      this.sprite.setAlpha(0.32);
      this.sprite.play('player-hide', true);
      return;
    }

    body.allowGravity = true;
    const baseAlpha = this.invisibleLeft > 0 ? 0.35 : 1;
    if (this.invulnLeft > 0 && Math.floor(this.invulnLeft * 16) % 2 === 0) {
      this.sprite.setAlpha(0.45);
    } else {
      this.sprite.setAlpha(baseAlpha);
    }

    // Slope detection under player feet
    const feetY = body.bottom;
    let activeSlope: SlopeContact | null = null;
    for (const s of this.level.slopes) {
      const contact = evaluateSlopeAtX(s, this.sprite.x);
      if (contact && Math.abs(feetY - contact.surfaceY) <= 22 && body.velocity.y >= -40) {
        activeSlope = contact;
        break;
      }
    }

    if (activeSlope && activeSlope.onSlope) {
      // Snap cleanly to snow slope surface
      const targetCenterY = activeSlope.surfaceY - body.height * 0.5;
      if (this.sprite.y > targetCenterY - 8 && body.velocity.y >= 0) {
        this.sprite.y = targetCenterY;
        body.velocity.y = 18;
      }
    }

    const grounded = body.blocked.down || body.touching.down || Boolean(activeSlope);
    if (grounded) {
      this.coyoteTimer = COYOTE_TIME_SECONDS;
      this.airJumpsRemaining = MAX_AIR_JUMPS;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (!this.wasGrounded && grounded) {
      // Landing squash
      this.sprite.setScale(1.2, 0.8);
      this.dustEmitter.emitParticleAt(this.sprite.x, body.bottom, 5);
    }
    this.wasGrounded = grounded;

    if (input.jumpJustPressed) {
      this.jumpBufferTimer = JUMP_BUFFER_SECONDS;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    // Facing direction
    const moveDir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (moveDir !== 0 && !this.isSliding) {
      this.facing = moveDir > 0 ? 1 : -1;
      this.sprite.setFlipX(this.facing === -1);
    }

    // Slide state management
    const mustStayLow =
      this.isSliding && !canStandUp(this.sprite.x, body.bottom, this.level.lowObstacles);
    const wantsSlide = input.slide && (grounded || Math.abs(body.velocity.x) > 100);

    if ((wantsSlide || mustStayLow) && !this.isSliding) {
      this.enterSlide(body);
    } else if (!wantsSlide && !mustStayLow && this.isSliding) {
      this.exitSlide(body);
    }

    // Horizontal motion
    const speedMultiplier = this.speedBoostLeft > 0 ? 1.38 : 1.0;

    if (this.isSliding) {
      // Allow subtle steering while sliding or slope boost
      if (moveDir !== 0 && Math.abs(this.slideMomentumVx) < 120) {
        this.facing = moveDir > 0 ? 1 : -1;
        this.sprite.setFlipX(this.facing === -1);
        this.slideMomentumVx = this.facing * SLIDE_MIN_SPEED;
      }
      this.slideMomentumVx = computeSlopeSlideVelocity({
        currentVx: this.slideMomentumVx,
        dt,
        slope: activeSlope,
        iceFriction: this.level.palette.iceFriction,
        facing: this.facing,
      });
      body.setVelocityX(this.slideMomentumVx * speedMultiplier);

      this.slideDustAccum += dt;
      if (grounded && this.slideDustAccum >= 0.045) {
        this.slideDustAccum = 0;
        this.dustEmitter.emitParticleAt(this.sprite.x - this.facing * 14, body.bottom - 2, 2);
      }
    } else {
      const canSprint = input.sprint && this.stamina > 4 && moveDir !== 0;
      if (canSprint) {
        this.stamina = Math.max(0, this.stamina - 34 * dt);
      } else {
        this.stamina = Math.min(100, this.stamina + 22 * dt);
      }

      const targetMaxSpeed = (canSprint ? MOVE_SPRINT_SPEED : MOVE_WALK_SPEED) * speedMultiplier;
      const accelFactor = grounded
        ? this.level.palette.iceFriction < 0.6
          ? 5.2
          : 15.0
        : 8.5;
      const targetVx = moveDir * targetMaxSpeed;
      const nextVx = Phaser.Math.Linear(body.velocity.x, targetVx, Math.min(1, accelFactor * dt));
      body.setVelocityX(nextVx);
    }

    // Jump & Double Jump execution (coyote + buffer + slide-jump momentum + mid-air double jump)
    const jumpAction = evaluateJumpAction({
      coyoteTimer: this.coyoteTimer,
      jumpBufferTimer: this.jumpBufferTimer,
      jumpJustPressed: input.jumpJustPressed,
      airJumpsRemaining: this.airJumpsRemaining,
      grounded,
    });

    if (jumpAction === 'ground') {
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      if (this.isSliding && canStandUp(this.sprite.x, body.bottom, this.level.lowObstacles)) {
        const sj = computeSlideJumpVelocity(body.velocity.x, this.facing);
        this.exitSlide(body);
        body.setVelocity(sj.vx, sj.vy);
      } else {
        body.setVelocityY(JUMP_VELOCITY);
      }
      this.sprite.setScale(0.85, 1.18);
      this.dustEmitter.emitParticleAt(this.sprite.x, body.bottom, 6);
      gameAudio.playJump();
    } else if (jumpAction === 'air') {
      const canExitSlide = !this.isSliding || canStandUp(this.sprite.x, body.bottom, this.level.lowObstacles);
      if (canExitSlide) {
        if (this.isSliding) {
          this.exitSlide(body);
        }
        this.airJumpsRemaining--;
        this.jumpBufferTimer = 0;
        body.setVelocityY(DOUBLE_JUMP_VELOCITY);
        this.sprite.setScale(0.78, 1.24);
        this.dustEmitter.emitParticleAt(this.sprite.x, body.bottom, 10);

        const frostRing = this.scene.add.ellipse(this.sprite.x, body.bottom, 34, 12, 0xbae6fd, 0.45);
        frostRing.setStrokeStyle(2, 0xf8fafc, 0.9);
        frostRing.setDepth(19);
        this.scene.tweens.add({
          targets: frostRing,
          scaleX: 1.9,
          scaleY: 1.5,
          alpha: 0,
          duration: 240,
          ease: 'Cubic.easeOut',
          onComplete: () => frostRing.destroy(),
        });

        gameAudio.playDoubleJump();
      }
    }

    // Variable jump height cut when releasing jump early
    if (!input.jumpHeld && body.velocity.y < -150) {
      body.setVelocityY(body.velocity.y * 0.55);
    }

    // Relax squash & stretch back to (1, 1)
    this.sprite.scaleX = Phaser.Math.Linear(this.sprite.scaleX, 1, Math.min(1, 14 * dt));
    this.sprite.scaleY = Phaser.Math.Linear(this.sprite.scaleY, 1, Math.min(1, 14 * dt));

    // Animation selection
    if (this.invulnLeft > 0.85) {
      this.sprite.play('player-hurt', true);
    } else if (this.isSliding) {
      this.sprite.play('player-slide', true);
    } else if (!grounded) {
      this.sprite.play('player-jump', true);
    } else if (Math.abs(body.velocity.x) > 30) {
      this.sprite.play('player-run', true);
      this.footstepAccum += Math.abs(body.velocity.x) * dt;
      if (this.footstepAccum >= 72) {
        this.footstepAccum = 0;
        gameAudio.playFootstep();
      }
    } else {
      this.sprite.play('player-idle', true);
    }
  }

  private enterSlide(body: Phaser.Physics.Arcade.Body): void {
    this.isSliding = true;
    const prevBottom = body.bottom;
    this.sprite.setTexture('player_slide');
    body.setSize(PLAYER_WIDTH + 8, PLAYER_SLIDE_HEIGHT);
    body.setOffset((48 - (PLAYER_WIDTH + 8)) * 0.5, 30 - PLAYER_SLIDE_HEIGHT);
    this.sprite.y = prevBottom - PLAYER_SLIDE_HEIGHT * 0.5;

    const currentVx = body.velocity.x;
    if (Math.abs(currentVx) < SLIDE_MIN_SPEED) {
      this.slideMomentumVx = this.facing * (SLIDE_MIN_SPEED + SLIDE_BOOST_IMPULSE * 0.35);
    } else {
      this.slideMomentumVx = currentVx + Math.sign(currentVx) * SLIDE_BOOST_IMPULSE * 0.5;
    }
    gameAudio.playSlide();
  }

  private exitSlide(body: Phaser.Physics.Arcade.Body): void {
    this.isSliding = false;
    const prevBottom = body.bottom;
    this.sprite.setTexture('player_idle');
    body.setSize(PLAYER_WIDTH, PLAYER_STAND_HEIGHT);
    body.setOffset((40 - PLAYER_WIDTH) * 0.5, 58 - PLAYER_STAND_HEIGHT);
    this.sprite.y = prevBottom - PLAYER_STAND_HEIGHT * 0.5;
  }

  public forceStandReset(x: number, y: number): void {
    const body = this.getBody();
    this.isHidden = false;
    this.isSliding = false;
    this.airJumpsRemaining = MAX_AIR_JUMPS;
    this.sprite.setTexture('player_idle');
    body.setSize(PLAYER_WIDTH, PLAYER_STAND_HEIGHT);
    body.setOffset((40 - PLAYER_WIDTH) * 0.5, 58 - PLAYER_STAND_HEIGHT);
    this.sprite.setPosition(x, y - 30);
    body.setVelocity(0, 0);
  }
}

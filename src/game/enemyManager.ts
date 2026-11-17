import Phaser from 'phaser';
import { gameAudio } from './audio';
import { stepSantaAI } from './santaAI';
import { EnemyKind, SantaState, type EnemySpawnDef, type LevelConfig } from './types';

interface ManagedEnemy {
  def: EnemySpawnDef;
  sprite: Phaser.Physics.Arcade.Sprite;
  facing: 1 | -1;
  stateTimer: number;
  attackPhase: 'patrol' | 'windup' | 'active' | 'recover';
  baseY: number;
  phaseOffset: number;
  telegraphRing: Phaser.GameObjects.Arc;
}

interface SnowballProjectile {
  sprite: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  life: number;
}

export class EnemyManager {
  public santa: Phaser.Physics.Arcade.Sprite;
  public santaState: SantaState = SantaState.PATROL;
  public santaStateTimer = 0;
  public santaFacing: 1 | -1 = -1;
  public lastKnownPlayerX: number | null = null;
  private santaEyeGlow: Phaser.GameObjects.Image;
  private santaAlertText: Phaser.GameObjects.Text;
  private ambushTriggeredIds = new Set<string>();

  public enemies: ManagedEnemy[] = [];
  private projectiles: SnowballProjectile[] = [];
  private attackTokens = 2;

  constructor(
    private scene: Phaser.Scene,
    private level: LevelConfig,
  ) {
    // Evil Santa setup
    this.santa = scene.physics.add.sprite(level.santaStartX, level.santaStartY - 40, 'santa_patrol_0');
    this.santa.setDepth(22);
    const sBody = this.santa.body as Phaser.Physics.Arcade.Body;
    sBody.setSize(38, 66);
    sBody.setOffset(13, 12);
    sBody.setCollideWorldBounds(true);

    this.santaEyeGlow = scene.add.image(this.santa.x, this.santa.y - 18, 'soft_glow_red');
    this.santaEyeGlow.setScale(0.7);
    this.santaEyeGlow.setAlpha(0.55);
    this.santaEyeGlow.setDepth(23);
    this.santaEyeGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.santaAlertText = scene.add.text(this.santa.x, this.santa.y - 52, '!', {
      fontFamily: 'Fraunces, serif',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#ff2e4c',
      stroke: '#090d16',
      strokeThickness: 4,
    });
    this.santaAlertText.setOrigin(0.5);
    this.santaAlertText.setDepth(25);
    this.santaAlertText.setVisible(false);

    // Spawn all level enemies
    for (let i = 0; i < level.enemies.length; i++) {
      const def = level.enemies[i];
      const texKey = this.getInitialTexture(def.kind);
      const yOffset = def.kind === EnemyKind.FLYING_TOY ? 0 : -28;
      const sprite = scene.physics.add.sprite(def.x, def.y + yOffset, texKey);
      sprite.setDepth(19);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      if (def.kind === EnemyKind.FLYING_TOY) {
        body.allowGravity = false;
        body.setSize(32, 28);
      } else if (def.kind === EnemyKind.REINDEER) {
        body.setSize(42, 40);
        body.setOffset(7, 12);
      } else {
        body.setSize(28, 44);
      }
      sprite.play(this.getAnimKey(def.kind));

      const ring = scene.add.circle(sprite.x, sprite.y, 26, 0xff2e4c, 0);
      ring.setStrokeStyle(2, 0xfbbf24, 0.85);
      ring.setDepth(18);
      ring.setVisible(false);

      this.enemies.push({
        def,
        sprite,
        facing: i % 2 === 0 ? 1 : -1,
        stateTimer: 1.0 + (i % 3) * 0.4,
        attackPhase: 'patrol',
        baseY: def.y + yOffset,
        phaseOffset: i * 1.3,
        telegraphRing: ring,
      });
    }
  }

  private getInitialTexture(kind: EnemyKind): string {
    switch (kind) {
      case EnemyKind.SNOWMAN:
        return 'snowman_0';
      case EnemyKind.TOY_SOLDIER:
        return 'soldier_0';
      case EnemyKind.REINDEER:
        return 'reindeer_0';
      case EnemyKind.FLYING_TOY:
        return 'flying_0';
      case EnemyKind.ELF:
        return 'elf_0';
    }
  }

  private getAnimKey(kind: EnemyKind): string {
    switch (kind) {
      case EnemyKind.SNOWMAN:
        return 'enemy-snowman';
      case EnemyKind.TOY_SOLDIER:
        return 'enemy-soldier';
      case EnemyKind.REINDEER:
        return 'enemy-reindeer';
      case EnemyKind.FLYING_TOY:
        return 'enemy-flying';
      case EnemyKind.ELF:
        return 'enemy-elf';
    }
  }

  public update(
    dt: number,
    playerX: number,
    playerY: number,
    playerIsHidden: boolean,
    playerIsInvisible: boolean,
    onProjectileHitPlayer: () => void,
  ): void {
    this.updateSanta(dt, playerX, playerY, playerIsHidden, playerIsInvisible);
    this.updateEnemies(dt, playerX, playerY, playerIsHidden || playerIsInvisible);
    this.updateProjectiles(dt, playerX, playerY, playerIsHidden, onProjectileHitPlayer);
  }

  private updateSanta(
    dt: number,
    playerX: number,
    playerY: number,
    playerIsHidden: boolean,
    playerIsInvisible: boolean,
  ): void {
    const sBody = this.santa.body as Phaser.Physics.Arcade.Body;

    // Check scripted ambush triggers
    for (const amb of this.level.ambushZones) {
      if (!this.ambushTriggeredIds.has(amb.id) && playerX >= amb.triggerX) {
        this.ambushTriggeredIds.add(amb.id);
        if (Math.abs(this.santa.x - playerX) > 420) {
          this.santa.setPosition(amb.spawnX, amb.spawnY - 40);
          sBody.setVelocity(0, 0);
          this.santaState = SantaState.SCRIPTED_AMBUSH;
        }
      }
    }

    const exitProgress = Math.max(0, Math.min(1, playerX / Math.max(1, this.level.exitX)));
    const decision = stepSantaAI({
      santaX: this.santa.x,
      santaY: this.santa.y,
      santaVx: sBody.velocity.x,
      santaFacing: this.santaFacing,
      state: this.santaState,
      stateTimer: this.santaStateTimer,
      patrolMinX: this.level.santaPatrolMinX,
      patrolMaxX: this.level.santaPatrolMaxX,
      baseSpeed: this.level.santaBaseSpeed,
      chaseSpeed: this.level.santaChaseSpeed,
      detectionRange: this.level.santaDetectionRange,
      playerX,
      playerY,
      playerIsHidden,
      playerIsInvisible,
      playerExitProgress: exitProgress,
      lastKnownPlayerX: this.lastKnownPlayerX,
      dt,
    });

    if (decision.triggeredLaugh) {
      gameAudio.playSantaLaugh();
    }

    this.santaState = decision.nextState;
    this.santaStateTimer = decision.nextStateTimer;
    this.santaFacing = decision.nextFacing;
    this.lastKnownPlayerX = decision.nextLastKnownPlayerX;

    sBody.setVelocityX(decision.targetVx);
    this.santa.setFlipX(this.santaFacing === -1);

    // Jump gently if Santa hits a wall/ledge while chasing
    if (
      (sBody.blocked.left || sBody.blocked.right) &&
      (sBody.blocked.down || sBody.touching.down)
    ) {
      sBody.setVelocityY(-440);
    }

    // Animations & eye glow
    if (this.santaState === SantaState.CHASE) {
      this.santa.play('santa-chase', true);
      this.santaEyeGlow.setScale(0.95);
      this.santaEyeGlow.setAlpha(0.85);
      this.santaAlertText.setVisible(true);
      this.santaAlertText.setText('!');
      gameAudio.setChaseMode(true);
    } else if (this.santaState === SantaState.ALERT_LAUGH) {
      this.santa.play('santa-laugh', true);
      this.santaEyeGlow.setScale(1.1);
      this.santaEyeGlow.setAlpha(0.95);
      this.santaAlertText.setVisible(true);
      this.santaAlertText.setText('HO HO!');
      gameAudio.setChaseMode(true);
    } else if (this.santaState === SantaState.SEARCH_HIDING) {
      this.santa.play('santa-search', true);
      this.santaEyeGlow.setScale(0.75);
      this.santaEyeGlow.setAlpha(0.55);
      this.santaAlertText.setVisible(true);
      this.santaAlertText.setText('?');
      gameAudio.setChaseMode(false);
    } else {
      this.santa.play('santa-patrol', true);
      this.santaEyeGlow.setScale(0.65);
      this.santaEyeGlow.setAlpha(0.45);
      this.santaAlertText.setVisible(false);
      gameAudio.setChaseMode(false);
    }

    this.santaEyeGlow.setPosition(this.santa.x + this.santaFacing * 5, this.santa.y - 20);
    this.santaAlertText.setPosition(this.santa.x, this.santa.y - 54);
  }

  private updateEnemies(
    dt: number,
    playerX: number,
    playerY: number,
    playerHiddenOrInvis: boolean,
  ): void {
    const time = this.scene.time.now * 0.001;

    for (const enemy of this.enemies) {
      const body = enemy.sprite.body as Phaser.Physics.Arcade.Body;
      const dx = playerX - enemy.sprite.x;
      const dy = playerY - enemy.sprite.y;
      const dist = Math.hypot(dx, dy);

      enemy.stateTimer -= dt;
      enemy.telegraphRing.setPosition(enemy.sprite.x, enemy.sprite.y);

      switch (enemy.def.kind) {
        case EnemyKind.SNOWMAN: {
          // Haunted Snowman: patrols and lobs icy snowballs with windup telegraph
          if (enemy.attackPhase === 'patrol') {
            if (enemy.sprite.x <= enemy.def.patrolMinX) enemy.facing = 1;
            if (enemy.sprite.x >= enemy.def.patrolMaxX) enemy.facing = -1;
            body.setVelocityX(enemy.facing * 58);
            enemy.telegraphRing.setVisible(false);

            if (!playerHiddenOrInvis && dist < 340 && Math.abs(dy) < 120 && enemy.stateTimer <= 0 && this.attackTokens > 0) {
              enemy.attackPhase = 'windup';
              enemy.stateTimer = 0.55;
              enemy.facing = dx >= 0 ? 1 : -1;
              this.attackTokens--;
              gameAudio.playEnemyTelegraph();
            }
          } else if (enemy.attackPhase === 'windup') {
            body.setVelocityX(0);
            enemy.telegraphRing.setVisible(true);
            enemy.telegraphRing.setScale(0.7 + Math.sin(time * 24) * 0.15);
            if (enemy.stateTimer <= 0) {
              this.spawnSnowball(enemy.sprite.x + enemy.facing * 18, enemy.sprite.y - 8, enemy.facing * 265, -135);
              enemy.attackPhase = 'recover';
              enemy.stateTimer = 1.6;
              enemy.telegraphRing.setVisible(false);
              this.attackTokens++;
            }
          } else {
            body.setVelocityX(0);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'patrol';
              enemy.stateTimer = 1.2;
            }
          }
          break;
        }

        case EnemyKind.TOY_SOLDIER: {
          // Evil Toy Soldier: crisp march + bayonet charge telegraph
          if (enemy.attackPhase === 'patrol') {
            if (enemy.sprite.x <= enemy.def.patrolMinX) enemy.facing = 1;
            if (enemy.sprite.x >= enemy.def.patrolMaxX) enemy.facing = -1;
            body.setVelocityX(enemy.facing * 90);
            enemy.telegraphRing.setVisible(false);
            if (!playerHiddenOrInvis && dist < 240 && Math.abs(dy) < 70 && enemy.stateTimer <= 0 && this.attackTokens > 0) {
              enemy.attackPhase = 'windup';
              enemy.stateTimer = 0.45;
              enemy.facing = dx >= 0 ? 1 : -1;
              this.attackTokens--;
              gameAudio.playEnemyTelegraph();
            }
          } else if (enemy.attackPhase === 'windup') {
            body.setVelocityX(0);
            enemy.telegraphRing.setVisible(true);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'active';
              enemy.stateTimer = 0.55;
              enemy.telegraphRing.setVisible(false);
            }
          } else if (enemy.attackPhase === 'active') {
            body.setVelocityX(enemy.facing * 240);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'recover';
              enemy.stateTimer = 0.8;
              this.attackTokens++;
            }
          } else {
            body.setVelocityX(0);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'patrol';
              enemy.stateTimer = 1.4;
            }
          }
          break;
        }

        case EnemyKind.REINDEER: {
          // Haunted Reindeer: line-of-sight high-speed antler rush
          if (enemy.attackPhase === 'patrol') {
            if (enemy.sprite.x <= enemy.def.patrolMinX) enemy.facing = 1;
            if (enemy.sprite.x >= enemy.def.patrolMaxX) enemy.facing = -1;
            body.setVelocityX(enemy.facing * 105);
            enemy.telegraphRing.setVisible(false);
            if (!playerHiddenOrInvis && dist < 320 && Math.abs(dy) < 75 && enemy.stateTimer <= 0 && this.attackTokens > 0) {
              enemy.attackPhase = 'windup';
              enemy.stateTimer = 0.55;
              enemy.facing = dx >= 0 ? 1 : -1;
              this.attackTokens--;
              gameAudio.playEnemyTelegraph();
            }
          } else if (enemy.attackPhase === 'windup') {
            body.setVelocityX(-enemy.facing * 25);
            enemy.telegraphRing.setVisible(true);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'active';
              enemy.stateTimer = 0.7;
              enemy.telegraphRing.setVisible(false);
            }
          } else if (enemy.attackPhase === 'active') {
            body.setVelocityX(enemy.facing * 315);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'recover';
              enemy.stateTimer = 1.0;
              this.attackTokens++;
            }
          } else {
            body.setVelocityX(0);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'patrol';
              enemy.stateTimer = 1.3;
            }
          }
          break;
        }

        case EnemyKind.FLYING_TOY: {
          // Flying Christmas Toy: sinusoidal sky patrol + swoop dive
          if (enemy.attackPhase === 'patrol') {
            if (enemy.sprite.x <= enemy.def.patrolMinX) enemy.facing = 1;
            if (enemy.sprite.x >= enemy.def.patrolMaxX) enemy.facing = -1;
            body.setVelocityX(enemy.facing * 115);
            const targetY = enemy.baseY + Math.sin(time * 3.2 + enemy.phaseOffset) * 26;
            body.setVelocityY((targetY - enemy.sprite.y) * 4);
            enemy.telegraphRing.setVisible(false);
            if (!playerHiddenOrInvis && Math.abs(dx) < 160 && dy > 25 && dy < 190 && enemy.stateTimer <= 0 && this.attackTokens > 0) {
              enemy.attackPhase = 'windup';
              enemy.stateTimer = 0.4;
              this.attackTokens--;
            }
          } else if (enemy.attackPhase === 'windup') {
            body.setVelocity(0, -35);
            enemy.telegraphRing.setVisible(true);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'active';
              enemy.stateTimer = 0.55;
              enemy.telegraphRing.setVisible(false);
              body.setVelocity(dx * 1.4, 240);
            }
          } else if (enemy.attackPhase === 'active') {
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'recover';
              enemy.stateTimer = 0.7;
              this.attackTokens++;
            }
          } else {
            body.setVelocity(0, (enemy.baseY - enemy.sprite.y) * 3.5);
            if (enemy.stateTimer <= 0) {
              enemy.attackPhase = 'patrol';
              enemy.stateTimer = 1.6;
            }
          }
          break;
        }

        case EnemyKind.ELF: {
          // Evil Christmas Elf: agile hopping ambusher
          if (enemy.sprite.x <= enemy.def.patrolMinX) enemy.facing = 1;
          if (enemy.sprite.x >= enemy.def.patrolMaxX) enemy.facing = -1;
          if (!playerHiddenOrInvis && dist < 240) {
            enemy.facing = dx >= 0 ? 1 : -1;
          }
          body.setVelocityX(enemy.facing * 135);
          if ((body.blocked.down || body.touching.down) && enemy.stateTimer <= 0) {
            body.setVelocityY(-340);
            enemy.stateTimer = 1.1 + Math.random() * 0.6;
          }
          break;
        }
      }

      enemy.sprite.setFlipX(enemy.facing === -1);
    }
  }

  private spawnSnowball(x: number, y: number, vx: number, vy: number): void {
    const sprite = this.scene.add.circle(x, y, 7, 0xbae6fd, 1);
    sprite.setStrokeStyle(2, 0x0284c7, 0.9);
    sprite.setDepth(20);
    this.projectiles.push({ sprite, vx, vy, life: 2.2 });
  }

  private updateProjectiles(
    dt: number,
    playerX: number,
    playerY: number,
    playerIsHidden: boolean,
    onHit: () => void,
  ): void {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      p.vy += 420 * dt;
      p.sprite.x += p.vx * dt;
      p.sprite.y += p.vy * dt;

      if (!playerIsHidden && Math.hypot(p.sprite.x - playerX, p.sprite.y - playerY) < 24) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
        onHit();
        continue;
      }

      if (p.life <= 0) {
        p.sprite.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }

  public destroyAll(): void {
    this.santaEyeGlow.destroy();
    this.santaAlertText.destroy();
    for (const e of this.enemies) {
      e.telegraphRing.destroy();
    }
    for (const p of this.projectiles) {
      p.sprite.destroy();
    }
    this.projectiles = [];
  }
}

import Phaser from 'phaser';
import { registerGameTexturesAndAnimations } from './animations';
import { gameAudio } from './audio';
import { EnemyManager } from './enemyManager';
import { getLevelById } from './levels';
import { PlayerController } from './playerController';
import {
  CollectibleKind,
  PowerUpKind,
  SantaState,
  type HudSnapshot,
  type InputState,
  type LevelConfig,
  type RunStats,
} from './types';

export interface SceneBridge {
  levelId: number;
  bestScoreForLevel: number;
  touchInputRef: { current: Partial<InputState> };
  onHudUpdate: (hud: HudSnapshot) => void;
  onLevelComplete: (stats: RunStats) => void;
  onGameOver: (stats: RunStats) => void;
}

interface CollectibleSpriteItem {
  id: string;
  kind: CollectibleKind | PowerUpKind;
  sprite: Phaser.GameObjects.Sprite;
  collected: boolean;
  baseY: number;
}

interface PuzzleGateRuntime {
  id: string;
  gateRect: Phaser.GameObjects.Rectangle;
  gateBody: Phaser.Physics.Arcade.StaticBody;
  leverSprite: Phaser.GameObjects.Graphics;
  leverX: number;
  leverY: number;
  opened: boolean;
}

export class GameScene extends Phaser.Scene {
  private bridge!: SceneBridge;
  private level!: LevelConfig;
  private playerCtrl!: PlayerController;
  private enemyMgr!: EnemyManager;

  private terrainGroup!: Phaser.Physics.Arcade.StaticGroup;
  private lowObsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private enemySlopeGroup!: Phaser.Physics.Arcade.StaticGroup;
  private collectibles: CollectibleSpriteItem[] = [];
  private puzzleGates: PuzzleGateRuntime[] = [];
  private lightBulbs: { bulb: Phaser.GameObjects.Arc; phase: number }[] = [];

  private checkpointLit = false;
  private checkpointFlag!: Phaser.GameObjects.Arc;
  private exitGlow!: Phaser.GameObjects.Arc;

  private lives = 3;
  private readonly maxLives = 3;
  private score = 0;
  private bells = 0;
  private keysCollected = 0;
  private presentsCollected = 0;
  private presentsTotal = 0;
  private damageTaken = 0;
  private elapsedSeconds = 0;

  private isPaused = false;
  private isEnding = false;
  private hitstopTimer = 0;
  private trauma = 0;
  private hudSyncTimer = 0;

  private keysDown = new Set<string>();
  private jumpEdgePending = false;
  private interactEdgePending = false;
  private keydownHandler?: (e: KeyboardEvent) => void;
  private keyupHandler?: (e: KeyboardEvent) => void;
  private blurHandler?: () => void;

  private vignetteOverlay!: Phaser.GameObjects.Rectangle;
  private chaseOverlay!: Phaser.GameObjects.Rectangle;
  private snowEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor() {
    super({ key: 'GameScene' });
  }

  public init(data: { bridge: SceneBridge }): void {
    this.bridge = data.bridge;
    this.level = getLevelById(this.bridge.levelId);
    this.lives = 3;
    this.score = 0;
    this.bells = 0;
    this.keysCollected = 0;
    this.presentsCollected = 0;
    this.damageTaken = 0;
    this.elapsedSeconds = 0;
    this.isPaused = false;
    this.isEnding = false;
    this.hitstopTimer = 0;
    this.trauma = 0;
    this.checkpointLit = false;
    this.collectibles = [];
    this.puzzleGates = [];
    this.lightBulbs = [];
    this.keysDown.clear();
    this.jumpEdgePending = false;
    this.interactEdgePending = false;
  }

  public create(): void {
    registerGameTexturesAndAnimations(this);

    const { worldWidth, worldHeight, palette } = this.level;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight + 120);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

    this.drawBackgroundAndAtmosphere();
    this.buildGeometryAndObstacles();
    this.buildPropsAndCollectibles();

    this.playerCtrl = new PlayerController(this, this.level);
    this.enemyMgr = new EnemyManager(this, this.level);

    // Colliders
    this.physics.add.collider(this.playerCtrl.sprite, this.terrainGroup);
    this.physics.add.collider(this.playerCtrl.sprite, this.lowObsGroup);
    this.physics.add.collider(this.enemyMgr.santa, this.terrainGroup);
    this.physics.add.collider(this.enemyMgr.santa, this.enemySlopeGroup);
    for (const e of this.enemyMgr.enemies) {
      if (e.def.kind !== 'FLYING_TOY') {
        this.physics.add.collider(e.sprite, this.terrainGroup);
        this.physics.add.collider(e.sprite, this.enemySlopeGroup);
      }
    }
    for (const pg of this.puzzleGates) {
      this.physics.add.collider(this.playerCtrl.sprite, pg.gateRect);
      this.physics.add.collider(this.enemyMgr.santa, pg.gateRect);
    }

    // Camera follow & responsive zoom
    this.cameras.main.startFollow(this.playerCtrl.sprite, true, 0.1, 0.1, -60, 20);
    const applyResponsiveZoom = (w: number, h: number) => {
      const zoom = Math.max(0.68, Math.min(1.25, Math.min(w / 1220, h / 680)));
      this.cameras.main.setZoom(zoom);
    };
    applyResponsiveZoom(this.scale.width, this.scale.height);
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      applyResponsiveZoom(gameSize.width, gameSize.height);
    });

    // Snowstorm particles anchored to camera
    this.snowEmitter = this.add.particles(0, 0, 'snowflake', {
      x: { min: -200, max: 1800 },
      y: -20,
      lifespan: 4200,
      speedY: { min: 70, max: 145 + palette.stormIntensity * 90 },
      speedX: { min: -75 - palette.stormIntensity * 65, max: -20 },
      scale: { min: 0.35, max: 0.95 },
      alpha: { start: 0.75, end: 0.1 },
      quantity: Math.max(1, Math.round(palette.stormIntensity * 4)),
      frequency: 55,
    });
    this.snowEmitter.setScrollFactor(0);
    this.snowEmitter.setDepth(45);

    // Peripheral darkness & chase red vignette (screen-space)
    this.vignetteOverlay = this.add
      .rectangle(-400, -400, 3200, 2400, 0x040711, palette.darknessAlpha)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(42);

    this.chaseOverlay = this.add
      .rectangle(-400, -400, 3200, 2400, 0x991b1b, 0)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(43);

    this.bindInputListeners();
    gameAudio.startSceneAudio(palette.stormIntensity);
    this.pushHudSnapshot();
  }

  private drawBackgroundAndAtmosphere(): void {
    const { worldWidth, palette } = this.level;

    // Sky gradient (oversized for zoomed/resized viewports)
    const sky = this.add.graphics();
    sky.fillGradientStyle(
      Phaser.Display.Color.HexStringToColor(palette.skyTop).color,
      Phaser.Display.Color.HexStringToColor(palette.skyTop).color,
      Phaser.Display.Color.HexStringToColor(palette.skyBottom).color,
      Phaser.Display.Color.HexStringToColor(palette.skyBottom).color,
      1,
    );
    sky.fillRect(-400, -400, 3200, 2000);
    sky.setScrollFactor(0);
    sky.setDepth(0);

    // Crisp crescent moon with halo
    this.add.image(1060, 130, 'crescent_moon').setScrollFactor(0.04).setDepth(1);

    // Distant pine mountains parallax
    const hills = this.add.graphics().setScrollFactor(0.2).setDepth(2);
    hills.fillStyle(Phaser.Display.Color.HexStringToColor(palette.horizonTint).color, 0.85);
    for (let x = -160; x < worldWidth * 0.45 + 1400; x += 200) {
      hills.fillTriangle(x, 720, x + 100, 350 + ((x * 13) % 90), x + 200, 720);
    }

    // Midground dark Christmas trees & warm glowing cottages
    const trees = this.add.graphics().setScrollFactor(0.42).setDepth(3);
    for (let x = 30; x < worldWidth * 0.65 + 1100; x += 145) {
      const h = 160 + ((x * 7) % 110);
      trees.fillStyle(0x0b1524, 0.92);
      trees.fillTriangle(x, 680, x + 44, 680 - h, x + 88, 680);
      trees.fillStyle(0xcbd5e1, 0.25);
      trees.fillTriangle(x + 19, 680 - h + 48, x + 44, 680 - h, x + 69, 680 - h + 48);
    }

    for (let cx = 220; cx < worldWidth * 0.65 + 900; cx += 460) {
      this.add.image(cx, 570, 'bg_cottage').setScrollFactor(0.45).setDepth(4).setAlpha(0.88);
    }
  }

  private buildGeometryAndObstacles(): void {
    const { palette } = this.level;
    const groundColor = Phaser.Display.Color.HexStringToColor(palette.groundFill).color;
    const snowColor = Phaser.Display.Color.HexStringToColor(palette.groundSnow).color;

    this.terrainGroup = this.physics.add.staticGroup();
    this.lowObsGroup = this.physics.add.staticGroup();
    this.enemySlopeGroup = this.physics.add.staticGroup();

    // Platforms
    for (const p of this.level.platforms) {
      const g = this.add.graphics().setDepth(10);
      const drawH = p.kind === 'ground' || p.kind === 'ice' ? p.h + 450 : p.h;
      g.fillStyle(groundColor, 1);
      g.fillRect(p.x, p.y, p.w, drawH);
      g.fillStyle(snowColor, 1);
      g.fillRoundedRect(p.x - 1, p.y, p.w + 2, 11, 4);

      if (p.kind === 'ice') {
        g.fillStyle(0x7dd3fc, 0.35);
        g.fillRect(p.x + 6, p.y + 4, p.w - 12, 4);
      }

      const zone = this.add.rectangle(p.x + p.w * 0.5, p.y + p.h * 0.5, p.w, p.h);
      this.physics.add.existing(zone, true);
      this.terrainGroup.add(zone);
    }

    // Snowy downhill slopes
    for (const s of this.level.slopes) {
      const sg = this.add.graphics().setDepth(11);
      sg.fillStyle(groundColor, 1);
      sg.beginPath();
      if (s.direction === 'down_right') {
        sg.moveTo(s.x, s.y);
        sg.lineTo(s.x + s.w, s.y + s.h);
        sg.lineTo(s.x + s.w, s.y + s.h + 680);
        sg.lineTo(s.x, s.y + 680);
      } else {
        sg.moveTo(s.x, s.y + s.h);
        sg.lineTo(s.x + s.w, s.y);
        sg.lineTo(s.x + s.w, s.y + 680);
        sg.lineTo(s.x, s.y + s.h + 680);
      }
      sg.closePath();
      sg.fillPath();

      // Thick snow slide surface stripe
      sg.lineStyle(10, snowColor, 1);
      sg.beginPath();
      if (s.direction === 'down_right') {
        sg.moveTo(s.x, s.y + 3);
        sg.lineTo(s.x + s.w, s.y + s.h + 3);
      } else {
        sg.moveTo(s.x, s.y + s.h + 3);
        sg.lineTo(s.x + s.w, s.y + 3);
      }
      sg.strokePath();

      // Subtle slide arrow sign on slope
      const arrowX = s.x + s.w * 0.45;
      const arrowY = s.y + s.h * 0.45 - 24;
      this.add
        .text(arrowX, arrowY, 'SLIDE', {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#7dd3fc',
        })
        .setOrigin(0.5)
        .setAlpha(0.75)
        .setDepth(12);

      // Stepped static colliders for Evil Santa and enemies along slope
      const steps = 8;
      const stepW = s.w / steps;
      for (let st = 0; st < steps; st++) {
        const t = (st + 0.5) / steps;
        const stepY = s.direction === 'down_right' ? s.y + t * s.h : s.y + (1 - t) * s.h;
        const stepRect = this.add.rectangle(s.x + (st + 0.5) * stepW, stepY + 20, stepW + 4, 40);
        this.physics.add.existing(stepRect, true);
        this.enemySlopeGroup.add(stepRect);
      }
    }

    // Low-clearance obstacles (must slide under!) + animated Christmas lights
    const bulbPalette = [0xff2e4c, 0x22c55e, 0xfacc15, 0x38bdf8];
    for (let idx = 0; idx < this.level.lowObstacles.length; idx++) {
      const obs = this.level.lowObstacles[idx];
      const og = this.add.graphics().setDepth(14);
      og.fillStyle(0x1e293b, 1);
      og.lineStyle(2, 0x090d16, 1);
      og.fillRoundedRect(obs.x, obs.y, obs.w, obs.h, 4);
      og.strokeRoundedRect(obs.x, obs.y, obs.w, obs.h, 4);

      // Icicles hanging off bottom edge (above the 34px slide gap)
      og.fillStyle(0xbae6fd, 0.9);
      for (let ix = obs.x + 8; ix < obs.x + obs.w - 8; ix += 14) {
        og.fillTriangle(ix, obs.y + obs.h, ix + 5, obs.y + obs.h + 7, ix + 10, obs.y + obs.h);
      }

      // Animated Christmas string bulbs across top of obstacle
      for (let bx = obs.x + 12, bi = 0; bx < obs.x + obs.w - 8; bx += 20, bi++) {
        const color = bulbPalette[(bi + idx) % bulbPalette.length];
        const bulb = this.add.circle(bx, obs.y + 8, 4, color, 0.95).setDepth(15);
        this.lightBulbs.push({ bulb, phase: bi * 0.8 + idx });
      }

      const colliderRect = this.add.rectangle(
        obs.x + obs.w * 0.5,
        obs.y + obs.h * 0.5,
        obs.w,
        obs.h,
      );
      this.physics.add.existing(colliderRect, true);
      this.lowObsGroup.add(colliderRect);
    }
  }

  private buildPropsAndCollectibles(): void {
    // Hiding spots
    for (const hs of this.level.hidingSpots) {
      const texKey =
        hs.kind === 'snowdrift'
          ? 'hide_snowdrift'
          : hs.kind === 'gift_crate'
            ? 'hide_gift_crate'
            : hs.kind === 'locker'
              ? 'hide_locker'
              : 'hide_wardrobe';
      const sprite = this.add.sprite(hs.x, hs.y, texKey).setOrigin(0.5, 1).setDepth(12);
      void sprite;
    }

    // Puzzle gates & levers
    for (const pg of this.level.puzzleGates) {
      const gateRect = this.add
        .rectangle(pg.gateX, pg.gateY - pg.gateH * 0.5, 22, pg.gateH, 0x7f1d1d, 0.95)
        .setDepth(16);
      gateRect.setStrokeStyle(2, 0xfbbf24, 0.8);
      this.physics.add.existing(gateRect, true);
      const gateBody = gateRect.body as Phaser.Physics.Arcade.StaticBody;

      const leverSprite = this.add.graphics().setDepth(15);
      this.drawLeverGraphic(leverSprite, pg.leverX, pg.leverY, false);

      this.puzzleGates.push({
        id: pg.id,
        gateRect,
        gateBody,
        leverSprite,
        leverX: pg.leverX,
        leverY: pg.leverY,
        opened: false,
      });
    }

    // Checkpoint lamppost
    const cpX = this.level.checkpointX;
    const cpY = this.level.checkpointY;
    const post = this.add.graphics().setDepth(12);
    post.fillStyle(0x1e293b, 1);
    post.fillRect(cpX - 3, cpY - 78, 6, 78);
    post.fillStyle(0xfbbf24, 0.35);
    post.fillCircle(cpX, cpY - 82, 10);
    this.checkpointFlag = this.add.circle(cpX, cpY - 82, 16, 0xfacc15, 0.15).setDepth(13);

    // Exit Rescue Sleigh / Portal Door
    const ex = this.level.exitX;
    const ey = this.level.exitY;
    const door = this.add.graphics().setDepth(13);
    door.fillStyle(0x14532d, 1);
    door.lineStyle(3, 0xfbbf24, 1);
    door.fillRoundedRect(ex - 32, ey - 94, 64, 94, { tl: 32, tr: 32, bl: 0, br: 0 });
    door.strokeRoundedRect(ex - 32, ey - 94, 64, 94, { tl: 32, tr: 32, bl: 0, br: 0 });
    this.exitGlow = this.add.circle(ex, ey - 48, 54, 0x22c55e, 0.18).setDepth(12);
    this.add
      .text(ex, ey - 108, 'EXIT', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#86efac',
      })
      .setOrigin(0.5)
      .setDepth(14);

    // Collectibles & Power-ups
    this.presentsTotal = 0;
    for (const c of this.level.collectibles) {
      if (c.kind === CollectibleKind.SECRET_PRESENT) this.presentsTotal++;
      const texKey = this.getCollectibleTexture(c.kind);
      const sprite = this.add.sprite(c.x, c.y, texKey).setDepth(17);
      this.collectibles.push({
        id: c.id,
        kind: c.kind,
        sprite,
        collected: false,
        baseY: c.y,
      });
    }
  }

  private drawLeverGraphic(g: Phaser.GameObjects.Graphics, x: number, y: number, pulled: boolean): void {
    g.clear();
    g.fillStyle(0x334155, 1);
    g.fillRect(x - 10, y - 10, 20, 10);
    g.lineStyle(4, pulled ? 0x22c55e : 0xef4444, 1);
    g.beginPath();
    g.moveTo(x, y - 10);
    g.lineTo(pulled ? x + 14 : x - 14, y - 34);
    g.strokePath();
    g.fillStyle(pulled ? 0x4ade80 : 0xfca5a5, 1);
    g.fillCircle(pulled ? x + 14 : x - 14, y - 34, 5);
  }

  private getCollectibleTexture(kind: CollectibleKind | PowerUpKind): string {
    switch (kind) {
      case CollectibleKind.KEY:
        return 'item_key';
      case CollectibleKind.GOLDEN_BELL:
        return 'item_bell';
      case CollectibleKind.SECRET_PRESENT:
        return 'item_present';
      case PowerUpKind.SPEED_BOOST:
        return 'item_speed';
      case PowerUpKind.PROTECTION:
        return 'item_shield';
      case PowerUpKind.INVISIBLE:
        return 'item_invisible';
      case PowerUpKind.EXTRA_LIFE:
        return 'item_life';
    }
  }

  private bindInputListeners(): void {
    this.keydownHandler = (e: KeyboardEvent) => {
      gameAudio.unlock();
      const code = e.code;
      if (!this.keysDown.has(code)) {
        if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
          this.jumpEdgePending = true;
        }
        if (code === 'KeyE') {
          this.interactEdgePending = true;
        }
      }
      this.keysDown.add(code);
    };

    this.keyupHandler = (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
    };

    this.blurHandler = () => {
      this.keysDown.clear();
    };

    window.addEventListener('keydown', this.keydownHandler);
    window.addEventListener('keyup', this.keyupHandler);
    window.addEventListener('blur', this.blurHandler);
  }

  public setScenePaused(paused: boolean): void {
    this.isPaused = paused;
    if (paused) {
      this.physics.world.pause();
      gameAudio.setPaused(true);
    } else {
      this.physics.world.resume();
      gameAudio.setPaused(false);
    }
  }

  public override update(_time: number, rawDelta: number): void {
    if (this.isPaused || this.isEnding) return;

    const dt = Math.min(rawDelta * 0.001, 0.05);

    // Hitstop freeze
    if (this.hitstopTimer > 0) {
      this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
      this.applyCameraShake(dt);
      return;
    }

    this.elapsedSeconds += dt;
    this.applyCameraShake(dt);

    // Animate string bulbs & exit glow
    const nowSec = this.time.now * 0.001;
    for (const lb of this.lightBulbs) {
      lb.bulb.setAlpha(0.55 + Math.sin(nowSec * 5 + lb.phase) * 0.45);
    }
    this.exitGlow.setAlpha(this.keysCollected >= this.level.keysRequired ? 0.28 + Math.sin(nowSec * 4) * 0.1 : 0.08);

    // Build combined keyboard + mobile touch InputState
    const touch = this.bridge.touchInputRef.current;
    const left =
      this.keysDown.has('ArrowLeft') || this.keysDown.has('KeyA') || Boolean(touch.left);
    const right =
      this.keysDown.has('ArrowRight') || this.keysDown.has('KeyD') || Boolean(touch.right);
    const jumpHeld =
      this.keysDown.has('Space') ||
      this.keysDown.has('ArrowUp') ||
      this.keysDown.has('KeyW') ||
      Boolean(touch.jumpHeld);
    const slide =
      this.keysDown.has('ArrowDown') || this.keysDown.has('KeyS') || Boolean(touch.slide);
    const sprint =
      this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight') || Boolean(touch.sprint);

    const jumpJustPressed = this.jumpEdgePending || Boolean(touch.jumpJustPressed);
    const interactJustPressed = this.interactEdgePending || Boolean(touch.interactJustPressed);
    this.jumpEdgePending = false;
    this.interactEdgePending = false;
    touch.jumpJustPressed = false;
    touch.interactJustPressed = false;

    const input: InputState = {
      left,
      right,
      jumpHeld,
      jumpJustPressed,
      slide,
      sprint,
      interactJustPressed,
    };

    // Update Player
    this.playerCtrl.update(dt, input);

    const px = this.playerCtrl.sprite.x;
    const py = this.playerCtrl.sprite.y;

    // Handle Interact [E] (Hiding spot or Puzzle Lever)
    const interactPrompt = this.handleInteractions(px, py, interactJustPressed);

    // Check Checkpoint
    if (!this.checkpointLit && Math.abs(px - this.level.checkpointX) < 55) {
      this.checkpointLit = true;
      this.checkpointFlag.setFillStyle(0x22c55e, 0.35);
      this.score += 150;
      gameAudio.playCheckpoint();
    }

    // Check Fall into Abyss
    if (py > this.level.worldHeight + 45) {
      this.damagePlayer(true);
    }

    // Collectibles float & pickup
    this.updateCollectibles(nowSec, px, py);

    // Update Evil Santa & Enemies
    this.enemyMgr.update(
      dt,
      px,
      py,
      this.playerCtrl.isHidden,
      this.playerCtrl.invisibleLeft > 0,
      () => this.damagePlayer(false),
    );

    // Check Enemy & Santa collision
    this.checkHazardOverlaps(px, py);

    // Chase vignette intensity
    const targetChaseAlpha = this.enemyMgr.santaState === SantaState.CHASE ? 0.22 + Math.sin(nowSec * 9) * 0.08 : 0;
    this.chaseOverlay.setFillStyle(0x991b1b, targetChaseAlpha);

    // Check Exit Door Victory!
    if (
      this.keysCollected >= this.level.keysRequired &&
      Math.abs(px - this.level.exitX) < 42 &&
      Math.abs(py - (this.level.exitY - 40)) < 68
    ) {
      this.triggerLevelVictory();
      return;
    }

    // Throttled HUD sync
    this.hudSyncTimer += dt;
    if (this.hudSyncTimer >= 0.08) {
      this.hudSyncTimer = 0;
      this.pushHudSnapshot(interactPrompt);
    }
  }

  private handleInteractions(px: number, py: number, interactPressed: boolean): string | null {
    // 1. Toggle hiding if already hidden
    if (this.playerCtrl.isHidden) {
      if (interactPressed) {
        this.playerCtrl.isHidden = false;
        gameAudio.playHide();
        this.pushHudSnapshot('Press [E] to Hide');
      }
      return 'Hidden — Press [E] to Emerge';
    }

    // 2. Check nearby Hiding Spot
    for (const hs of this.level.hidingSpots) {
      if (Math.abs(px - hs.x) < 48 && Math.abs(py - (hs.y - 26)) < 58) {
        if (interactPressed) {
          this.playerCtrl.isHidden = true;
          this.playerCtrl.sprite.x = hs.x;
          gameAudio.playHide();
          this.pushHudSnapshot('Hidden — Press [E] to Emerge');
          return 'Hidden — Press [E] to Emerge';
        }
        return 'Press [E] to Hide';
      }
    }

    // 3. Check nearby Puzzle Lever
    for (const pg of this.puzzleGates) {
      if (!pg.opened && Math.abs(px - pg.leverX) < 52 && Math.abs(py - (pg.leverY - 24)) < 58) {
        if (interactPressed) {
          pg.opened = true;
          this.drawLeverGraphic(pg.leverSprite, pg.leverX, pg.leverY, true);
          pg.gateBody.enable = false;
          this.tweens.add({
            targets: pg.gateRect,
            y: pg.gateRect.y - 125,
            alpha: 0.15,
            duration: 420,
            ease: 'Cubic.easeOut',
          });
          this.score += 200;
          gameAudio.playDoorOpen();
          this.pushHudSnapshot(null);
          return null;
        }
        return 'Press [E] to Open Gate';
      }
    }

    // 4. Exit prompt if keys still needed
    if (Math.abs(px - this.level.exitX) < 70 && this.keysCollected < this.level.keysRequired) {
      const missing = this.level.keysRequired - this.keysCollected;
      return `Need ${missing} more Key${missing > 1 ? 's' : ''} to Escape`;
    }

    return null;
  }

  private updateCollectibles(nowSec: number, px: number, py: number): void {
    for (const item of this.collectibles) {
      if (item.collected) continue;
      item.sprite.y = item.baseY + Math.sin(nowSec * 3.5 + item.sprite.x * 0.02) * 5;

      if (Math.hypot(px - item.sprite.x, py - item.sprite.y) < 32) {
        item.collected = true;
        item.sprite.destroy();

        switch (item.kind) {
          case CollectibleKind.KEY:
            this.keysCollected++;
            this.score += 300;
            gameAudio.playPickup('key');
            break;
          case CollectibleKind.GOLDEN_BELL:
            this.bells++;
            this.score += 100;
            gameAudio.playPickup('bell');
            break;
          case CollectibleKind.SECRET_PRESENT:
            this.presentsCollected++;
            this.score += 500;
            gameAudio.playPickup('present');
            break;
          case PowerUpKind.SPEED_BOOST:
            this.playerCtrl.speedBoostLeft = 6.5;
            this.score += 150;
            gameAudio.playPickup('power');
            break;
          case PowerUpKind.PROTECTION:
            this.playerCtrl.shieldLeft = 8.0;
            this.score += 150;
            gameAudio.playPickup('power');
            break;
          case PowerUpKind.INVISIBLE:
            this.playerCtrl.invisibleLeft = 6.5;
            this.score += 150;
            gameAudio.playPickup('power');
            break;
          case PowerUpKind.EXTRA_LIFE:
            this.lives = Math.min(this.maxLives, this.lives + 1);
            this.score += 200;
            gameAudio.playPickup('power');
            break;
        }
        this.pushHudSnapshot();
      }
    }
  }

  private checkHazardOverlaps(px: number, py: number): void {
    if (this.playerCtrl.isHidden) return;

    // Evil Santa catch check
    const sDist = Math.hypot(px - this.enemyMgr.santa.x, py - this.enemyMgr.santa.y);
    if (sDist < 42 && this.playerCtrl.invisibleLeft <= 0) {
      if (this.playerCtrl.shieldLeft > 0) {
        // Shield absorbs one hit and knocks player forward
        this.playerCtrl.shieldLeft = 0;
        this.playerCtrl.invulnLeft = 1.6;
        this.hitstopTimer = 0.05;
        this.trauma = 0.65;
        this.playerCtrl.getBody().setVelocity(this.playerCtrl.facing * 260, -280);
        gameAudio.playHurt();
        return;
      }
      this.triggerSantaCatchGameOver();
      return;
    }

    // Supporting enemies overlap
    if (this.playerCtrl.invulnLeft > 0) return;
    for (const enemy of this.enemyMgr.enemies) {
      const dist = Math.hypot(px - enemy.sprite.x, py - enemy.sprite.y);
      if (dist < 32) {
        this.damagePlayer(false);
        break;
      }
    }
  }

  private damagePlayer(fellInPit: boolean): void {
    if (this.isEnding) return;

    if (!fellInPit && this.playerCtrl.shieldLeft > 0) {
      this.playerCtrl.shieldLeft = 0;
      this.playerCtrl.invulnLeft = 1.4;
      this.hitstopTimer = 0.04;
      this.trauma = 0.45;
      gameAudio.playHurt();
      return;
    }

    this.lives--;
    this.damageTaken++;
    this.hitstopTimer = 0.06;
    this.trauma = 0.75;
    gameAudio.playHurt();

    if (this.lives <= 0) {
      this.triggerSantaCatchGameOver();
      return;
    }

    this.playerCtrl.invulnLeft = 1.75;
    if (fellInPit) {
      const respawnX = this.checkpointLit ? this.level.checkpointX : this.level.spawnX;
      const respawnY = this.checkpointLit ? this.level.checkpointY : this.level.spawnY;
      this.playerCtrl.forceStandReset(respawnX, respawnY);
    } else {
      this.playerCtrl.getBody().setVelocity(-this.playerCtrl.facing * 190, -290);
    }
    this.pushHudSnapshot();
  }

  private applyCameraShake(dt: number): void {
    if (this.trauma > 0) {
      this.trauma = Math.max(0, this.trauma - dt * 1.9);
      const shake = this.trauma * this.trauma * 14;
      this.cameras.main.setFollowOffset(
        -60 + (Math.random() * 2 - 1) * shake,
        30 + (Math.random() * 2 - 1) * shake,
      );
    } else {
      this.cameras.main.setFollowOffset(-60, 30);
    }
  }

  private triggerSantaCatchGameOver(): void {
    if (this.isEnding) return;
    this.isEnding = true;
    this.physics.world.pause();
    gameAudio.stopSceneAudio();
    gameAudio.playSantaLaugh();
    gameAudio.playGameOver();

    // Scary non-graphic Game Over animation: crimson flash + zoom + towering Santa eyes
    this.chaseOverlay.setFillStyle(0xb91c1c, 0.52);
    this.cameras.main.shake(450, 0.018);

    const cx = this.cameras.main.scrollX + this.cameras.main.width * 0.5;
    const cy = this.cameras.main.scrollY + this.cameras.main.height * 0.5;
    const scareSanta = this.add.sprite(cx, cy + 40, 'santa_laugh_0').setScale(1.8).setDepth(60).setAlpha(0);
    this.tweens.add({
      targets: scareSanta,
      scale: 4.4,
      alpha: 0.96,
      duration: 480,
      ease: 'Cubic.easeOut',
    });

    this.time.delayedCall(680, () => {
      this.bridge.onGameOver({
        outcome: 'defeat',
        levelId: this.level.id,
        levelName: this.level.name,
        score: this.score,
        bestScore: Math.max(this.score, this.bridge.bestScoreForLevel),
        bells: this.bells,
        keysCollected: this.keysCollected,
        keysRequired: this.level.keysRequired,
        presentsCollected: this.presentsCollected,
        presentsTotal: this.presentsTotal,
        elapsedSeconds: Math.round(this.elapsedSeconds),
        damageTaken: this.damageTaken,
      });
    });
  }

  private triggerLevelVictory(): void {
    if (this.isEnding) return;
    this.isEnding = true;
    this.physics.world.pause();
    gameAudio.stopSceneAudio();
    gameAudio.playVictory();

    const timeBonus = Math.max(0, Math.round(600 - this.elapsedSeconds * 5));
    const finalScore = this.score + timeBonus + this.lives * 250;

    this.time.delayedCall(320, () => {
      this.bridge.onLevelComplete({
        outcome: this.level.id === 30 ? 'final_victory' : 'victory',
        levelId: this.level.id,
        levelName: this.level.name,
        score: finalScore,
        bestScore: Math.max(finalScore, this.bridge.bestScoreForLevel),
        bells: this.bells,
        keysCollected: this.keysCollected,
        keysRequired: this.level.keysRequired,
        presentsCollected: this.presentsCollected,
        presentsTotal: this.presentsTotal,
        elapsedSeconds: Math.round(this.elapsedSeconds),
        damageTaken: this.damageTaken,
      });
    });
  }

  private pushHudSnapshot(interactPrompt: string | null = null): void {
    const px = this.playerCtrl.sprite.x;
    const py = this.playerCtrl.sprite.y;
    const santaDistance = Math.round(Math.hypot(px - this.enemyMgr.santa.x, py - this.enemyMgr.santa.y));
    this.bridge.onHudUpdate({
      levelId: this.level.id,
      levelName: this.level.name,
      lives: this.lives,
      maxLives: this.maxLives,
      score: this.score,
      bells: this.bells,
      keysCollected: this.keysCollected,
      keysRequired: this.level.keysRequired,
      presentsCollected: this.presentsCollected,
      presentsTotal: this.presentsTotal,
      stamina: Math.round(this.playerCtrl.stamina),
      isSliding: this.playerCtrl.isSliding,
      isHidden: this.playerCtrl.isHidden,
      santaState: this.enemyMgr.santaState,
      santaDistance,
      speedBoostLeft: Number(this.playerCtrl.speedBoostLeft.toFixed(1)),
      shieldLeft: Number(this.playerCtrl.shieldLeft.toFixed(1)),
      invisibleLeft: Number(this.playerCtrl.invisibleLeft.toFixed(1)),
      interactPrompt,
      checkpointReached: this.checkpointLit,
      elapsedSeconds: Math.round(this.elapsedSeconds),
    });
  }

  public shutdown(): void {
    gameAudio.stopSceneAudio();
    if (this.keydownHandler) window.removeEventListener('keydown', this.keydownHandler);
    if (this.keyupHandler) window.removeEventListener('keyup', this.keyupHandler);
    if (this.blurHandler) window.removeEventListener('blur', this.blurHandler);
    this.enemyMgr?.destroyAll();
  }
}

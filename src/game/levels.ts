import {
  CollectibleKind,
  EnemyKind,
  PowerUpKind,
  type AmbushZoneDef,
  type CollectibleSpawnDef,
  type EnemySpawnDef,
  type HidingSpotDef,
  type LevelConfig,
  type LevelPalette,
  type LowObstacleDef,
  type PlatformDef,
  type PuzzleGateDef,
  type SlopeDef,
} from './types';

interface LevelBlueprint {
  id: number;
  name: string;
  chapter: string;
  subtitle: string;
  palette: LevelPalette;
  enemies: EnemyKind[];
  keysRequired: number;
  hasPuzzleGate: boolean;
  slopeCount: number;
  lowObstacleCount: number;
  gapCount: number;
}

const PALETTES: Record<string, LevelPalette> = {
  village: {
    skyTop: '#070b18',
    skyBottom: '#162442',
    horizonTint: '#1f3256',
    groundFill: '#1d2738',
    groundSnow: '#dce9f7',
    accentLight: '#ff4d4d',
    fogAlpha: 0.16,
    darknessAlpha: 0.24,
    stormIntensity: 0.35,
    iceFriction: 0.95,
  },
  frozen: {
    skyTop: '#050c1a',
    skyBottom: '#11304d',
    horizonTint: '#1a496b',
    groundFill: '#14334d',
    groundSnow: '#cbeeff',
    accentLight: '#38bdf8',
    fogAlpha: 0.24,
    darknessAlpha: 0.28,
    stormIntensity: 0.55,
    iceFriction: 0.42,
  },
  forest: {
    skyTop: '#060c0f',
    skyBottom: '#122624',
    horizonTint: '#183834',
    groundFill: '#192924',
    groundSnow: '#cfe4de',
    accentLight: '#34d399',
    fogAlpha: 0.28,
    darknessAlpha: 0.34,
    stormIntensity: 0.45,
    iceFriction: 0.9,
  },
  workshop: {
    skyTop: '#14090d',
    skyBottom: '#2c131b',
    horizonTint: '#3e1a24',
    groundFill: '#2c1a1d',
    groundSnow: '#e5d4c8',
    accentLight: '#fbbf24',
    fogAlpha: 0.2,
    darknessAlpha: 0.36,
    stormIntensity: 0.22,
    iceFriction: 0.85,
  },
  dungeon: {
    skyTop: '#050509',
    skyBottom: '#14111d',
    horizonTint: '#21192e',
    groundFill: '#1c1824',
    groundSnow: '#a6a1b8',
    accentLight: '#ef4444',
    fogAlpha: 0.32,
    darknessAlpha: 0.46,
    stormIntensity: 0.3,
    iceFriction: 0.75,
  },
  storm: {
    skyTop: '#0a1220',
    skyBottom: '#263850',
    horizonTint: '#3c516b',
    groundFill: '#1f2b3d',
    groundSnow: '#eef6ff',
    accentLight: '#93c5fd',
    fogAlpha: 0.4,
    darknessAlpha: 0.32,
    stormIntensity: 1.0,
    iceFriction: 0.55,
  },
  nightmare: {
    skyTop: '#120408',
    skyBottom: '#2d0b14',
    horizonTint: '#45101e',
    groundFill: '#241117',
    groundSnow: '#f2d8dc',
    accentLight: '#ff2e4c',
    fogAlpha: 0.34,
    darknessAlpha: 0.44,
    stormIntensity: 0.85,
    iceFriction: 0.65,
  },
};

const BLUEPRINTS: LevelBlueprint[] = [
  { id: 1, name: 'The Christmas Village', chapter: 'Act I · Silent Night', subtitle: 'Escape the cottages before Evil Santa spots your footprints.', palette: PALETTES.village, enemies: [EnemyKind.SNOWMAN], keysRequired: 1, hasPuzzleGate: false, slopeCount: 1, lowObstacleCount: 2, gapCount: 1 },
  { id: 2, name: 'The Snowy Street', chapter: 'Act I · Silent Night', subtitle: 'Slide beneath fallen garlands and dodge patrolling snowmen.', palette: PALETTES.village, enemies: [EnemyKind.SNOWMAN, EnemyKind.ELF], keysRequired: 1, hasPuzzleGate: false, slopeCount: 2, lowObstacleCount: 2, gapCount: 1 },
  { id: 3, name: 'The Frozen Bridge', chapter: 'Act I · Silent Night', subtitle: 'Slick ice accelerates your slide over the chasm.', palette: PALETTES.frozen, enemies: [EnemyKind.SNOWMAN, EnemyKind.FLYING_TOY], keysRequired: 1, hasPuzzleGate: true, slopeCount: 2, lowObstacleCount: 2, gapCount: 2 },
  { id: 4, name: 'The Christmas Forest', chapter: 'Act I · Silent Night', subtitle: 'Weave through pine clearings and hide in deep snowdrifts.', palette: PALETTES.forest, enemies: [EnemyKind.ELF, EnemyKind.REINDEER], keysRequired: 1, hasPuzzleGate: false, slopeCount: 2, lowObstacleCount: 3, gapCount: 2 },
  { id: 5, name: 'The Haunted Toy Shop', chapter: 'Act I · Silent Night', subtitle: 'Wind-up soldiers guard the aisles with fixed bayonets.', palette: PALETTES.workshop, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.FLYING_TOY], keysRequired: 2, hasPuzzleGate: true, slopeCount: 1, lowObstacleCount: 3, gapCount: 1 },

  { id: 6, name: 'The Abandoned School', chapter: 'Act II · Black Snow', subtitle: 'Duck under locker frames and unlock the courtyard gate.', palette: PALETTES.dungeon, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.ELF], keysRequired: 2, hasPuzzleGate: true, slopeCount: 1, lowObstacleCount: 3, gapCount: 2 },
  { id: 7, name: 'The Snowman Graveyard', chapter: 'Act II · Black Snow', subtitle: 'Frozen spirits rise between crooked headstones.', palette: PALETTES.forest, enemies: [EnemyKind.SNOWMAN, EnemyKind.FLYING_TOY], keysRequired: 2, hasPuzzleGate: false, slopeCount: 2, lowObstacleCount: 3, gapCount: 2 },
  { id: 8, name: 'The Frozen River', chapter: 'Act II · Black Snow', subtitle: 'Ride momentum slides across cracked river ice.', palette: PALETTES.frozen, enemies: [EnemyKind.SNOWMAN, EnemyKind.REINDEER], keysRequired: 2, hasPuzzleGate: false, slopeCount: 3, lowObstacleCount: 3, gapCount: 3 },
  { id: 9, name: 'The Christmas Market', chapter: 'Act II · Black Snow', subtitle: 'Slide under awning beams between deserted stalls.', palette: PALETTES.village, enemies: [EnemyKind.ELF, EnemyKind.TOY_SOLDIER], keysRequired: 2, hasPuzzleGate: true, slopeCount: 2, lowObstacleCount: 4, gapCount: 2 },
  { id: 10, name: "Santa's Workshop", chapter: 'Act II · Black Snow', subtitle: 'His home turf—clockwork toys swarm the conveyor.', palette: PALETTES.workshop, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.ELF, EnemyKind.FLYING_TOY], keysRequired: 2, hasPuzzleGate: true, slopeCount: 2, lowObstacleCount: 4, gapCount: 2 },

  { id: 11, name: 'The Dark Tunnel', chapter: 'Act III · Deep Freeze', subtitle: 'Low stone arches force rapid slides in the dark.', palette: PALETTES.dungeon, enemies: [EnemyKind.ELF, EnemyKind.FLYING_TOY], keysRequired: 2, hasPuzzleGate: true, slopeCount: 2, lowObstacleCount: 5, gapCount: 2 },
  { id: 12, name: 'The Haunted Train Station', chapter: 'Act III · Deep Freeze', subtitle: 'Sprint along frosted platforms before the midnight whistle.', palette: PALETTES.village, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.SNOWMAN], keysRequired: 2, hasPuzzleGate: true, slopeCount: 2, lowObstacleCount: 4, gapCount: 3 },
  { id: 13, name: 'The Reindeer Barn', chapter: 'Act III · Deep Freeze', subtitle: 'Beware red-nosed antlers charging down the stalls.', palette: PALETTES.workshop, enemies: [EnemyKind.REINDEER, EnemyKind.ELF], keysRequired: 2, hasPuzzleGate: false, slopeCount: 2, lowObstacleCount: 4, gapCount: 2 },
  { id: 14, name: 'The Ice Cave', chapter: 'Act III · Deep Freeze', subtitle: 'Razor icicles hang inches above glacial slides.', palette: PALETTES.frozen, enemies: [EnemyKind.SNOWMAN, EnemyKind.FLYING_TOY], keysRequired: 2, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 5, gapCount: 3 },
  { id: 15, name: 'The Christmas Hotel', chapter: 'Act III · Deep Freeze', subtitle: 'Crimson carpets hide patrolling nutcrackers.', palette: PALETTES.workshop, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.FLYING_TOY, EnemyKind.ELF], keysRequired: 3, hasPuzzleGate: true, slopeCount: 2, lowObstacleCount: 4, gapCount: 2 },

  { id: 16, name: 'The Abandoned Shopping Mall', chapter: 'Act IV · Blizzard', subtitle: 'Slide down shattered escalators under security shutters.', palette: PALETTES.dungeon, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.FLYING_TOY], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 5, gapCount: 3 },
  { id: 17, name: 'The Snowstorm', chapter: 'Act IV · Blizzard', subtitle: 'Blinding squalls hide Evil Santa until he is right behind you.', palette: PALETTES.storm, enemies: [EnemyKind.SNOWMAN, EnemyKind.REINDEER, EnemyKind.FLYING_TOY], keysRequired: 2, hasPuzzleGate: false, slopeCount: 3, lowObstacleCount: 4, gapCount: 3 },
  { id: 18, name: 'The Frozen Castle', chapter: 'Act IV · Blizzard', subtitle: 'Ancient ramparts glazed in midnight frost.', palette: PALETTES.frozen, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.SNOWMAN, EnemyKind.FLYING_TOY], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 5, gapCount: 3 },
  { id: 19, name: 'The Secret Toy Factory', chapter: 'Act IV · Blizzard', subtitle: 'Elves and drones patrol the forbidden assembly lines.', palette: PALETTES.workshop, enemies: [EnemyKind.ELF, EnemyKind.TOY_SOLDIER, EnemyKind.FLYING_TOY], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 5, gapCount: 3 },
  { id: 20, name: "Santa's Mansion", chapter: 'Act IV · Blizzard', subtitle: 'Cross his grand hall without waking the crimson master.', palette: PALETTES.nightmare, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.REINDEER, EnemyKind.ELF], keysRequired: 3, hasPuzzleGate: true, slopeCount: 2, lowObstacleCount: 5, gapCount: 3 },

  { id: 21, name: 'The Underground Passage', chapter: 'Act V · Nightmare', subtitle: 'Claustrophobic tunnels built for fearless sliding.', palette: PALETTES.dungeon, enemies: [EnemyKind.ELF, EnemyKind.FLYING_TOY, EnemyKind.SNOWMAN], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 6, gapCount: 3 },
  { id: 22, name: 'The Haunted Christmas Garden', chapter: 'Act V · Nightmare', subtitle: 'Twisted hedges and frozen hedges conceal ambushers.', palette: PALETTES.forest, enemies: [EnemyKind.REINDEER, EnemyKind.SNOWMAN, EnemyKind.ELF], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 5, gapCount: 3 },
  { id: 23, name: 'The Dark Mountain', chapter: 'Act V · Nightmare', subtitle: 'Steep alpine chutes turn every slide into a gamble.', palette: PALETTES.storm, enemies: [EnemyKind.REINDEER, EnemyKind.FLYING_TOY, EnemyKind.SNOWMAN], keysRequired: 3, hasPuzzleGate: false, slopeCount: 4, lowObstacleCount: 5, gapCount: 4 },
  { id: 24, name: 'The Frozen Lake', chapter: 'Act V · Nightmare', subtitle: 'Minimal friction—chain jumps and slides across thin ice.', palette: PALETTES.frozen, enemies: [EnemyKind.SNOWMAN, EnemyKind.REINDEER, EnemyKind.FLYING_TOY], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 5, gapCount: 4 },
  { id: 25, name: "Santa's Secret Laboratory", chapter: 'Act V · Nightmare', subtitle: 'Where the corrupted magic was brewed beneath the snow.', palette: PALETTES.nightmare, enemies: [EnemyKind.ELF, EnemyKind.TOY_SOLDIER, EnemyKind.FLYING_TOY], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 6, gapCount: 3 },

  { id: 26, name: 'The Nightmare Forest', chapter: 'Act VI · Midnight', subtitle: 'Crimson eyes glimmer behind every frostbitten trunk.', palette: PALETTES.nightmare, enemies: [EnemyKind.REINDEER, EnemyKind.ELF, EnemyKind.FLYING_TOY], keysRequired: 3, hasPuzzleGate: true, slopeCount: 4, lowObstacleCount: 6, gapCount: 4 },
  { id: 27, name: 'The Final Workshop', chapter: 'Act VI · Midnight', subtitle: 'The last assembly floor before the dungeon descent.', palette: PALETTES.workshop, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.ELF, EnemyKind.FLYING_TOY, EnemyKind.REINDEER], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 6, gapCount: 4 },
  { id: 28, name: 'The Christmas Dungeon', chapter: 'Act VI · Midnight', subtitle: 'Iron grates, low vaults, and relentless hunters.', palette: PALETTES.dungeon, enemies: [EnemyKind.TOY_SOLDIER, EnemyKind.SNOWMAN, EnemyKind.ELF, EnemyKind.FLYING_TOY], keysRequired: 3, hasPuzzleGate: true, slopeCount: 3, lowObstacleCount: 7, gapCount: 4 },
  { id: 29, name: "Santa's Final Chase", chapter: 'Act VI · Midnight', subtitle: 'No hesitation—sprint and slide at top velocity.', palette: PALETTES.nightmare, enemies: [EnemyKind.REINDEER, EnemyKind.FLYING_TOY, EnemyKind.ELF, EnemyKind.TOY_SOLDIER], keysRequired: 3, hasPuzzleGate: true, slopeCount: 4, lowObstacleCount: 7, gapCount: 4 },
  { id: 30, name: 'The Ultimate Escape', chapter: 'Act VI · Midnight', subtitle: 'Reach the rescue sleigh to end the Christmas Nightmare.', palette: PALETTES.storm, enemies: [EnemyKind.REINDEER, EnemyKind.TOY_SOLDIER, EnemyKind.FLYING_TOY, EnemyKind.ELF, EnemyKind.SNOWMAN], keysRequired: 3, hasPuzzleGate: true, slopeCount: 5, lowObstacleCount: 7, gapCount: 4 },
];

function buildLevelFromBlueprint(bp: LevelBlueprint): LevelConfig {
  const id = bp.id;
  const worldHeight = 760;
  const baseGroundY = 560;
  const segmentCount = 6 + Math.floor((id - 1) / 5); // grows from 6 to 11 zones
  const zoneWidth = 520;
  const worldWidth = 420 + segmentCount * zoneWidth + 460;

  const platforms: PlatformDef[] = [];
  const slopes: SlopeDef[] = [];
  const lowObstacles: LowObstacleDef[] = [];
  const hidingSpots: HidingSpotDef[] = [];
  const puzzleGates: PuzzleGateDef[] = [];
  const enemies: EnemySpawnDef[] = [];
  const collectibles: CollectibleSpawnDef[] = [];
  const ambushZones: AmbushZoneDef[] = [];

  const hidingKinds: HidingSpotDef['kind'][] = ['snowdrift', 'wardrobe', 'gift_crate', 'locker'];
  const obstacleKinds: LowObstacleDef['kind'][] = ['icicle_beam', 'tunnel_arch', 'toy_gate', 'fallen_tree'];

  // Safe opening stretch (x: 0..640) at baseGroundY
  platforms.push({
    x: 0,
    y: baseGroundY,
    w: 640,
    h: 220,
    kind: bp.palette.iceFriction < 0.6 ? 'ice' : 'ground',
  });

  // First hiding spot right in view near the end of safe stretch
  hidingSpots.push({
    id: `hide-${id}-0`,
    x: 430,
    y: baseGroundY,
    kind: hidingKinds[id % hidingKinds.length],
  });

  let cursorX = 640;
  let currentY = baseGroundY;
  let slopesPlaced = 0;
  let lowObsPlaced = 0;
  let gapsPlaced = 0;

  const zoneFloors: { startX: number; endX: number; y: number }[] = [
    { startX: 0, endX: 640, y: baseGroundY },
  ];

  for (let z = 0; z < segmentCount; z++) {
    const isEven = (z + id) % 2 === 0;
    const addSlope = slopesPlaced < bp.slopeCount && (z === 0 || isEven || z === segmentCount - 1);
    const addGap = gapsPlaced < bp.gapCount && z > 0 && z < segmentCount - 1 && (z % 2 === 1);

    if (addGap) {
      const gapW = 105 + Math.min(45, id * 2);
      // Helper stepping platform if gap is wide
      if (gapW > 130) {
        platforms.push({
          x: cursorX + gapW * 0.28,
          y: currentY - 12,
          w: gapW * 0.44,
          h: 22,
          kind: 'bridge',
        });
      }
      cursorX += gapW;
      gapsPlaced++;
    }

    if (addSlope) {
      const slopeW = 240;
      const slopeDrop = 64;
      // Keep Y inside comfortable bounds [430..620]
      if (currentY + slopeDrop <= 630) {
        slopes.push({
          x: cursorX,
          y: currentY,
          w: slopeW,
          h: slopeDrop,
          direction: 'down_right',
        });
        currentY += slopeDrop;
        cursorX += slopeW;
        slopesPlaced++;
      } else {
        // Go up gently via stepped platform then slope down next
        const stepUpY = 470;
        platforms.push({
          x: cursorX,
          y: currentY - 60,
          w: 130,
          h: 24,
          kind: 'ledge',
        });
        platforms.push({
          x: cursorX + 110,
          y: stepUpY,
          w: 160,
          h: 280,
          kind: 'ground',
        });
        currentY = stepUpY;
        cursorX += 270;
      }
    }

    const segW = zoneWidth - (addSlope ? 120 : 0);
    const segStart = cursorX;
    const segEnd = cursorX + segW;

    platforms.push({
      x: segStart,
      y: currentY,
      w: segW,
      h: worldHeight - currentY + 40,
      kind: bp.palette.iceFriction < 0.6 ? 'ice' : 'ground',
    });
    zoneFloors.push({ startX: segStart, endX: segEnd, y: currentY });

    // Low obstacle inside segment (leaves 34px clearance above currentY so ONLY sliding fits!)
    if (lowObsPlaced < bp.lowObstacleCount) {
      const obsW = 92 + ((z * 17 + id * 11) % 36);
      const obsH = 68;
      const obsX = segStart + Math.floor(segW * 0.32);
      lowObstacles.push({
        x: obsX,
        y: currentY - 34 - obsH,
        w: obsW,
        h: obsH,
        kind: obstacleKinds[(z + id) % obstacleKinds.length],
      });
      lowObsPlaced++;

      // Overhead bonus ledge above the low obstacle for platformers / bells
      if (z % 2 === 0) {
        platforms.push({
          x: obsX - 20,
          y: currentY - 128,
          w: obsW + 40,
          h: 20,
          kind: 'roof',
        });
        collectibles.push({
          id: `bell-high-${id}-${z}`,
          kind: CollectibleKind.GOLDEN_BELL,
          x: obsX + obsW * 0.5,
          y: currentY - 162,
        });
      }
    }

    // Add elevated side ledge for verticality & collectibles
    if (z % 2 === 1) {
      const ledgeX = segStart + segW * 0.52;
      const ledgeY = currentY - 108;
      platforms.push({
        x: ledgeX,
        y: ledgeY,
        w: 150,
        h: 20,
        kind: 'ledge',
      });
      collectibles.push({
        id: `bell-ledge-${id}-${z}`,
        kind: CollectibleKind.GOLDEN_BELL,
        x: ledgeX + 75,
        y: ledgeY - 32,
      });
    }

    // Add hiding spot every ~2 zones
    if (z % 2 === 1 && z < segmentCount - 1) {
      hidingSpots.push({
        id: `hide-${id}-${z}`,
        x: segStart + segW - 76,
        y: currentY,
        kind: hidingKinds[(id + z) % hidingKinds.length],
      });
    }

    // Add Golden Bells along main path (including right after slide obstacle!)
    collectibles.push({
      id: `bell-low-${id}-${z}`,
      kind: CollectibleKind.GOLDEN_BELL,
      x: segStart + segW * 0.48,
      y: currentY - 22,
    });

    // Spawn 1 enemy per zone in clear space past the low obstacle
    const enemyKind = bp.enemies[(z + id) % bp.enemies.length];
    const hasLowObsInZone = lowObsPlaced > 0 && lowObstacles.length > 0 && lowObstacles[lowObstacles.length - 1].x >= segStart;
    const obsSafeRight = hasLowObsInZone
      ? lowObstacles[lowObstacles.length - 1].x + lowObstacles[lowObstacles.length - 1].w + 48
      : segStart + 45;
    const patrolMinX = Math.min(segEnd - 130, Math.max(segStart + 45, obsSafeRight));
    const patrolMaxX = segEnd - 36;
    if (patrolMaxX - patrolMinX > 90) {
      enemies.push({
        id: `enemy-${id}-${z}`,
        kind: enemyKind,
        x: Math.floor((patrolMinX + patrolMaxX) * 0.5),
        y: enemyKind === EnemyKind.FLYING_TOY ? currentY - 125 : currentY,
        patrolMinX,
        patrolMaxX,
      });
    }

    cursorX = segEnd;
  }

  // Final safe exit stretch
  const exitZoneStart = cursorX;
  const exitZoneW = 460;
  platforms.push({
    x: exitZoneStart,
    y: currentY,
    w: exitZoneW,
    h: worldHeight - currentY + 40,
    kind: 'ground',
  });
  zoneFloors.push({ startX: exitZoneStart, endX: exitZoneStart + exitZoneW, y: currentY });

  const actualWorldWidth = exitZoneStart + exitZoneW;
  const exitX = actualWorldWidth - 115;
  const exitY = currentY;

  // Checkpoint roughly halfway
  const midZone = zoneFloors[Math.floor(zoneFloors.length / 2)];
  const checkpointX = Math.floor((midZone.startX + midZone.endX) * 0.5);
  const checkpointY = midZone.y;

  // Puzzle gate & lever in the penultimate zone (lever always placed BEFORE gate!)
  if (bp.hasPuzzleGate && zoneFloors.length >= 4) {
    const gateZone = zoneFloors[zoneFloors.length - 2];
    const leverZone = zoneFloors[zoneFloors.length - 3];
    puzzleGates.push({
      id: `gate-${id}`,
      gateX: gateZone.endX - 64,
      gateY: gateZone.y,
      gateH: 130,
      leverX: leverZone.startX + 95,
      leverY: leverZone.y,
    });
  }

  // Place required Christmas Keys across distinct zones
  for (let k = 0; k < bp.keysRequired; k++) {
    const targetIdx = Math.min(
      zoneFloors.length - 2,
      Math.max(1, Math.floor(((k + 1) / (bp.keysRequired + 0.5)) * (zoneFloors.length - 1))),
    );
    const zf = zoneFloors[targetIdx];
    collectibles.push({
      id: `key-${id}-${k}`,
      kind: CollectibleKind.KEY,
      x: Math.floor((zf.startX + zf.endX) * 0.5),
      y: zf.y - 42,
    });
  }

  // Place 1 Secret Present per level (1..30) on an elevated or risky reward spot
  const presentZone = zoneFloors[Math.max(1, zoneFloors.length - 2)];
  collectibles.push({
    id: `present-${id}-0`,
    kind: CollectibleKind.SECRET_PRESENT,
    x: presentZone.startX + 120,
    y: presentZone.y - 145,
  });
  // Add an elevated platform under the secret present so it's always reachable
  platforms.push({
    x: presentZone.startX + 60,
    y: presentZone.y - 108,
    w: 120,
    h: 20,
    kind: 'roof',
  });

  // Place 2-3 rotating Power-ups along the level
  const powerCycle: PowerUpKind[] = [
    PowerUpKind.SPEED_BOOST,
    PowerUpKind.PROTECTION,
    PowerUpKind.INVISIBLE,
    PowerUpKind.EXTRA_LIFE,
  ];
  const p1Zone = zoneFloors[1];
  collectibles.push({
    id: `power-${id}-0`,
    kind: powerCycle[id % 3],
    x: p1Zone.startX + 110,
    y: p1Zone.y - 38,
  });
  const p2Zone = zoneFloors[Math.max(2, zoneFloors.length - 3)];
  collectibles.push({
    id: `power-${id}-1`,
    kind: powerCycle[(id + 1) % powerCycle.length],
    x: p2Zone.endX - 90,
    y: p2Zone.y - 38,
  });

  // Evil Santa patrol & scripted ambush
  const santaPatrolMinX = Math.min(900, Math.floor(actualWorldWidth * 0.25));
  const santaPatrolMaxX = Math.max(santaPatrolMinX + 450, actualWorldWidth - 260);
  const santaStartX = Math.floor((santaPatrolMinX + santaPatrolMaxX) * 0.55);
  const santaZone =
    zoneFloors.find((zf) => santaStartX >= zf.startX && santaStartX <= zf.endX) ?? zoneFloors[2];

  const santaBaseSpeed = 128 + id * 3.5;
  const santaChaseSpeed = 238 + id * 4.4;
  const santaDetectionRange = 360 + Math.min(180, id * 6);

  const ambushTriggerX = Math.floor(actualWorldWidth * 0.68);
  const ambushZoneFloor =
    zoneFloors.find((zf) => ambushTriggerX >= zf.startX && ambushTriggerX <= zf.endX) ??
    zoneFloors[zoneFloors.length - 2];

  ambushZones.push({
    id: `ambush-${id}`,
    triggerX: ambushTriggerX,
    spawnX: Math.max(700, ambushTriggerX - 310),
    spawnY: ambushZoneFloor.y,
  });

  return {
    id,
    name: bp.name,
    chapter: bp.chapter,
    subtitle: bp.subtitle,
    worldWidth: actualWorldWidth,
    worldHeight,
    groundY: baseGroundY,
    spawnX: 120,
    spawnY: baseGroundY,
    exitX,
    exitY,
    checkpointX,
    checkpointY,
    keysRequired: bp.keysRequired,
    santaPatrolMinX,
    santaPatrolMaxX,
    santaStartX,
    santaStartY: santaZone.y,
    santaBaseSpeed,
    santaChaseSpeed,
    santaDetectionRange,
    palette: bp.palette,
    platforms,
    slopes,
    lowObstacles,
    hidingSpots,
    puzzleGates,
    enemies,
    collectibles,
    ambushZones,
  };
}

export const LEVELS: LevelConfig[] = BLUEPRINTS.map(buildLevelFromBlueprint);

export function getLevelById(levelId: number): LevelConfig {
  const idx = Math.max(0, Math.min(LEVELS.length - 1, Math.floor(levelId) - 1));
  return LEVELS[idx];
}

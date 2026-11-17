import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import Phaser from 'phaser';
import { GameScene, type SceneBridge } from './GameScene';
import { GRAVITY_Y } from './physicsLogic';
import type { HudSnapshot, InputState, RunStats } from './types';

export interface PhaserGameHandle {
  loadLevel: (levelId: number, bestScore: number) => void;
  setPaused: (paused: boolean) => void;
  destroyGame: () => void;
}

interface PhaserGameCanvasProps {
  initialLevelId: number;
  bestScoreForLevel: number;
  touchInputRef: { current: Partial<InputState> };
  onHudUpdate: (hud: HudSnapshot) => void;
  onLevelComplete: (stats: RunStats) => void;
  onGameOver: (stats: RunStats) => void;
}

export const PhaserGameCanvas = forwardRef<PhaserGameHandle, PhaserGameCanvasProps>(
  function PhaserGameCanvas(props, ref) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const gameRef = useRef<Phaser.Game | null>(null);

    const callbacksRef = useRef({
      onHudUpdate: props.onHudUpdate,
      onLevelComplete: props.onLevelComplete,
      onGameOver: props.onGameOver,
    });
    callbacksRef.current = {
      onHudUpdate: props.onHudUpdate,
      onLevelComplete: props.onLevelComplete,
      onGameOver: props.onGameOver,
    };

    const bridgeRef = useRef<SceneBridge>({
      levelId: props.initialLevelId,
      bestScoreForLevel: props.bestScoreForLevel,
      touchInputRef: props.touchInputRef,
      onHudUpdate: (hud) => callbacksRef.current.onHudUpdate(hud),
      onLevelComplete: (stats) => callbacksRef.current.onLevelComplete(stats),
      onGameOver: (stats) => callbacksRef.current.onGameOver(stats),
    });

    useEffect(() => {
      const el = containerRef.current;
      if (!el || gameRef.current) return;

      const game = new Phaser.Game({
        type: Phaser.CANVAS,
        parent: el,
        width: 1280,
        height: 720,
        backgroundColor: '#070b14',
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH,
        },
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: GRAVITY_Y },
            debug: false,
          },
        },
        scene: [],
      });

      game.scene.add('GameScene', GameScene, true, { bridge: bridgeRef.current });
      gameRef.current = game;

      return () => {
        const scene = game.scene.getScene('GameScene') as GameScene | undefined;
        scene?.shutdown();
        game.destroy(true);
        gameRef.current = null;
      };
    }, []);

    useImperativeHandle(ref, () => ({
      loadLevel(levelId: number, bestScore: number) {
        bridgeRef.current.levelId = levelId;
        bridgeRef.current.bestScoreForLevel = bestScore;
        const game = gameRef.current;
        if (!game) return;
        const scene = game.scene.getScene('GameScene') as GameScene | undefined;
        scene?.shutdown();
        game.scene.start('GameScene', { bridge: bridgeRef.current });
      },
      setPaused(paused: boolean) {
        const game = gameRef.current;
        if (!game) return;
        const scene = game.scene.getScene('GameScene') as GameScene | undefined;
        scene?.setScenePaused(paused);
      },
      destroyGame() {
        const game = gameRef.current;
        if (!game) return;
        const scene = game.scene.getScene('GameScene') as GameScene | undefined;
        scene?.shutdown();
        game.destroy(true);
        gameRef.current = null;
      },
    }));

    return (
      <div
        ref={containerRef}
        data-testid="phaser-game-container"
        className="fixed inset-0 w-full h-full overflow-hidden bg-[#070b14]"
      />
    );
  },
);

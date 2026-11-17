import Phaser from 'phaser';

function makeCanvasTexture(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);
  draw(ctx, w, h);
  tex.refresh();
}

function drawPlayerFrame(
  ctx: CanvasRenderingContext2D,
  pose: 'idle' | 'run0' | 'run1' | 'jump' | 'slide' | 'hide' | 'hurt',
): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (pose === 'slide') {
    // Low aerodynamic snow-slide silhouette (48x30 canvas)
    // Scarf streaming behind
    ctx.fillStyle = '#e11d48';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(16, 12);
    ctx.quadraticCurveTo(6, 7, 2, 13);
    ctx.lineTo(5, 17);
    ctx.quadraticCurveTo(10, 14, 16, 16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Boots forward
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(34, 19, 11, 7);
    ctx.strokeRect(34, 19, 11, 7);

    // Winter parka torso reclined
    ctx.fillStyle = '#2563eb';
    ctx.beginPath();
    ctx.roundRect(14, 12, 23, 14, 6);
    ctx.fill();
    ctx.stroke();

    // Head with knit beanie & goggles/eyes
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(20, 11, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Beanie
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(19, 8, 8, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(23, 9, 2.5, 3);
    ctx.restore();
    return;
  }

  // Standard 40x58 canvas
  const bobY = pose === 'run1' ? -2 : pose === 'jump' ? -3 : pose === 'hide' ? 12 : 0;
  const legSpread = pose === 'run0' ? 5 : pose === 'run1' ? -5 : pose === 'jump' ? 4 : 0;

  // Scarf trailing
  ctx.fillStyle = '#e11d48';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(14, 24 + bobY);
  ctx.quadraticCurveTo(5, 22 + bobY, 3, 28 + bobY);
  ctx.lineTo(7, 31 + bobY);
  ctx.quadraticCurveTo(11, 27 + bobY, 15, 28 + bobY);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Legs
  if (pose !== 'hide') {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(14 - legSpread * 0.5, 42 + bobY, 6, 13, 2);
    ctx.roundRect(21 + legSpread * 0.5, 42 + bobY, 6, 13, 2);
    ctx.fill();
    ctx.stroke();
  }

  // Parka body
  ctx.fillStyle = pose === 'hurt' ? '#fca5a5' : '#2563eb';
  ctx.beginPath();
  ctx.roundRect(11, 22 + bobY, 19, 22, 6);
  ctx.fill();
  ctx.stroke();

  // Fur trim
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(11, 40 + bobY, 19, 4);

  // Small warm lantern in hand
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(31, 35 + bobY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head
  ctx.fillStyle = '#fde68a';
  ctx.beginPath();
  ctx.arc(20, 15 + bobY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Knit winter hat + pom-pom
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(20, 12 + bobY, 9.5, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(14, 4 + bobY, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Expressive eyes
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(22, 13 + bobY, 2.5, 3.5);
  ctx.fillRect(17, 13 + bobY, 2.5, 3.5);

  ctx.restore();
}

function drawEvilSantaFrame(
  ctx: CanvasRenderingContext2D,
  mode: 'patrol' | 'chase' | 'laugh' | 'search',
  step: number,
): void {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Canvas 64x78
  const lean = mode === 'chase' ? 5 : 0;
  const bob = step % 2 === 0 ? 0 : -3;

  // Heavy boots
  const stride = mode === 'chase' ? (step % 2 === 0 ? 7 : -7) : (step % 2 === 0 ? 4 : -4);
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#020617';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(21 - stride, 60 + bob, 9, 15, 3);
  ctx.roundRect(35 + stride, 60 + bob, 9, 15, 3);
  ctx.fill();
  ctx.stroke();

  // Tattered Crimson Coat
  ctx.fillStyle = mode === 'chase' ? '#991b1b' : '#7f1d1d';
  ctx.beginPath();
  ctx.moveTo(15 + lean, 28 + bob);
  ctx.lineTo(49 + lean, 28 + bob);
  ctx.lineTo(54, 62 + bob);
  ctx.lineTo(44, 58 + bob);
  ctx.lineTo(36, 63 + bob);
  ctx.lineTo(27, 58 + bob);
  ctx.lineTo(12, 62 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Spiked Belt
  ctx.fillStyle = '#18181b';
  ctx.fillRect(15 + lean * 0.5, 45 + bob, 34, 6);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(29 + lean * 0.5, 44 + bob, 8, 8);

  // Candy-cane claw hook in hand
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(50 + lean, 48 + bob);
  ctx.lineTo(54 + lean, 20 + bob);
  ctx.arc(58 + lean, 20 + bob, 4, Math.PI, 0);
  ctx.stroke();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(51 + lean, 40 + bob);
  ctx.lineTo(53 + lean, 32 + bob);
  ctx.stroke();

  // Head
  const headY = mode === 'laugh' ? 14 : 18 + bob;
  ctx.fillStyle = '#d6b4a1';
  ctx.strokeStyle = '#090d16';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(32 + lean, headY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Crooked jagged beard
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.moveTo(21 + lean, headY + 2);
  ctx.lineTo(43 + lean, headY + 2);
  ctx.lineTo(38 + lean, headY + 22);
  ctx.lineTo(32 + lean, headY + 17);
  ctx.lineTo(26 + lean, headY + 23);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Evil mouth (snarl or open laugh)
  ctx.fillStyle = '#090d16';
  if (mode === 'laugh') {
    ctx.beginPath();
    ctx.ellipse(34 + lean, headY + 6, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(28 + lean, headY + 5, 10, 3);
  }

  // Glowing crimson eyes!
  ctx.fillStyle = '#ff1e38';
  ctx.shadowColor = '#ff1e38';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(28 + lean, headY - 2, 2.8, 0, Math.PI * 2);
  ctx.arc(37 + lean, headY - 2, 2.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Tattered Santa Hat
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.moveTo(19 + lean, headY - 6);
  ctx.lineTo(45 + lean, headY - 6);
  ctx.lineTo(26 + lean, headY - 20);
  ctx.lineTo(14 + lean, headY - 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.roundRect(19 + lean, headY - 9, 26, 5, 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function registerGameTexturesAndAnimations(scene: Phaser.Scene): void {
  // Player textures
  makeCanvasTexture(scene, 'player_idle', 40, 58, (ctx) => drawPlayerFrame(ctx, 'idle'));
  makeCanvasTexture(scene, 'player_run0', 40, 58, (ctx) => drawPlayerFrame(ctx, 'run0'));
  makeCanvasTexture(scene, 'player_run1', 40, 58, (ctx) => drawPlayerFrame(ctx, 'run1'));
  makeCanvasTexture(scene, 'player_jump', 40, 58, (ctx) => drawPlayerFrame(ctx, 'jump'));
  makeCanvasTexture(scene, 'player_slide', 48, 30, (ctx) => drawPlayerFrame(ctx, 'slide'));
  makeCanvasTexture(scene, 'player_hide', 40, 58, (ctx) => drawPlayerFrame(ctx, 'hide'));
  makeCanvasTexture(scene, 'player_hurt', 40, 58, (ctx) => drawPlayerFrame(ctx, 'hurt'));

  // Evil Santa textures
  makeCanvasTexture(scene, 'santa_patrol_0', 64, 78, (ctx) => drawEvilSantaFrame(ctx, 'patrol', 0));
  makeCanvasTexture(scene, 'santa_patrol_1', 64, 78, (ctx) => drawEvilSantaFrame(ctx, 'patrol', 1));
  makeCanvasTexture(scene, 'santa_chase_0', 64, 78, (ctx) => drawEvilSantaFrame(ctx, 'chase', 0));
  makeCanvasTexture(scene, 'santa_chase_1', 64, 78, (ctx) => drawEvilSantaFrame(ctx, 'chase', 1));
  makeCanvasTexture(scene, 'santa_laugh_0', 64, 78, (ctx) => drawEvilSantaFrame(ctx, 'laugh', 0));
  makeCanvasTexture(scene, 'santa_laugh_1', 64, 78, (ctx) => drawEvilSantaFrame(ctx, 'laugh', 1));
  makeCanvasTexture(scene, 'santa_search_0', 64, 78, (ctx) => drawEvilSantaFrame(ctx, 'search', 0));

  // Haunted Snowman (44x56)
  for (let f = 0; f < 2; f++) {
    makeCanvasTexture(scene, `snowman_${f}`, 44, 56, (ctx) => {
      const bob = f === 1 ? -2 : 0;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#dbeafe';
      ctx.beginPath();
      ctx.arc(22, 42 + bob, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(22, 24 + bob, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(22, 11 + bob, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Glowing icy eyes
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(18, 9 + bob, 3, 3);
      ctx.fillRect(24, 9 + bob, 3, 3);
      // Carrot fang nose
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(22, 13 + bob);
      ctx.lineTo(32, 15 + bob);
      ctx.lineTo(22, 17 + bob);
      ctx.closePath();
      ctx.fill();
    });
  }

  // Evil Toy Soldier (40x56)
  for (let f = 0; f < 2; f++) {
    makeCanvasTexture(scene, `soldier_${f}`, 40, 56, (ctx) => {
      const step = f === 1 ? 3 : -3;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(13 - step * 0.5, 42, 6, 12);
      ctx.fillRect(21 + step * 0.5, 42, 6, 12);
      // Coat
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(11, 21, 18, 22);
      ctx.strokeRect(11, 21, 18, 22);
      // Gold cross-belt
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.moveTo(12, 22);
      ctx.lineTo(28, 42);
      ctx.stroke();
      // Head & tall shako hat
      ctx.strokeStyle = '#0f172a';
      ctx.fillStyle = '#fde68a';
      ctx.fillRect(14, 13, 12, 9);
      ctx.strokeRect(14, 13, 12, 9);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(12, 2, 16, 11);
      // Glowing eye
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(22, 16, 3, 2.5);
      // Wind-up key
      ctx.strokeStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(7, 29, 4, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  // Haunted Reindeer (56x52)
  for (let f = 0; f < 2; f++) {
    makeCanvasTexture(scene, `reindeer_${f}`, 56, 52, (ctx) => {
      const leg = f === 1 ? 4 : -4;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#451a03';
      ctx.fillRect(12 - leg, 36, 5, 14);
      ctx.fillRect(36 + leg, 36, 5, 14);
      // Body
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(10, 22, 32, 16, 6);
      ctx.fill();
      ctx.stroke();
      // Neck & head
      ctx.beginPath();
      ctx.roundRect(34, 12, 15, 12, 4);
      ctx.fill();
      ctx.stroke();
      // Antlers
      ctx.strokeStyle = '#d6d3d1';
      ctx.beginPath();
      ctx.moveTo(39, 12);
      ctx.lineTo(35, 3);
      ctx.moveTo(43, 12);
      ctx.lineTo(47, 2);
      ctx.stroke();
      // Glowing red nose & eye
      ctx.fillStyle = '#ff1e38';
      ctx.beginPath();
      ctx.arc(49, 18, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(41, 14, 3, 3);
    });
  }

  // Flying Christmas Toy (44x40)
  for (let f = 0; f < 2; f++) {
    makeCanvasTexture(scene, `flying_${f}`, 44, 40, (ctx) => {
      const wingY = f === 0 ? 8 : 20;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      // Wings
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(22, 20);
      ctx.lineTo(4, wingY);
      ctx.lineTo(8, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(22, 20);
      ctx.lineTo(40, wingY);
      ctx.lineTo(36, 24);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Ornament body
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(22, 22, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Menacing eyes
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(17, 19, 3, 3);
      ctx.fillRect(24, 19, 3, 3);
    });
  }

  // Evil Christmas Elf (36x46)
  for (let f = 0; f < 2; f++) {
    makeCanvasTexture(scene, `elf_${f}`, 36, 46, (ctx) => {
      const bob = f === 1 ? -3 : 0;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.roundRect(10, 20 + bob, 16, 17, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(11, 36 + bob, 5, 9);
      ctx.fillRect(20, 36 + bob, 5, 9);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(18, 13 + bob, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Pointy green hat
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(10, 10 + bob);
      ctx.lineTo(26, 10 + bob);
      ctx.lineTo(18, 0 + bob);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      // Glowing yellow eyes
      ctx.fillStyle = '#facc15';
      ctx.fillRect(14, 12 + bob, 2.5, 2.5);
      ctx.fillRect(20, 12 + bob, 2.5, 2.5);
    });
  }

  // Collectibles & Power-ups (30x30)
  makeCanvasTexture(scene, 'item_key', 30, 30, (ctx) => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(10, 15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(15, 13, 12, 4);
    ctx.fillRect(22, 17, 3, 5);
    ctx.fillRect(26, 17, 2, 4);
  });

  makeCanvasTexture(scene, 'item_bell', 26, 26, (ctx) => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(6, 18);
    ctx.quadraticCurveTo(6, 5, 13, 5);
    ctx.quadraticCurveTo(20, 5, 20, 18);
    ctx.lineTo(23, 21);
    ctx.lineTo(3, 21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(13, 22, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'item_present', 30, 30, (ctx) => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(5, 8, 20, 18);
    ctx.strokeRect(5, 8, 20, 18);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(13, 8, 4, 18);
    ctx.fillRect(5, 15, 20, 4);
  });

  makeCanvasTexture(scene, 'item_speed', 28, 28, (ctx) => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(14, 14, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(16, 5);
    ctx.lineTo(9, 15);
    ctx.lineTo(14, 15);
    ctx.lineTo(12, 23);
    ctx.lineTo(20, 13);
    ctx.lineTo(15, 13);
    ctx.closePath();
    ctx.fill();
  });

  makeCanvasTexture(scene, 'item_shield', 28, 28, (ctx) => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(14, 3);
    ctx.lineTo(24, 7);
    ctx.lineTo(22, 18);
    ctx.lineTo(14, 25);
    ctx.lineTo(6, 18);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  makeCanvasTexture(scene, 'item_invisible', 28, 28, (ctx) => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(14, 15, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f3e8ff';
    ctx.beginPath();
    ctx.arc(11, 12, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  makeCanvasTexture(scene, 'item_life', 28, 28, (ctx) => {
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(14, 24);
    ctx.bezierCurveTo(3, 17, 3, 7, 9, 6);
    ctx.bezierCurveTo(12, 5, 14, 9, 14, 9);
    ctx.bezierCurveTo(14, 9, 16, 5, 19, 6);
    ctx.bezierCurveTo(25, 7, 25, 17, 14, 24);
    ctx.fill();
    ctx.stroke();
  });

  // Props: Snowflake & Glowing Light Bulb
  makeCanvasTexture(scene, 'snowflake', 8, 8, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(4, 4, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Hiding spots
  makeCanvasTexture(scene, 'hide_wardrobe', 52, 68, (ctx) => {
    ctx.fillStyle = '#3f2314';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(2, 2, 48, 64);
    ctx.strokeRect(2, 2, 48, 64);
    ctx.beginPath();
    ctx.moveTo(26, 4);
    ctx.lineTo(26, 64);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(21, 32, 3, 5);
    ctx.fillRect(28, 32, 3, 5);
  });

  makeCanvasTexture(scene, 'hide_snowdrift', 64, 46, (ctx) => {
    ctx.fillStyle = '#dbeafe';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, 44);
    ctx.quadraticCurveTo(32, 2, 62, 44);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  makeCanvasTexture(scene, 'hide_gift_crate', 54, 54, (ctx) => {
    ctx.fillStyle = '#7f1d1d';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(2, 2, 50, 50);
    ctx.strokeRect(2, 2, 50, 50);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(23, 2, 8, 50);
    ctx.fillRect(2, 23, 50, 8);
  });

  makeCanvasTexture(scene, 'hide_locker', 46, 68, (ctx) => {
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.fillRect(2, 2, 42, 64);
    ctx.strokeRect(2, 2, 42, 64);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(10, 12, 26, 3);
    ctx.fillRect(10, 18, 26, 3);
  });

  // Soft radial light glows
  makeCanvasTexture(scene, 'soft_glow_amber', 220, 220, (ctx) => {
    const grad = ctx.createRadialGradient(110, 110, 4, 110, 110, 110);
    grad.addColorStop(0, 'rgba(251, 191, 36, 0.34)');
    grad.addColorStop(0.45, 'rgba(251, 191, 36, 0.14)');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 220, 220);
  });

  makeCanvasTexture(scene, 'soft_glow_red', 140, 140, (ctx) => {
    const grad = ctx.createRadialGradient(70, 70, 3, 70, 70, 70);
    grad.addColorStop(0, 'rgba(255, 30, 56, 0.65)');
    grad.addColorStop(0.5, 'rgba(255, 30, 56, 0.22)');
    grad.addColorStop(1, 'rgba(255, 30, 56, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 140, 140);
  });

  // Clean crescent moon without dark circle artifacts
  makeCanvasTexture(scene, 'crescent_moon', 110, 110, (ctx) => {
    const glow = ctx.createRadialGradient(55, 55, 20, 55, 55, 54);
    glow.addColorStop(0, 'rgba(226, 232, 240, 0.22)');
    glow.addColorStop(1, 'rgba(226, 232, 240, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 110, 110);

    ctx.save();
    ctx.beginPath();
    ctx.arc(55, 55, 34, 0, Math.PI * 2);
    ctx.fillStyle = '#f1f5f9';
    ctx.fill();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(69, 46, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Atmospheric background cottage silhouette with warm windows
  makeCanvasTexture(scene, 'bg_cottage', 130, 120, (ctx) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 52, 90, 68);
    ctx.beginPath();
    ctx.moveTo(10, 54);
    ctx.lineTo(65, 16);
    ctx.lineTo(120, 54);
    ctx.closePath();
    ctx.fill();
    // Snow roof trim
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(12, 53);
    ctx.lineTo(65, 16);
    ctx.lineTo(118, 53);
    ctx.stroke();
    // Warm amber windows
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(36, 68, 18, 22);
    ctx.fillRect(76, 68, 18, 22);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(39, 71, 12, 16);
    ctx.fillRect(79, 71, 12, 16);
  });

  // Register Phaser Animations
  const ensureAnim = (key: string, frames: string[], frameRate: number, repeat = -1) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: frames.map((f) => ({ key: f })),
      frameRate,
      repeat,
    });
  };

  ensureAnim('player-idle', ['player_idle'], 4);
  ensureAnim('player-run', ['player_run0', 'player_idle', 'player_run1', 'player_idle'], 10);
  ensureAnim('player-jump', ['player_jump'], 6);
  ensureAnim('player-slide', ['player_slide'], 6);
  ensureAnim('player-hide', ['player_hide'], 4);
  ensureAnim('player-hurt', ['player_hurt'], 6);

  ensureAnim('santa-patrol', ['santa_patrol_0', 'santa_patrol_1'], 5);
  ensureAnim('santa-chase', ['santa_chase_0', 'santa_chase_1'], 10);
  ensureAnim('santa-laugh', ['santa_laugh_0', 'santa_laugh_1'], 8);
  ensureAnim('santa-search', ['santa_search_0'], 4);

  ensureAnim('enemy-snowman', ['snowman_0', 'snowman_1'], 5);
  ensureAnim('enemy-soldier', ['soldier_0', 'soldier_1'], 6);
  ensureAnim('enemy-reindeer', ['reindeer_0', 'reindeer_1'], 7);
  ensureAnim('enemy-flying', ['flying_0', 'flying_1'], 8);
  ensureAnim('enemy-elf', ['elf_0', 'elf_1'], 8);
}

// assets.js — generates all pixel-art visuals via canvas

const ASSETS = (() => {

  function createForestBackground(W, H) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');

    // Sky gradient
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * W;
      const y = Math.random() * H * 0.6;
      const r = Math.random() * 1.5 + 0.3;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    ctx.fillStyle = '#0f3d0f';
    ctx.fillRect(0, H * 0.65, W, H * 0.35);

    // Grass top
    ctx.fillStyle = '#1a5c1a';
    ctx.fillRect(0, H * 0.63, W, H * 0.04);

    // Trees (pixel style)
    const treePositions = [30, 90, 160, 240, 330, 420, 510, 580];
    treePositions.forEach(tx => {
      const th = 60 + Math.random() * 40;
      const ty = H * 0.63 - th;
      // trunk
      ctx.fillStyle = '#5c3d1e';
      ctx.fillRect(tx + 10, ty + th * 0.6, 8, th * 0.4);
      // leaves
      ctx.fillStyle = '#2d7a2d';
      ctx.fillRect(tx, ty, 28, 20);
      ctx.fillRect(tx + 4, ty - 14, 20, 16);
      ctx.fillRect(tx + 8, ty - 26, 12, 14);
    });

    return c;
  }

  function createPokeballSprite(size) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const r = size / 2;
    const cx = r, cy = r;

    // Top half - red
    ctx.fillStyle = '#e03030';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, Math.PI, 0);
    ctx.fill();

    // Bottom half - white
    ctx.fillStyle = '#f0f0f0';
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI);
    ctx.fill();

    // Center band
    ctx.fillStyle = '#222';
    ctx.fillRect(1, cy - 3, size - 2, 6);

    // Center button
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Outer border
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.stroke();

    return c;
  }

  const RANK_PALETTES = {
    Common:    { body: '#a8a8a8', outline: '#505050', eye: '#333', shine: '#ddd' },
    Uncommon:  { body: '#5dba6a', outline: '#2a6e35', eye: '#fff', shine: '#aff' },
    Rare:      { body: '#5599ee', outline: '#1a3e88', eye: '#fff', shine: '#adf' },
    Epic:      { body: '#a855f7', outline: '#5b1fa8', eye: '#fff', shine: '#daf' },
    Legendary: { body: '#f5c518', outline: '#8a6800', eye: '#fff', shine: '#ffe' },
  };

  function createPokemonSprite(rank, size) {
    const c = document.createElement('canvas');
    c.width = size; c.height = size;
    const ctx = c.getContext('2d');
    const p = RANK_PALETTES[rank] || RANK_PALETTES.Common;
    const s = size / 40; // scale factor

    // Body (rounded rect pixel style)
    ctx.fillStyle = p.body;
    ctx.fillRect(8*s, 10*s, 24*s, 22*s);
    ctx.fillRect(10*s, 8*s, 20*s, 26*s);

    // Outline
    ctx.fillStyle = p.outline;
    ctx.fillRect(7*s, 9*s, 2*s, 24*s);
    ctx.fillRect(31*s, 9*s, 2*s, 24*s);
    ctx.fillRect(9*s, 7*s, 22*s, 2*s);
    ctx.fillRect(9*s, 31*s, 22*s, 2*s);

    // Eyes
    ctx.fillStyle = p.eye;
    ctx.fillRect(13*s, 14*s, 5*s, 5*s);
    ctx.fillRect(22*s, 14*s, 5*s, 5*s);
    ctx.fillStyle = '#111';
    ctx.fillRect(14*s, 15*s, 3*s, 3*s);
    ctx.fillRect(23*s, 15*s, 3*s, 3*s);

    // Shine on eyes
    ctx.fillStyle = p.shine;
    ctx.fillRect(14*s, 15*s, 1*s, 1*s);
    ctx.fillRect(23*s, 15*s, 1*s, 1*s);

    // Mouth
    ctx.fillStyle = p.outline;
    ctx.fillRect(15*s, 23*s, 10*s, 2*s);
    ctx.fillRect(13*s, 21*s, 2*s, 2*s);
    ctx.fillRect(25*s, 21*s, 2*s, 2*s);

    // Ears / top detail
    ctx.fillStyle = p.body;
    ctx.fillRect(10*s, 4*s, 6*s, 6*s);
    ctx.fillRect(24*s, 4*s, 6*s, 6*s);
    ctx.fillStyle = p.outline;
    ctx.fillRect(9*s, 3*s, 2*s, 8*s);
    ctx.fillRect(16*s, 3*s, 2*s, 2*s);
    ctx.fillRect(23*s, 3*s, 2*s, 2*s);
    ctx.fillRect(30*s, 3*s, 2*s, 8*s);

    // Rank star indicator (Legendary gets 3, Epic 2, Rare 1)
    const stars = rank === 'Legendary' ? 3 : rank === 'Epic' ? 2 : rank === 'Rare' ? 1 : 0;
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < stars; i++) {
      ctx.fillRect((16 + i * 5)*s, 35*s, 3*s, 3*s);
    }

    return c;
  }

  return { createForestBackground, createPokeballSprite, createPokemonSprite };
})();
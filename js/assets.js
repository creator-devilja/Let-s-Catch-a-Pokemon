// 8-bit pixel art assets and utilities
const ASSETS = (function() {
  // Canvas-based drawing utilities for pixel sprites
  
  // Create a simple 8-bit pokeball sprite on canvas
  function createPokeballSprite(size = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const s = size;
    const half = s / 2;
    
    // Red top half
    ctx.fillStyle = '#FF3333';
    ctx.fillRect(0, 0, s, half);
    
    // White bottom half
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, half, s, half);
    
    // Black middle line
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, half - 2, s, 4);
    
    // White center circle
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(half, half, half * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Black center dot
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(half, half, half * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
  }
  
  // Create a pixelated pokemon sprite
  function createPokemonSprite(rank = 'Common', size = 32) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    const colors = {
      'Common': ['#FFD700', '#FFA500'],
      'Uncommon': ['#00DD00', '#00AA00'],
      'Rare': ['#0099FF', '#0066CC'],
      'Epic': ['#DD00DD', '#AA00AA'],
      'Legendary': ['#FFD700', '#FF6600']
    };
    
    const [color1, color2] = colors[rank] || colors['Common'];
    
    // Body (larger square)
    ctx.fillStyle = color1;
    ctx.fillRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5);
    
    // Head (smaller square on top)
    ctx.fillStyle = color2;
    ctx.fillRect(size * 0.3, size * 0.1, size * 0.4, size * 0.25);
    
    // Eyes
    ctx.fillStyle = '#000000';
    ctx.fillRect(size * 0.35, size * 0.15, size * 0.08, size * 0.08);
    ctx.fillRect(size * 0.57, size * 0.15, size * 0.08, size * 0.08);
    
    // Mouth
    ctx.fillStyle = '#000000';
    ctx.fillRect(size * 0.35, size * 0.3, size * 0.3, size * 0.04);
    
    // Border/outline (optional pixel effect)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(size * 0.3, size * 0.1, size * 0.4, size * 0.25);
    ctx.strokeRect(size * 0.25, size * 0.25, size * 0.5, size * 0.5);
    
    return canvas;
  }
  
  // Create a forest background (8-bit style)
  function createForestBackground(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Sky gradient (blue at top, lighter at horizon)
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    skyGradient.addColorStop(0, '#1a5c7a');
    skyGradient.addColorStop(1, '#87CEEB');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height * 0.4);
    
    // Ground
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(0, height * 0.4, width, height * 0.6);
    
    // Grass detail
    ctx.fillStyle = '#3d7a3d';
    for (let i = 0; i < width; i += 12) {
      ctx.fillRect(i, height * 0.38, 8, 4);
    }
    
    // Trees (simple 8-bit style)
    function drawTree(x, y, scale = 1) {
      // Trunk
      ctx.fillStyle = '#654321';
      ctx.fillRect(x - 8 * scale, y - 20 * scale, 16 * scale, 40 * scale);
      
      // Foliage (triangular/square shapes)
      ctx.fillStyle = '#1a6b1a';
      ctx.fillRect(x - 24 * scale, y - 60 * scale, 48 * scale, 32 * scale);
      ctx.fillRect(x - 20 * scale, y - 80 * scale, 40 * scale, 30 * scale);
      ctx.fillRect(x - 16 * scale, y - 95 * scale, 32 * scale, 20 * scale);
      
      // Darker foliage for depth
      ctx.fillStyle = '#0d4d0d';
      ctx.fillRect(x - 24 * scale, y - 45 * scale, 12 * scale, 20 * scale);
      ctx.fillRect(x + 12 * scale, y - 50 * scale, 12 * scale, 25 * scale);
    }
    
    // Draw multiple trees at different positions
    drawTree(width * 0.15, height * 0.35, 0.8);
    drawTree(width * 0.85, height * 0.3, 0.9);
    drawTree(width * 0.5, height * 0.38, 1);
    drawTree(width * 0.3, height * 0.42, 0.7);
    drawTree(width * 0.7, height * 0.45, 0.75);
    
    // Some bushes
    ctx.fillStyle = '#2d6b2d';
    ctx.beginPath();
    ctx.arc(width * 0.25, height * 0.45, 30, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.48, 25, 0, Math.PI * 2);
    ctx.fill();
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    function drawCloud(cx, cy, w) {
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.3, 0, Math.PI * 2);
      ctx.arc(cx + w * 0.35, cy, w * 0.35, 0, Math.PI * 2);
      ctx.arc(cx - w * 0.35, cy, w * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    drawCloud(width * 0.2, height * 0.15, 30);
    drawCloud(width * 0.8, height * 0.2, 40);
    
    return canvas;
  }
  
  return {
    createPokeballSprite,
    createPokemonSprite,
    createForestBackground
  };
})();

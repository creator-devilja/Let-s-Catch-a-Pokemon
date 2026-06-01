// Main game logic (updated to integrate UI, particles, WebAudio SFX, and pixel art assets)
(function(){
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;

  // Cache sprite assets
  let backgroundCanvas = null;
  let pokeballSpriteCanvas = null;
  const pokemonSpriteCache = {};

  // Initialize assets on first load
  function initAssets() {
    try {
      if (!backgroundCanvas) {
        backgroundCanvas = ASSETS.createForestBackground(W, H);
      }
      if (!pokeballSpriteCanvas) {
        pokeballSpriteCanvas = ASSETS.createPokeballSprite(32);
      }
    } catch (e) {
      console.error('Asset initialization failed:', e);
      // Create fallback background if ASSETS fails
      if (!backgroundCanvas) {
        backgroundCanvas = document.createElement('canvas');
        backgroundCanvas.width = W;
        backgroundCanvas.height = H;
        const bgCtx = backgroundCanvas.getContext('2d');
        bgCtx.fillStyle = '#2d5a2d';
        bgCtx.fillRect(0, 0, W, H);
      }
    }
  }

  // Get or create pokemon sprite
  function getPokemonSprite(rank) {
    if (!pokemonSpriteCache[rank]) {
      try {
        pokemonSpriteCache[rank] = ASSETS.createPokemonSprite(rank, 40);
      } catch (e) {
        console.error('Pokemon sprite creation failed:', e);
        // Fallback: create simple colored canvas
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 40;
        fallbackCanvas.height = 40;
        const fc = fallbackCanvas.getContext('2d');
        fc.fillStyle = '#FFD700';
        fc.fillRect(5, 5, 30, 30);
        pokemonSpriteCache[rank] = fallbackCanvas;
      }
    }
    return pokemonSpriteCache[rank];
  }

  // spawn weights (percent)
  const RANK_WEIGHTS = [
    {rank:'Common',w:50},
    {rank:'Uncommon',w:25},
    {rank:'Rare',w:15},
    {rank:'Epic',w:8},
    {rank:'Legendary',w:2}
  ];

  // capture base chance by rank (tweaked slightly harder)
  const CAPTURE_BASE = {Common:0.65,Uncommon:0.45,Rare:0.30,Epic:0.18,Legendary:0.10};

  // XP per rank
  const RANK_XP = {Common:10,Uncommon:25,Rare:50,Epic:120,Legendary:300};

  // simple colors per rank
  const RANK_COLOR = {Common:'#c0c0c0',Uncommon:'#7bd389',Rare:'#6eb5ff',Epic:'#c37aff',Legendary:'#ffcc66'};

  let currentPokemon = null;
  let pokeball = {x:W/2,y:H-60,r:16,dragging:false, vx:0,vy:0,thrown:false};
  const gravity = 0.6; const friction = 0.995;

  // particles
  const particles = [];
  function spawnParticles(x,y,color,count){ for(let i=0;i<count;i++){ particles.push({x,y,xv:(Math.random()-0.5)*6,yv:(Math.random()-0.9)*6,life:30,color}); } }

  function pickRankByWeight(){ const total = RANK_WEIGHTS.reduce((s,r)=>s+r.w,0); let rnd = Math.random()*total; for(const rw of RANK_WEIGHTS){ if(rnd < rw.w) return rw.rank; rnd -= rw.w; } return 'Common'; }
  function pickPokemonByRank(rank){ const pool = window.POKEMON.filter(p=>p.rank===rank); return pool[Math.floor(Math.random()*pool.length)]; }
  function spawnPokemon(){ const rank = pickRankByWeight(); const p = pickPokemonByRank(rank); currentPokemon = { id:p.id, name:p.name, rank:p.rank, x: 80 + Math.random()*(W-160), y: 60 + Math.random()*120, w:40, h:40 }; }

  function resetPokeball(){ pokeball.x = W/2; pokeball.y = H-60; pokeball.vx = 0; pokeball.vy = 0; pokeball.thrown=false; pokeball.dragging=false; }

  function drawPokemon(){ 
    if(!currentPokemon) return; 
    try {
      const sprite = getPokemonSprite(currentPokemon.rank);
      const x = Math.round(currentPokemon.x - currentPokemon.w/2); 
      const y = Math.round(currentPokemon.y - currentPokemon.h/2);
      ctx.drawImage(sprite, x, y, currentPokemon.w, currentPokemon.h);
    } catch (e) {
      console.error('Draw pokemon failed:', e);
      // Fallback: draw colored rectangle
      ctx.fillStyle = RANK_COLOR[currentPokemon.rank] || '#fff';
      ctx.fillRect(currentPokemon.x - 20, currentPokemon.y - 20, 40, 40);
    }
    
    // Draw pokemon name below sprite
    ctx.fillStyle='#fff'; 
    ctx.font='11px monospace'; 
    ctx.textAlign='center';
    ctx.fillText(currentPokemon.name, currentPokemon.x, currentPokemon.y + currentPokemon.h/2 + 15);
  }

  function drawPokeball(){ 
    const p = pokeball;
    try {
      const x = Math.round(p.x - 16);
      const y = Math.round(p.y - 16);
      ctx.drawImage(pokeballSpriteCanvas, x, y, 32, 32);
    } catch (e) {
      console.error('Draw pokeball failed:', e);
      // Fallback: draw simple pokeball shape
      ctx.fillStyle = '#FF3333';
      ctx.beginPath();
      ctx.arc(p.x, p.y - 8, 16, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y + 8, 16, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(p.x - 16, p.y - 2, 32, 4);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw dragging indicator
    if(p.dragging) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(W/2, H);
      ctx.stroke();
    }
  }

  function update(dt){ 
    // update particles
    for(let i=particles.length-1;i>=0;i--){ 
      const pt = particles[i]; 
      pt.x += pt.xv*dt; 
      pt.y += pt.yv*dt; 
      pt.yv += 0.15*dt; 
      pt.life -= 1*dt; 
      if(pt.life<=0) particles.splice(i,1); 
    }
    
    if(pokeball.thrown){ 
      pokeball.vy += gravity*dt; 
      pokeball.x += pokeball.vx*dt; 
      pokeball.y += pokeball.vy*dt; 
      pokeball.vx *= friction; 
      pokeball.vy *= friction; 
      if(pokeball.y > H){ 
        pokeball.y = H-60; 
        pokeball.thrown = false; 
      }
    }
  }

  function drawParticles(){ 
    for(const p of particles){ 
      ctx.fillStyle = p.color; 
      ctx.fillRect(Math.round(p.x),Math.round(p.y),3,3); 
    } 
  }

  function checkCollision(){ 
    if(!currentPokemon) return; 
    const pb = pokeball; 
    const pk = currentPokemon; 
    const closestX = Math.max(pk.x - pk.w/2, Math.min(pb.x, pk.x + pk.w/2)); 
    const closestY = Math.max(pk.y - pk.h/2, Math.min(pb.y, pk.y + pk.h/2)); 
    const distX = pb.x - closestX; 
    const distY = pb.y - closestY; 
    if(distX*distX + distY*distY < (pb.r*pb.r + 400)){ 
      const added = attemptCapture(); 
      pokeball.thrown = false; 
      // spawn particles
      if(added){ 
        spawnParticles(currentPokemon.x,currentPokemon.y,'#7CFC00',20); 
      } else { 
        spawnParticles(currentPokemon.x,currentPokemon.y,'#ff6b6b',12); 
      }
      // store name for message before nulled
      const name = currentPokemon.name;
      currentPokemon = null;
      setTimeout(()=>{ resetPokeball(); spawnPokemon(); },600);
    } 
  }

  function attemptCapture(){ 
    if(!currentPokemon) return false; 
    const rank = currentPokemon.rank; 
    const base = CAPTURE_BASE[rank] || 0.3; 
    const modifier = 0.7 + (Math.random()*0.6 - 0.3); 
    const final = Math.max(0, Math.min(1, base * modifier)); 
    const captured = Math.random() < final; 
    const xp = captured ? RANK_XP[rank] || 10 : Math.floor(RANK_XP[rank]/2); 
    const result = UI.onCaptureResult(captured, {name:currentPokemon.name, rank:currentPokemon.rank}, xp);
    // result: true if added to inventory, false if not added or failed
    return captured && result; 
  }

  // input handling
  let dragStart = null;
  function onDown(e){ 
    e.preventDefault(); 
    const rect = canvas.getBoundingClientRect(); 
    const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left; 
    const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top; 
    const dx = x - pokeball.x; 
    const dy = y - pokeball.y; 
    if(dx*dx + dy*dy < 900){ 
      pokeball.dragging = true; 
      dragStart = {x,y}; 
    } 
  }
  
  function onMove(e){ 
    if(!pokeball.dragging) return; 
    const rect = canvas.getBoundingClientRect(); 
    const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left; 
    const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top; 
    pokeball.x = x; 
    pokeball.y = y; 
  }
  
  function onUp(e){ 
    if(!pokeball.dragging) return; 
    pokeball.dragging = false; 
    const rect = canvas.getBoundingClientRect(); 
    const x = (e.changedTouches? e.changedTouches[0].clientX : e.clientX) - rect.left; 
    const y = (e.changedTouches? e.changedTouches[0].clientY : e.clientY) - rect.top; 
    pokeball.vx = (x - dragStart.x)*0.25; 
    pokeball.vy = (y - dragStart.y)*0.25; 
    pokeball.thrown = true; 
    UI.playTone('throw'); 
  }

  canvas.addEventListener('mousedown', onDown); 
  canvas.addEventListener('touchstart', onDown,{passive:false}); 
  window.addEventListener('mousemove', onMove); 
  window.addEventListener('touchmove', onMove,{passive:false}); 
  canvas.addEventListener('mouseup', onUp); 
  canvas.addEventListener('touchend', onUp,{passive:false});

  // main loop
  let last = performance.now(); 
  function loop(now){ 
    const dt = Math.min(1, (now - last)/16.666); 
    last = now; 
    
    // Draw background
    try {
      if (backgroundCanvas) {
        ctx.drawImage(backgroundCanvas, 0, 0);
      } else {
        // Fallback background color
        ctx.fillStyle = '#2d5a2d';
        ctx.fillRect(0, 0, W, H);
      }
    } catch (e) {
      console.error('Draw background failed:', e);
      ctx.fillStyle = '#2d5a2d';
      ctx.fillRect(0, 0, W, H);
    }
    
    if(!currentPokemon) spawnPokemon(); 
    update(dt); 
    checkCollision();
    drawPokemon(); 
    drawPokeball(); 
    drawParticles(); 
    requestAnimationFrame(loop);
  }

  // Initialize and start
  initAssets();
  resetPokeball(); 
  spawnPokemon(); 
  requestAnimationFrame(loop);
})();
// Main game logic (updated to integrate UI, particles, and WebAudio SFX triggers)
(function(){
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width; const H = canvas.height;

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

  function pickRankByWeight(){ const total = RANK_WEIGHTS.reduce((s,r)=>s+r.w,0); let rnd = Math.random()*total; for(const rw of RANK_WEIGHTS){ if(rnd < rw.w) return rw.rank; rnd -= rw.w; } return RANK_WEIGHTS[0].rank; }
  function pickPokemonByRank(rank){ const pool = window.POKEMON.filter(p=>p.rank===rank); return pool[Math.floor(Math.random()*pool.length)]; }
  function spawnPokemon(){ const rank = pickRankByWeight(); const p = pickPokemonByRank(rank); currentPokemon = { id:p.id, name:p.name, rank:p.rank, x: 80 + Math.random()*(W-160), y: 60 + Math.random()*(H/2 - 80), w:48, h:48 }; }

  function resetPokeball(){ pokeball.x = W/2; pokeball.y = H-60; pokeball.vx = 0; pokeball.vy = 0; pokeball.thrown=false; pokeball.dragging=false; }

  function drawPokemon(){ if(!currentPokemon) return; ctx.fillStyle = RANK_COLOR[currentPokemon.rank] || '#fff'; const s = currentPokemon.w; const x = Math.round(currentPokemon.x); const y = Math.round(currentPokemon.y); // pixel block
    ctx.fillRect(x,y,s,s); ctx.fillStyle='#000'; ctx.fillRect(x+10,y+12,6,6); ctx.fillRect(x+30,y+12,6,6); ctx.fillStyle='#000'; ctx.font='10px monospace'; ctx.fillText(currentPokemon.name, x, y-4); }

  function drawPokeball(){ const p = pokeball; // outline
    ctx.fillStyle='#000'; ctx.fillRect(p.x-18,p.y-18,36,36); ctx.fillStyle='#fff'; ctx.fillRect(p.x-16,p.y-12,32,12); ctx.fillStyle='#ff0000'; ctx.fillRect(p.x-16,p.y-18,32,6); ctx.fillStyle='#000'; ctx.fillRect(p.x-2,p.y-8,4,4); }

  function update(dt){ // update particles
    for(let i=particles.length-1;i>=0;i--){ const pt = particles[i]; pt.x += pt.xv*dt; pt.y += pt.yv*dt; pt.yv += 0.15*dt; pt.life -= 1*dt; if(pt.life<=0) particles.splice(i,1); }
    if(pokeball.thrown){ pokeball.vy += gravity*dt; pokeball.x += pokeball.vx*dt; pokeball.y += pokeball.vy*dt; pokeball.vx *= friction; pokeball.vy *= friction; if(pokeball.y > H-60){ pokeball.y = H-60; pokeball.vy *= -0.4; if(Math.abs(pokeball.vy)<1) pokeball.vy=0; } if(pokeball.x < 20) { pokeball.x = 20; pokeball.vx *= -0.4; } if(pokeball.x > W-20) { pokeball.x = W-20; pokeball.vx *= -0.4; } checkCollision(); } }

  function drawParticles(){ for(const p of particles){ ctx.fillStyle = p.color; ctx.fillRect(Math.round(p.x),Math.round(p.y),3,3); } }

  function checkCollision(){ if(!currentPokemon) return; const pb = pokeball; const pk = currentPokemon; const closestX = Math.max(pk.x, Math.min(pb.x, pk.x+pk.w)); const closestY = Math.max(pk.y, Math.min(pb.y, pk.y+pk.h)); const dx = pb.x - closestX; const dy = pb.y - closestY; if((dx*dx+dy*dy) <= (pb.r*pb.r)) { // attempt capture
      const added = attemptCapture(); pokeball.thrown = false; // spawn particles
      if(added){ spawnParticles(currentPokemon.x+24,currentPokemon.y+24,'#7CFC00',20); } else { spawnParticles(currentPokemon.x+24,currentPokemon.y+24,'#ff6b6b',12); }
      // store name for message before nulled
      const name = currentPokemon.name;
      currentPokemon = null;
      setTimeout(()=>{ resetPokeball(); spawnPokemon(); },600);
    } }

  function attemptCapture(){ if(!currentPokemon) return false; const rank = currentPokemon.rank; const base = CAPTURE_BASE[rank] || 0.3; const modifier = 0.7 + (Math.random()*0.6 - 0.3); const finalChance = Math.max(0.03, Math.min(0.95, base * modifier)); const roll = Math.random(); const xp = RANK_XP[rank] || 10; const captured = roll < finalChance; // inform UI
    const result = UI.onCaptureResult(captured, {name:currentPokemon.name, rank:currentPokemon.rank}, xp);
    // result: true if added to inventory, false if not added or failed
    return captured && result; }

  // input handling
  let dragStart = null;
  function onDown(e){ e.preventDefault(); const rect = canvas.getBoundingClientRect(); const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left; const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top; const dx = x - pokeball.x; const dy = y - pokeball.y; if(Math.hypot(dx,dy) < 30 && !pokeball.thrown){ pokeball.dragging = true; dragStart = {x,y}; UI.showMessage('Aiming...'); } }
  function onMove(e){ if(!pokeball.dragging) return; const rect = canvas.getBoundingClientRect(); const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left; const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top; pokeball.x = x; pokeball.y = y; }
  function onUp(e){ if(!pokeball.dragging) return; pokeball.dragging = false; const rect = canvas.getBoundingClientRect(); const x = (e.changedTouches? e.changedTouches[0].clientX : e.clientX) - rect.left; const y = (e.changedTouches? e.changedTouches[0].clientY : e.clientY) - rect.top; const dx = dragStart.x - x; const dy = dragStart.y - y; pokeball.vx = dx * 0.32; pokeball.vy = dy * 0.32; pokeball.thrown = true; UI.playTone('throw'); UI.showMessage('Thrown!'); }

  canvas.addEventListener('mousedown', onDown); canvas.addEventListener('touchstart', onDown,{passive:false}); window.addEventListener('mousemove', onMove); window.addEventListener('touchmove', onMove,{passive:false}); window.addEventListener('mouseup', onUp); window.addEventListener('touchend', onUp);

  // main loop
  let last = performance.now(); function loop(now){ const dt = Math.min(1, (now - last)/16.666); last = now; ctx.clearRect(0,0,W,H); if(!currentPokemon) spawnPokemon(); update(dt); drawPokemon(); drawPokeball(); drawParticles(); requestAnimationFrame(loop); }

  resetPokeball(); spawnPokemon(); requestAnimationFrame(loop);
})();

// UI helpers to update DOM, save/load, and SFX using WebAudio
const UI = (function(){
  const SAVE_KEY = 'lets-catch-save-v1';
  const inventoryList = document.getElementById('inventory-list');
  const caughtEl = document.getElementById('caught-count');
  const lastResultEl = document.getElementById('last-result');
  const invLimitEl = document.getElementById('inventory-limit');
  const levelEl = document.getElementById('player-level');
  const xpEl = document.getElementById('player-xp');
  const xpNextEl = document.getElementById('player-xp-next');

  const exportBtn = document.getElementById('export-save');
  const importBtn = document.getElementById('import-save');
  const clearBtn = document.getElementById('clear-save');

  // Game state managed in UI for persistence
  const state = {
    inventory: [],
    caughtCount: 0,
    inventoryLimit: 30,
    player: {level:1, xp:0}
  };

  // Audio using WebAudio API
  let audioCtx = null;
  function ensureAudioCtx(){ 
    if(!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch(e) {
        console.warn('Audio context not available');
      }
    }
  }

  function playTone(type){ 
    try{ 
      ensureAudioCtx(); 
      if (!audioCtx) return;
      const ctx = audioCtx; 
      const o = ctx.createOscillator(); 
      const g = ctx.createGain();
      if(type==='throw'){ 
        o.type='square'; 
        o.frequency.value = 700; 
        g.gain.value = 0.06; 
      }
      else if(type==='catch'){ 
        o.type='sine'; 
        o.frequency.value = 1000; 
        g.gain.value = 0.09; 
      }
      else if(type==='fail'){ 
        o.type='triangle'; 
        o.frequency.value = 260; 
        g.gain.value = 0.05; 
      }
      o.connect(g); 
      g.connect(ctx.destination); 
      o.start(); 
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18); 
      o.stop(ctx.currentTime + 0.2);
    }catch(e){
      console.warn('Tone playback failed:', e);
    } 
  }

  // Persist and restore
  function save(){ 
    try{ 
      localStorage.setItem(SAVE_KEY, JSON.stringify(state)); 
    } catch(e){ 
      console.warn('Save failed', e); 
    } 
  }

  function load(){ 
    try{ 
      const raw = localStorage.getItem(SAVE_KEY); 
      if(!raw) return; 
      const data = JSON.parse(raw); 
      state.inventory = data.inventory || []; 
      state.caughtCount = data.caughtCount || 0; 
      state.inventoryLimit = data.inventoryLimit || 30;
      state.player = data.player || {level:1, xp:0};
    } catch(e){ 
      console.warn('Load failed', e); 
    } 
  }

  function clearSave(){ 
    if(confirm('Clear saved game? This will remove saved inventory and player progress.')){ 
      state.inventory = []; 
      state.caughtCount = 0; 
      state.player = {level:1, xp:0}; 
      save(); 
      refreshAll();
    }
  }

  function exportSave(){ 
    const dataStr = JSON.stringify(state, null, 2); 
    const blob = new Blob([dataStr], {type:'application/json'}); 
    const url = URL.createObjectURL(blob); 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = 'pokemon-save.json'; 
    a.click(); 
    URL.revokeObjectURL(url);
  }

  function importSave(){ 
    const inp = document.createElement('input'); 
    inp.type = 'file'; 
    inp.accept = '.json,application/json'; 
    inp.onchange = e => { 
      const f = e.target.files[0]; 
      if(!f) return; 
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const data = JSON.parse(ev.target.result);
          state.inventory = data.inventory || [];
          state.caughtCount = data.caughtCount || 0;
          state.inventoryLimit = data.inventoryLimit || 30;
          state.player = data.player || {level:1, xp:0};
          save();
          refreshAll();
          alert('Game loaded successfully!');
        } catch(e) {
          alert('Failed to load game: ' + e.message);
        }
      };
      reader.readAsText(f);
    };
    inp.click();
  }

  // UI update functions
  function refreshInventory(){ 
    inventoryList.innerHTML = ''; 
    for(let i = 0; i < state.inventory.length; i++){ 
      const it = state.inventory[i]; 
      const li = document.createElement('li'); 
      li.textContent = `${it.name} [${it.rank}]`; 
      li.dataset.index = i;
      li.style.cursor = 'pointer';
      li.addEventListener('click', onInventoryClick);
      inventoryList.appendChild(li); 
    }
    caughtEl.textContent = state.caughtCount;
    invLimitEl.textContent = state.inventoryLimit;
  }

  function refreshPlayer(){ 
    levelEl.textContent = state.player.level; 
    xpEl.textContent = state.player.xp; 
    xpNextEl.textContent = state.player.level * 100; 
  }

  function refreshAll(){ 
    refreshInventory(); 
    refreshPlayer(); 
  }

  function onInventoryClick(e){ 
    const idx = Number(e.currentTarget.dataset.index); 
    if(isNaN(idx)) return; 
    const item = state.inventory[idx]; 
    if(!item) return; 
    if(!confirm('Release ' + item.name + '? This cannot be undone.')){ 
      return; 
    }
    state.inventory.splice(idx, 1);
    save();
    refreshInventory();
    showMessage('Released ' + item.name);
  }

  function showMessage(text, color){ 
    lastResultEl.textContent = text; 
    lastResultEl.style.color = color || '#ffcc00'; 
  }

  // Called by game when a capture event occurs
  function onCaptureResult(success, pkm, captureXp){ 
    if(success){ 
      if(state.inventory.length >= state.inventoryLimit){ 
        showMessage('Inventory full — release a Pokemon first'); 
        playTone('fail'); 
        return false;
      }
      state.inventory.push(pkm);
      state.caughtCount++;
      addPlayerXP(captureXp);
      showMessage('Caught ' + pkm.name + '! +' + captureXp + ' XP', '#7CFC00');
      playTone('catch');
      save();
      refreshAll();
      return true;
    } else {
      showMessage('Failed to catch ' + pkm.name, '#ff6b6b');
      playTone('fail');
      return false;
    }
  }

  function addPlayerXP(amount){ 
    if(!amount || amount <= 0) return; 
    state.player.xp += amount; 
    let needed = state.player.level * 100; 
    while(state.player.xp >= needed){ 
      state.player.xp -= needed; 
      state.player.level++;
      needed = state.player.level * 100;
      showMessage('Level Up! You are now level ' + state.player.level, '#ffcc00');
    }
    refreshPlayer();
    save();
  }

  // Attach button event listeners safely
  if (exportBtn) exportBtn.addEventListener('click', exportSave);
  if (importBtn) importBtn.addEventListener('click', importSave);
  if (clearBtn) clearBtn.addEventListener('click', clearSave);

  // Load game state on initialization
  load(); 
  refreshAll();

  // Export the public API
  return {
    onCaptureResult, 
    showMessage, 
    getState: () => state, 
    setState: s => { 
      Object.assign(state, s); 
      refreshAll(); 
      save(); 
    }, 
    playTone,
    addPlayerXP
  };
})();

console.log('UI module loaded successfully');
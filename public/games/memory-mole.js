function loadMemoryMole() {
  if (!usePlay()) return;
  
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.innerHTML = `
    <div class="memory-mole-game">
      <div class="game-header">
        <h2>🦔 Memory Mole</h2>
        <div class="game-stats">
          <span>Level: <span id="moleLevel">1</span></span>
          <span>Score: <span id="moleScore">0</span></span>
          <span>Time: <span id="moleTimer">30</span>s</span>
        </div>
        <button class="tutorial-btn" onclick="showTutorial('memoryMole')">📖 How to Play</button>
      </div>
      <div class="layer-indicator">
        <div class="layer active" data-layer="1">Layer 1</div>
        <div class="layer" data-layer="2">Layer 2</div>
        <div class="layer" data-layer="3">Layer 3</div>
      </div>
      <div class="mole-grid">
        ${Array(16).fill(0).map((_, i) => `
          <div class="mole-hole" data-index="${i}"></div>
        `).join('')}
      </div>
      <div class="game-controls">
        <button class="btn" id="startMoleBtn">Start Game</button>
      </div>
      <div class="game-phase">
        <div class="phase-indicator watch">Watch</div>
        <div class="phase-indicator repeat">Repeat</div>
      </div>
    </div>
  `;

  document.getElementById('gamesGrid').style.display = 'none';
  gameContainer.style.display = 'block';

  // Add styles for memory mole
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .memory-mole-game {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: var(--border-radius);
      text-align: center;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .game-header {
      margin-bottom: 2rem;
    }

    .game-header h2 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    .game-stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      font-size: 1.2rem;
    }

    .layer-indicator {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .layer {
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius);
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .layer.active {
      background: var(--primary);
      transform: scale(1.1);
    }

    .mole-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      max-width: 500px;
      margin: 0 auto 2rem;
    }

    .mole-hole {
      aspect-ratio: 1;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .mole-hole.active {
      background: var(--warning);
      transform: scale(1.1);
      box-shadow: 0 0 20px var(--warning);
    }

    .mole-hole:hover:not(.active) {
      transform: scale(1.05);
    }

    .game-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .game-phase {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
    }

    .phase-indicator {
      padding: 0.5rem 1rem;
      border-radius: var(--border-radius);
      font-weight: bold;
      opacity: 0.5;
      transition: all 0.3s ease;
    }

    .phase-indicator.active {
      opacity: 1;
      background: var(--primary);
      transform: scale(1.1);
    }

    #moleTimer {
      color: var(--warning);
      font-weight: bold;
    }
  `;
  document.head.appendChild(styleSheet);

  // Add game logic
  let level = 1;
  let score = 0;
  let sequence = [];
  let playerSequence = [];
  let isPlaying = false;
  let timeLeft = 30;
  let timerInterval;
  let isWatching = true;
  let currentLayer = 1;
  let isAnimating = false;

  function updateUI() {
    document.getElementById('moleLevel').textContent = level;
    document.getElementById('moleScore').textContent = score;
    document.getElementById('moleTimer').textContent = timeLeft;
    
    // Update phase indicators
    document.querySelector('.phase-indicator.watch').classList.toggle('active', isWatching);
    document.querySelector('.phase-indicator.repeat').classList.toggle('active', !isWatching);
    
    // Update layer indicators
    document.querySelectorAll('.layer').forEach(layer => {
      layer.classList.toggle('active', parseInt(layer.dataset.layer) === currentLayer);
    });
  }

  function showMole(index, layer) {
    const hole = document.querySelector(`.mole-hole[data-index="${index}"]`);
    hole.classList.add('active');
    hole.dataset.layer = layer;
    setTimeout(() => {
      hole.classList.remove('active');
      delete hole.dataset.layer;
    }, Math.max(1000 - (level * 100), 300));
  }

  function playSequence() {
    let i = 0;
    isPlaying = false;
    isWatching = true;
    isAnimating = true;
    updateUI();
    
    const interval = setInterval(() => {
      if (i < sequence.length) {
        const currentMoles = sequence[i];
        currentLayer = currentMoles[0].layer;
        updateUI();
        
        // Show all moles for current layer
        currentMoles.forEach(mole => {
          showMole(mole.index, mole.layer);
        });
        
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          isWatching = false;
          isPlaying = true;
          isAnimating = false;
          currentLayer = 1;
          updateUI();
        }, 2000);
      }
    }, Math.max(2000 - (level * 150), 800));
  }

  function startTimer() {
    timeLeft = 30;
    updateUI();
    timerInterval = setInterval(() => {
      if (!isAnimating) {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          isPlaying = false;
          document.getElementById('startMoleBtn').textContent = 'Try Again';
          document.getElementById('startMoleBtn').disabled = false;
          awardCoins(score);
          showMessage('Time\'s up!', 'error');
        }
      }
    }, 1000);
  }

  function startGame() {
    sequence = [];
    playerSequence = [];
    level = 1;
    score = 0;
    updateUI();
    addToSequence();
    playSequence();
    startTimer();
  }

  function addToSequence() {
    // Add moles based on level
    const numLayers = Math.min(level + 1, 3);
    sequence = [];
    
    for (let layer = 1; layer <= numLayers; layer++) {
      // Start with more moles and decrease as level increases
      const molesInLayer = Math.max(4 - Math.floor(level / 2), 1);
      const layerMoles = [];
      
      for (let i = 0; i < molesInLayer; i++) {
        let index;
        do {
          index = Math.floor(Math.random() * 16);
        } while (layerMoles.some(mole => mole.index === index));
        
        layerMoles.push({ index, layer });
      }
      
      sequence.push(layerMoles);
    }
  }

  function checkSequence() {
    for (let i = 0; i < playerSequence.length; i++) {
      const currentLayerMoles = sequence[i];
      const playerMole = playerSequence[i];
      
      // Check if the clicked mole exists in the current layer's sequence
      const isCorrect = currentLayerMoles.some(mole => 
        mole.index === playerMole.index && mole.layer === playerMole.layer
      );
      
      if (!isCorrect) return false;
    }
    return true;
  }

  function handleMoleClick(index) {
    if (!isPlaying || isAnimating) {
      showMessage('Wait for the pattern to finish...', 'error');
      return;
    }
    
    showMole(index, currentLayer);
    playerSequence.push({ index, layer: currentLayer });
    
    if (playerSequence.length === sequence.length) {
      if (checkSequence()) {
        score += level * 20;
        level++;
        updateUI();
        playerSequence = [];
        addToSequence();
        setTimeout(() => {
          playSequence();
        }, 2000);
      } else {
        clearInterval(timerInterval);
        isPlaying = false;
        document.getElementById('startMoleBtn').textContent = 'Try Again';
        document.getElementById('startMoleBtn').disabled = false;
        awardCoins(score);
        showMessage('Wrong sequence!', 'error');
      }
    } else {
      // Move to next layer
      currentLayer = (currentLayer % 3) + 1;
      updateUI();
    }
  }

  document.querySelectorAll('.mole-hole').forEach(hole => {
    hole.addEventListener('click', () => {
      handleMoleClick(parseInt(hole.dataset.index));
    });
  });

  document.getElementById('startMoleBtn').addEventListener('click', () => {
    document.getElementById('startMoleBtn').disabled = true;
    startGame();
  });
} 
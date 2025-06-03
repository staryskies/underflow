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
        </div>
        <button class="tutorial-btn" onclick="showTutorial('memoryMole')">📖 How to Play</button>
      </div>
      <div class="mole-grid">
        <div class="mole-hole" data-index="0"></div>
        <div class="mole-hole" data-index="1"></div>
        <div class="mole-hole" data-index="2"></div>
        <div class="mole-hole" data-index="3"></div>
        <div class="mole-hole" data-index="4"></div>
        <div class="mole-hole" data-index="5"></div>
        <div class="mole-hole" data-index="6"></div>
        <div class="mole-hole" data-index="7"></div>
        <div class="mole-hole" data-index="8"></div>
      </div>
      <div class="game-controls">
        <button class="btn" id="startMoleBtn">Start Game</button>
        <button class="btn secondary" id="backToMenuBtn">Back to Menu</button>
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

    .mole-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      max-width: 400px;
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
    }

    .mole-hole:hover:not(.active) {
      transform: scale(1.05);
    }

    .game-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
  `;
  document.head.appendChild(styleSheet);

  // Add game logic
  let level = 1;
  let score = 0;
  let sequence = [];
  let playerSequence = [];
  let isPlaying = false;

  function updateUI() {
    document.getElementById('moleLevel').textContent = level;
    document.getElementById('moleScore').textContent = score;
  }

  function showMole(index) {
    const hole = document.querySelector(`.mole-hole[data-index="${index}"]`);
    hole.classList.add('active');
    setTimeout(() => {
      hole.classList.remove('active');
    }, 1000);
  }

  function playSequence() {
    let i = 0;
    const interval = setInterval(() => {
      if (i < sequence.length) {
        showMole(sequence[i]);
        i++;
      } else {
        clearInterval(interval);
        isPlaying = true;
      }
    }, 1200);
  }

  function startGame() {
    sequence = [];
    playerSequence = [];
    level = 1;
    score = 0;
    updateUI();
    addToSequence();
    playSequence();
  }

  function addToSequence() {
    sequence.push(Math.floor(Math.random() * 9));
  }

  function checkSequence() {
    for (let i = 0; i < playerSequence.length; i++) {
      if (playerSequence[i] !== sequence[i]) {
        return false;
      }
    }
    return true;
  }

  function handleMoleClick(index) {
    if (!isPlaying) return;
    
    showMole(index);
    playerSequence.push(index);
    
    if (playerSequence.length === sequence.length) {
      if (checkSequence()) {
        score += level * 10;
        level++;
        updateUI();
        playerSequence = [];
        addToSequence();
        setTimeout(() => {
          playSequence();
        }, 1000);
      } else {
        isPlaying = false;
        document.getElementById('startMoleBtn').textContent = 'Try Again';
        document.getElementById('startMoleBtn').disabled = false;
        awardCoins(score);
      }
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

  document.getElementById('backToMenuBtn').addEventListener('click', returnToMenu);
} 
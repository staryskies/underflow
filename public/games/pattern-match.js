function loadPatternMatch() {
  if (!usePlay()) return;
  
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.innerHTML = `
    <div class="pattern-match-game">
      <div class="game-header">
        <h2>🌈 Pattern Match</h2>
        <div class="game-stats">
          <span>Level: <span id="patternLevel">1</span></span>
          <span>Score: <span id="patternScore">0</span></span>
        </div>
      </div>
      <div class="pattern-grid">
        <div class="pattern-cell" data-index="0"></div>
        <div class="pattern-cell" data-index="1"></div>
        <div class="pattern-cell" data-index="2"></div>
        <div class="pattern-cell" data-index="3"></div>
        <div class="pattern-cell" data-index="4"></div>
        <div class="pattern-cell" data-index="5"></div>
        <div class="pattern-cell" data-index="6"></div>
        <div class="pattern-cell" data-index="7"></div>
        <div class="pattern-cell" data-index="8"></div>
      </div>
      <div class="game-controls">
        <button class="btn" id="startPatternBtn">Start Game</button>
        <button class="btn" id="resetPatternBtn">Reset</button>
        <button class="btn secondary" id="backToMenuBtn">Back to Menu</button>
      </div>
    </div>
  `;

  document.getElementById('gamesGrid').style.display = 'none';
  gameContainer.style.display = 'block';

  // Add styles for pattern match
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .pattern-match-game {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: var(--border-radius);
      text-align: center;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 500px;
      margin: 0 auto;
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

    .pattern-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      max-width: 400px;
      margin: 0 auto 2rem;
    }

    .pattern-cell {
      aspect-ratio: 1;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .pattern-cell.active {
      background: var(--primary);
    }

    .pattern-cell:hover:not(.active) {
      transform: scale(1.05);
    }

    .game-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
  `;
  document.head.appendChild(styleSheet);

  // Game logic
  let level = 1;
  let score = 0;
  let pattern = [];
  let playerPattern = [];
  let isPlaying = false;
  let isShowingPattern = false;

  function updateUI() {
    document.getElementById('patternLevel').textContent = level;
    document.getElementById('patternScore').textContent = score;
  }

  function showPattern(index) {
    const cell = document.querySelector(`.pattern-cell[data-index="${index}"]`);
    cell.classList.add('active');
    setTimeout(() => {
      cell.classList.remove('active');
    }, 1000);
  }

  function playPattern() {
    let i = 0;
    isShowingPattern = true;
    const interval = setInterval(() => {
      if (i < pattern.length) {
        showPattern(pattern[i]);
        i++;
      } else {
        clearInterval(interval);
        isShowingPattern = false;
        isPlaying = true;
      }
    }, 1200);
  }

  function startGame() {
    pattern = [];
    playerPattern = [];
    level = 1;
    score = 0;
    updateUI();
    addToPattern();
    playPattern();
  }

  function addToPattern() {
    pattern.push(Math.floor(Math.random() * 9));
  }

  function checkPattern() {
    for (let i = 0; i < playerPattern.length; i++) {
      if (playerPattern[i] !== pattern[i]) {
        return false;
      }
    }
    return true;
  }

  function handleCellClick(index) {
    if (!isPlaying || isShowingPattern) return;
    
    showPattern(index);
    playerPattern.push(index);
    
    if (playerPattern.length === pattern.length) {
      if (checkPattern()) {
        score += level * 10;
        level++;
        updateUI();
        playerPattern = [];
        addToPattern();
        setTimeout(() => {
          playPattern();
        }, 1000);
      } else {
        isPlaying = false;
        document.getElementById('startPatternBtn').textContent = 'Try Again';
        document.getElementById('startPatternBtn').disabled = false;
        awardCoins(score);
      }
    }
  }

  document.querySelectorAll('.pattern-cell').forEach(cell => {
    cell.addEventListener('click', () => {
      handleCellClick(parseInt(cell.dataset.index));
    });
  });

  document.getElementById('startPatternBtn').addEventListener('click', () => {
    document.getElementById('startPatternBtn').disabled = true;
    startGame();
  });

  document.getElementById('resetPatternBtn').addEventListener('click', () => {
    if (!usePlay()) return;
    startGame();
  });

  document.getElementById('backToMenuBtn').addEventListener('click', returnToMenu);
} 
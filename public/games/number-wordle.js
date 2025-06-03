function loadNumberWordle() {
  if (!usePlay()) return;
  
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.innerHTML = `
    <div class="number-wordle-game">
      <div class="game-header">
        <h2>🔢 Number Wordle</h2>
        <div class="game-stats">
          <span>Attempts: <span id="attempts">0</span>/6</span>
          <span>Coins: <span id="wordleCoins">0</span></span>
        </div>
      </div>
      <div class="game-board">
        <div class="guess-row" data-row="0">
          <div class="guess-cell" data-col="0"></div>
          <div class="guess-cell" data-col="1"></div>
          <div class="guess-cell" data-col="2"></div>
          <div class="guess-cell" data-col="3"></div>
        </div>
        <div class="guess-row" data-row="1">
          <div class="guess-cell" data-col="0"></div>
          <div class="guess-cell" data-col="1"></div>
          <div class="guess-cell" data-col="2"></div>
          <div class="guess-cell" data-col="3"></div>
        </div>
        <div class="guess-row" data-row="2">
          <div class="guess-cell" data-col="0"></div>
          <div class="guess-cell" data-col="1"></div>
          <div class="guess-cell" data-col="2"></div>
          <div class="guess-cell" data-col="3"></div>
        </div>
        <div class="guess-row" data-row="3">
          <div class="guess-cell" data-col="0"></div>
          <div class="guess-cell" data-col="1"></div>
          <div class="guess-cell" data-col="2"></div>
          <div class="guess-cell" data-col="3"></div>
        </div>
        <div class="guess-row" data-row="4">
          <div class="guess-cell" data-col="0"></div>
          <div class="guess-cell" data-col="1"></div>
          <div class="guess-cell" data-col="2"></div>
          <div class="guess-cell" data-col="3"></div>
        </div>
        <div class="guess-row" data-row="5">
          <div class="guess-cell" data-col="0"></div>
          <div class="guess-cell" data-col="1"></div>
          <div class="guess-cell" data-col="2"></div>
          <div class="guess-cell" data-col="3"></div>
        </div>
      </div>
      <div class="game-controls">
        <div class="number-pad">
          <button class="num-btn">1</button>
          <button class="num-btn">2</button>
          <button class="num-btn">3</button>
          <button class="num-btn">4</button>
          <button class="num-btn">5</button>
          <button class="num-btn">6</button>
          <button class="num-btn">7</button>
          <button class="num-btn">8</button>
          <button class="num-btn">9</button>
          <button class="num-btn">0</button>
          <button class="num-btn delete">⌫</button>
          <button class="num-btn enter">Enter</button>
        </div>
        <button class="btn secondary" id="backToMenuBtn">Back to Menu</button>
      </div>
    </div>
  `;

  document.getElementById('gamesGrid').style.display = 'none';
  gameContainer.style.display = 'block';

  // Add styles for number wordle
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .number-wordle-game {
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

    .game-board {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .guess-row {
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .guess-cell {
      width: 60px;
      height: 60px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: bold;
      transition: all 0.3s ease;
    }

    .guess-cell.correct {
      background: var(--success);
      border-color: var(--success);
    }

    .guess-cell.wrong-position {
      background: var(--warning);
      border-color: var(--warning);
    }

    .guess-cell.incorrect {
      background: var(--error);
      border-color: var(--error);
    }

    .number-pad {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .num-btn {
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border: none;
      padding: 1rem;
      font-size: 1.2rem;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .num-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .num-btn.delete, .num-btn.enter {
      background: rgba(255, 255, 255, 0.15);
    }

    .game-controls {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
  `;
  document.head.appendChild(styleSheet);

  // Game logic
  let secretNumber = generateSecretNumber();
  let currentRow = 0;
  let currentCol = 0;
  let attempts = 0;
  let coins = 0;

  function generateSecretNumber() {
    const digits = new Set();
    while (digits.size < 4) {
      digits.add(Math.floor(Math.random() * 10));
    }
    return Array.from(digits);
  }

  function updateUI() {
    document.getElementById('attempts').textContent = attempts;
    document.getElementById('wordleCoins').textContent = coins;
  }

  function handleNumberClick(num) {
    if (currentCol < 4 && currentRow < 6) {
      const cell = document.querySelector(`.guess-cell[data-row="${currentRow}"][data-col="${currentCol}"]`);
      cell.textContent = num;
      currentCol++;
    }
  }

  function handleDelete() {
    if (currentCol > 0) {
      currentCol--;
      const cell = document.querySelector(`.guess-cell[data-row="${currentRow}"][data-col="${currentCol}"]`);
      cell.textContent = '';
    }
  }

  function handleEnter() {
    if (currentCol !== 4) return;

    const row = document.querySelector(`.guess-row[data-row="${currentRow}"]`);
    const cells = row.querySelectorAll('.guess-cell');
    const guess = Array.from(cells).map(cell => parseInt(cell.textContent));
    
    let correct = 0;
    let wrongPosition = 0;
    const secretCopy = [...secretNumber];

    // Check for correct positions
    for (let i = 0; i < 4; i++) {
      if (guess[i] === secretCopy[i]) {
        correct++;
        cells[i].classList.add('correct');
        secretCopy[i] = -1;
      }
    }

    // Check for wrong positions
    for (let i = 0; i < 4; i++) {
      if (cells[i].classList.contains('correct')) continue;
      
      const index = secretCopy.indexOf(guess[i]);
      if (index !== -1) {
        wrongPosition++;
        cells[i].classList.add('wrong-position');
        secretCopy[index] = -1;
      } else {
        cells[i].classList.add('incorrect');
      }
    }

    attempts++;
    updateUI();

    if (correct === 4) {
      coins = Math.max(100 - (attempts - 1) * 10, 10);
      awardCoins(coins);
      setTimeout(() => {
        alert(`Congratulations! You won ${coins} coins!`);
        returnToMenu();
      }, 500);
    } else if (attempts === 6) {
      setTimeout(() => {
        alert(`Game Over! The number was ${secretNumber.join('')}`);
        returnToMenu();
      }, 500);
    } else {
      currentRow++;
      currentCol = 0;
    }
  }

  document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('delete')) {
        handleDelete();
      } else if (btn.classList.contains('enter')) {
        handleEnter();
      } else {
        handleNumberClick(btn.textContent);
      }
    });
  });

  document.getElementById('backToMenuBtn').addEventListener('click', returnToMenu);
} 
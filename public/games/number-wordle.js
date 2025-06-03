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
        <button class="tutorial-btn" onclick="showTutorial('numberWordle')">📖 How to Play</button>
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
        <div class="input-group">
          <input type="text" id="numberInput" maxlength="4" placeholder="Enter 4-digit number" pattern="[0-9]*" inputmode="numeric">
          <button class="btn" id="submitGuess">Submit</button>
        </div>
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

    .input-group {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 1rem;
    }

    #numberInput {
      width: 200px;
      padding: 0.8rem;
      font-size: 1.2rem;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      text-align: center;
      transition: all 0.3s ease;
    }

    #numberInput:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    #numberInput::placeholder {
      color: rgba(255, 255, 255, 0.5);
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
  let attempts = 0;
  let coins = 0;

  function generateSecretNumber() {
    const digits = [];
    const available = Array.from({length: 10}, (_, i) => i);
    
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * available.length);
      digits.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }
    
    return digits;
  }

  function updateUI() {
    document.getElementById('attempts').textContent = attempts;
    document.getElementById('wordleCoins').textContent = coins;
  }

  function handleSubmit() {
    const input = document.getElementById('numberInput');
    const guess = input.value;
    
    if (guess.length !== 4) {
      showMessage('Please enter a 4-digit number', 'error');
      return;
    }

    // Check for repeating digits
    const digits = new Set(guess.split(''));
    if (digits.size !== 4) {
      showMessage('Each digit must be unique', 'error');
      return;
    }

    const row = document.querySelector(`.guess-row[data-row="${currentRow}"]`);
    const cells = row.querySelectorAll('.guess-cell');
    const guessArray = guess.split('').map(Number);
    
    let correct = 0;
    let wrongPosition = 0;
    const secretCopy = [...secretNumber];

    // Check for correct positions
    for (let i = 0; i < 4; i++) {
      cells[i].textContent = guessArray[i];
      if (guessArray[i] === secretCopy[i]) {
        correct++;
        cells[i].classList.add('correct');
        secretCopy[i] = -1;
      }
    }

    // Check for wrong positions
    for (let i = 0; i < 4; i++) {
      if (cells[i].classList.contains('correct')) continue;
      
      const index = secretCopy.indexOf(guessArray[i]);
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
    input.value = '';

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
    }
  }

  document.getElementById('numberInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  });

  document.getElementById('submitGuess').addEventListener('click', handleSubmit);
} 
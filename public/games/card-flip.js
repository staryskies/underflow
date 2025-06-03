function loadCardFlip() {
  if (!usePlay()) return;
  
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.innerHTML = `
    <div class="card-flip-game">
      <div class="game-header">
        <h2>🃏 Card Flip Memory</h2>
        <div class="game-stats">
          <span>Moves: <span id="moves">0</span></span>
          <span>Pairs: <span id="pairs">0</span>/6</span>
        </div>
        <button class="tutorial-btn" onclick="showTutorial('cardFlip')">📖 How to Play</button>
      </div>
      <div class="card-grid">
        <div class="card" data-card="1">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎮</div>
          </div>
        </div>
        <div class="card" data-card="2">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎲</div>
          </div>
        </div>
        <div class="card" data-card="3">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎯</div>
          </div>
        </div>
        <div class="card" data-card="4">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎮</div>
          </div>
        </div>
        <div class="card" data-card="5">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎲</div>
          </div>
        </div>
        <div class="card" data-card="6">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎯</div>
          </div>
        </div>
        <div class="card" data-card="7">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎮</div>
          </div>
        </div>
        <div class="card" data-card="8">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎲</div>
          </div>
        </div>
        <div class="card" data-card="9">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎯</div>
          </div>
        </div>
        <div class="card" data-card="10">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎮</div>
          </div>
        </div>
        <div class="card" data-card="11">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎲</div>
          </div>
        </div>
        <div class="card" data-card="12">
          <div class="card-inner">
            <div class="card-front">?</div>
            <div class="card-back">🎯</div>
          </div>
        </div>
      </div>
      <div class="game-controls">
        <button class="btn" id="startCardBtn">Start Game</button>
        <button class="btn" id="resetCardBtn">Reset</button>
      </div>
    </div>
  `;

  document.getElementById('gamesGrid').style.display = 'none';
  gameContainer.style.display = 'block';

  // Add styles for card flip
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    .card-flip-game {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: var(--border-radius);
      text-align: center;
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.1);
      max-width: 800px;
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

    .card-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    .card {
      aspect-ratio: 1;
      perspective: 1000px;
      cursor: pointer;
    }

    .card-inner {
      position: relative;
      width: 100%;
      height: 100%;
      text-align: center;
      transition: transform 0.6s;
      transform-style: preserve-3d;
    }

    .card.flipped .card-inner {
      transform: rotateY(180deg);
    }

    .card-front, .card-back {
      position: absolute;
      width: 100%;
      height: 100%;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .card-back {
      transform: rotateY(180deg);
      background: var(--primary);
    }

    .card.matched .card-inner {
      transform: rotateY(180deg);
    }

    .card.matched .card-back {
      background: var(--success);
    }

    .game-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }
  `;
  document.head.appendChild(styleSheet);

  // Game logic
  let moves = 0;
  let pairs = 0;
  let flippedCards = [];
  let isPlaying = false;
  let canFlip = true;

  function updateUI() {
    document.getElementById('moves').textContent = moves;
    document.getElementById('pairs').textContent = pairs;
  }

  function shuffleCards() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      const randomPos = Math.floor(Math.random() * cards.length);
      card.style.order = randomPos;
    });
  }

  function startGame() {
    moves = 0;
    pairs = 0;
    flippedCards = [];
    isPlaying = true;
    canFlip = true;
    updateUI();
    
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.classList.remove('flipped', 'matched');
    });
    
    shuffleCards();
  }

  function handleCardClick(card) {
    if (!isPlaying || !canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) return;
    
    card.classList.add('flipped');
    flippedCards.push(card);
    
    if (flippedCards.length === 2) {
      canFlip = false;
      moves++;
      updateUI();
      
      const [card1, card2] = flippedCards;
      const match = card1.querySelector('.card-back').textContent === card2.querySelector('.card-back').textContent;
      
      if (match) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        pairs++;
        updateUI();
        
        if (pairs === 6) {
          setTimeout(() => {
            const coins = Math.max(100 - moves * 5, 10);
            awardCoins(coins);
            alert(`Congratulations! You won ${coins} coins!`);
            returnToMenu();
          }, 500);
        }
      } else {
        setTimeout(() => {
          card1.classList.remove('flipped');
          card2.classList.remove('flipped');
        }, 1000);
      }
      
      setTimeout(() => {
        flippedCards = [];
        canFlip = true;
      }, 1000);
    }
  }

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => handleCardClick(card));
  });

  document.getElementById('startCardBtn').addEventListener('click', () => {
    document.getElementById('startCardBtn').disabled = true;
    startGame();
  });

  document.getElementById('resetCardBtn').addEventListener('click', () => {
    if (!usePlay()) return;
    startGame();
  });
} 
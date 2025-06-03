function loadCardFlip() {
  if (!usePlay()) return;
  
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.innerHTML = `
    <div class="card-flip-game">
      <div class="game-header">
        <h2>🃏 Card Flip Memory</h2>
        <div class="game-stats">
          <span>Moves: <span id="moves">0</span></span>
          <span>Pairs: <span id="pairs">0</span>/12</span>
          <span>Time: <span id="cardTimer">60</span>s</span>
        </div>
        <button class="tutorial-btn" onclick="showTutorial('cardFlip')">📖 How to Play</button>
      </div>
      <div class="card-grid">
        ${Array(24).fill(0).map((_, i) => `
          <div class="card" data-card="${Math.floor(i/2)}">
            <div class="card-inner">
              <div class="card-front">${['🎮', '🎲', '🎯', '🎨', '🎭', '🎪', '🎡', '🎢', '🎠', '🎨', '🎭', '🎪'][Math.floor(i/2)]}</div>
              <div class="card-back">?</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="game-controls">
        <button class="btn" id="startCardBtn">Start Game</button>
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
      grid-template-columns: repeat(6, 1fr);
      gap: 0.5rem;
      max-width: 600px;
      margin: 0 auto 2rem;
    }

    .card {
      aspect-ratio: 3/4;
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
      -webkit-backface-visibility: hidden;
      backface-visibility: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      font-size: 3.5rem;
    }

    .card-front {
      background: var(--primary);
      transform: rotateY(180deg);
    }

    .card-back {
      background: var(--warning);
      transform: rotateY(0deg);
    }

    .card:hover:not(.flipped) .card-inner {
      transform: translateY(-5px);
    }

    .card.matched .card-front {
      background: var(--success);
    }

    .game-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    #cardTimer {
      color: var(--warning);
      font-weight: bold;
    }
  `;
  document.head.appendChild(styleSheet);

  // Game logic
  let moves = 0;
  let pairs = 0;
  let flippedCards = [];
  let isPlaying = false;
  let timeLeft = 60;
  let timerInterval;
  let isAnimating = false;

  function updateUI() {
    const movesEl = document.getElementById('moves');
    const pairsEl = document.getElementById('pairs');
    const timerEl = document.getElementById('cardTimer');
    
    if (movesEl) movesEl.textContent = moves;
    if (pairsEl) pairsEl.textContent = pairs;
    if (timerEl) timerEl.textContent = timeLeft;
  }

  function shuffleCards() {
    const cards = document.querySelectorAll('.card');
    const cardArray = Array.from(cards);
    
    // Ensure no more than 2 of the same icon
    const iconCounts = {};
    cardArray.forEach(card => {
      const icon = card.querySelector('.card-front').textContent;
      iconCounts[icon] = (iconCounts[icon] || 0) + 1;
    });

    // If any icon appears more than twice, regenerate the grid
    if (Object.values(iconCounts).some(count => count > 2)) {
      loadCardFlip();
      return;
    }

    // Shuffle the cards
    cardArray.forEach(card => {
      const randomPos = Math.floor(Math.random() * cardArray.length);
      card.style.order = randomPos;
    });
  }

  function startTimer() {
    timeLeft = 60;
    updateUI();
    timerInterval = setInterval(() => {
      if (!isAnimating) {
        timeLeft--;
        updateUI();
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          isPlaying = false;
          const startBtn = document.getElementById('startCardBtn');
          if (startBtn) {
            startBtn.textContent = 'Try Again';
            startBtn.disabled = false;
          }
          awardCoins(pairs * 5);
          showMessage('Time\'s up!', 'error');
        }
      }
    }, 1000);
  }

  function startGame() {
    moves = 0;
    pairs = 0;
    flippedCards = [];
    isPlaying = true;
    
    // Ensure UI is ready before updating
    setTimeout(() => {
      updateUI();
      shuffleCards();
      startTimer();
      
      document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('flipped', 'matched');
      });
      
      document.getElementById('startCardBtn').textContent = 'Restart';
    }, 100);
  }

  function handleCardClick(card) {
    if (!isPlaying || flippedCards.length >= 2 || card.classList.contains('flipped') || 
        card.classList.contains('matched') || isAnimating) return;

    card.classList.add('flipped');
    flippedCards.push(card);

    if (flippedCards.length === 2) {
      moves++;
      updateUI();
      isAnimating = true;
      
      const [card1, card2] = flippedCards;
      if (card1.dataset.card === card2.dataset.card) {
        pairs++;
        card1.classList.add('matched');
        card2.classList.add('matched');
        flippedCards = [];
        isAnimating = false;
        
        if (pairs === 12) {
          clearInterval(timerInterval);
          isPlaying = false;
          const startBtn = document.getElementById('startCardBtn');
          if (startBtn) {
            startBtn.textContent = 'Play Again';
            startBtn.disabled = false;
          }
          const timeBonus = Math.max(timeLeft, 0);
          const totalCoins = pairs * 5 + timeBonus;
          awardCoins(totalCoins);
          showMessage(`Congratulations! You won ${totalCoins} coins!`, 'success');
        }
      } else {
        setTimeout(() => {
          card1.classList.remove('flipped');
          card2.classList.remove('flipped');
          flippedCards = [];
          isAnimating = false;
        }, 1000);
      }
    }
  }

  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', () => handleCardClick(card));
  });

  document.getElementById('startCardBtn').addEventListener('click', () => {
    document.getElementById('startCardBtn').disabled = true;
    startGame();
  });
} 
// wordle.js: UI and game board setup for Wordle
// Use global word lists from window

const DEFAULT_WORD_LENGTH = 4;
const DEFAULT_MAX_GUESSES = 6;

let wordLength = DEFAULT_WORD_LENGTH;
let maxGuesses = DEFAULT_MAX_GUESSES;
let secretWord = '';
let guesses = [];
let currentGuess = '';
let secretWordDictEntries = null; // Store dictionary API result for the secret word

const gameContainer = document.getElementById('game');
const bottomBar = document.getElementById('bottom-bar');

function getWordList(length) {
  if (length === 3) return window.threeLetterWords;
  if (length === 4) return window.fourLetterWords;
  if (length === 5) return window.fiveLetterWords;
  return window.fourLetterWords;
}

function pickSecretWord() {
  const list = getWordList(wordLength);
  return list[Math.floor(Math.random() * list.length)]; // returns {word, category}
}

function createBoard() {
  gameContainer.innerHTML = '';
  const board = document.createElement('div');
  board.className = 'wordle-board';
  for (let i = 0; i < maxGuesses; i++) {
    const row = document.createElement('div');
    row.className = 'wordle-row';
    for (let j = 0; j < wordLength; j++) {
      const cell = document.createElement('div');
      cell.className = 'wordle-cell';
      row.appendChild(cell);
    }
    board.appendChild(row);
  }
  gameContainer.appendChild(board);
}

function createGuessButton() {
  const guessBtn = document.createElement('button');
  guessBtn.id = 'guess-btn';
  guessBtn.className = 'guess-btn';
  guessBtn.textContent = 'GUESS';
  guessBtn.addEventListener('click', () => handleKeyPress('Enter'));
  return guessBtn;
}

function createKeyboard() {
  let keys = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M','Backspace'] // Add Backspace to the end of the last row
  ];
  const keyboardWrapper = document.createElement('div');
  keyboardWrapper.className = 'keyboard-wrapper';

  // Add GUESS button above keyboard
  const guessBtn = createGuessButton();
  keyboardWrapper.appendChild(guessBtn);

  const keyboard = document.createElement('div');
  keyboard.className = 'wordle-keyboard';
  keys.forEach((rowKeys, rowIdx) => {
    const row = document.createElement('div');
    row.className = 'keyboard-row';
    rowKeys.forEach(key => {
      const btn = document.createElement('button');
      btn.className = 'key-btn';
      if (key === 'Backspace') {
        btn.classList.add('special');
        btn.textContent = '⌫';
      } else {
        btn.textContent = key;
      }
      btn.setAttribute('data-key', key);
      row.appendChild(btn);
    });
    keyboard.appendChild(row);
  });
  keyboardWrapper.appendChild(keyboard);
  gameContainer.appendChild(keyboardWrapper);
}

function updateBoard() {
  const board = document.querySelector('.wordle-board');
  const row = board.children[guesses.length];
  if (!row) return;
  for (let i = 0; i < wordLength; i++) {
    const cell = row.children[i];
    cell.textContent = currentGuess[i] ? currentGuess[i].toUpperCase() : '';
  }
}

function renderBottomBar(contentHtml = '', showHint = true) {
  bottomBar.innerHTML = `<div id="bottom-bar-content">${contentHtml}</div>`;
  if (showHint && !document.getElementById('hint-btn')) {
    const hintBtn = document.createElement('button');
    hintBtn.id = 'hint-btn';
    hintBtn.className = 'hint-btn';
    hintBtn.title = 'Show a hint';
    hintBtn.innerHTML = '❓';
    hintBtn.addEventListener('click', () => {
      if (secretWordDictEntries) {
        const hints = window.getAllHints(secretWordDictEntries, secretWord.word);
        window.showHintPane(hints);
      }
    });
    bottomBar.appendChild(hintBtn);
  }
}

function showMessage(msg, showPlayAgain = false, win = false) {
  // If win/lose, show endgame modal instead of bottom bar
  if (showPlayAgain) {
    // Extract etymology and headscratcher from secretWordDictEntries
    let etymology = null, headscratcher = null;
    if (secretWordDictEntries && secretWordDictEntries.length > 0) {
      // Etymology: join all et fields from all entries
      const etyms = [];
      secretWordDictEntries.forEach(e => {
        if (e.et && Array.isArray(e.et)) {
          e.et.forEach(etItem => {
            if (Array.isArray(etItem) && typeof etItem[1] === 'string') {
              etyms.push(etItem[1].replace(/{.*?}/g, ''));
            } else if (Array.isArray(etItem) && Array.isArray(etItem[1])) {
              etyms.push(etItem[1].map(s => typeof s === 'string' ? s.replace(/{.*?}/g, '') : '').join(' '));
            }
          });
        }
      });
      etymology = etyms.length > 0 ? etyms.join(' ') : null;
      // Headscratcher: look for art field with artid 'heads' or similar
      let heads = null;
      secretWordDictEntries.forEach(e => {
        if (e.art && Array.isArray(e.art)) {
          e.art.forEach(artItem => {
            if (artItem.artid && (artItem.artid.toLowerCase().includes('head') || artItem.artid.toLowerCase().includes('scratcher'))) {
              heads = artItem.caption || artItem.text || null;
            }
          });
        }
      });
      headscratcher = heads;
    }
    window.showEndgameModal({
      word: secretWord.word,
      win,
      etymology,
      headscratcher,
      onPlayAgain: startGame
    });
    return;
  }
  let html = `<span>${msg}</span>`;
  if (showPlayAgain) {
    html += ` <button id="play-again-btn" class="replay-button" title="Play Again"><img src="../assets/refresh-button.png" alt="Play Again"></button>`;
  }
  // Do not show hint button on win/loss
  renderBottomBar(html, !showPlayAgain);
  if (showPlayAgain) {
    document.getElementById('play-again-btn').addEventListener('click', startGame);
    // Do NOT set a timeout here, so the message persists
  } else {
    setTimeout(() => renderBottomBar('', true), 1500);
  }
}

function showHelperMessage(msg) {
  renderBottomBar(`<span style="font-size:1.5em;">😕</span> <span>${msg}</span>`, true);
  setTimeout(() => renderBottomBar('', true), 1800);
}

function colorRow(guess, feedback) {
  const board = document.querySelector('.wordle-board');
  const row = board.children[guesses.length - 1];
  for (let i = 0; i < wordLength; i++) {
    const cell = row.children[i];
    cell.classList.remove('correct', 'present', 'absent');
    cell.classList.add(feedback[i]);
  }
}

function getFeedback(guess, answer) {
  // Returns array: 'correct', 'present', 'absent'
  const feedback = Array(wordLength).fill('absent');
  const answerArr = answer.split('');
  const guessArr = guess.split('');
  // First pass: correct
  for (let i = 0; i < wordLength; i++) {
    if (guessArr[i] === answerArr[i]) {
      feedback[i] = 'correct';
      answerArr[i] = null;
      guessArr[i] = null;
    }
  }
  // Second pass: present
  for (let i = 0; i < wordLength; i++) {
    if (guessArr[i] && answerArr.includes(guessArr[i])) {
      feedback[i] = 'present';
      answerArr[answerArr.indexOf(guessArr[i])] = null;
    }
  }
  return feedback;
}

function handleKeyPress(key) {
  if (guesses.length >= maxGuesses) return; // Game over
  if (key === 'Backspace') {
    currentGuess = currentGuess.slice(0, -1);
    updateBoard();
    return;
  }
  if (key === 'Enter') {
    if (currentGuess.length !== wordLength) return;
    const wordList = getWordList(wordLength);
    const guessTrimmed = currentGuess.trim().toLowerCase();
    // let isRealWord = wordList.map(w => w.word.toLowerCase()).includes(guessTrimmed);
    // if (!isRealWord) {
    //   showHelperMessage("That's not a real word");
    // }
    guesses.push(currentGuess);
    const feedback = getFeedback(currentGuess, secretWord.word);
    colorRow(currentGuess, feedback);
    if (currentGuess === secretWord.word) {
      showMessage('You win!', true, true);
      if (window.confetti) {
        window.confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.7 }
        });
      }
      return;
    }
    if (guesses.length >= maxGuesses) {
      showMessage('Game over! The word was: ' + secretWord.word.toUpperCase(), true, false);
      return;
    }
    currentGuess = '';
    updateBoard();
    return;
  }
  if (/^[A-Z]$/.test(key) && currentGuess.length < wordLength) {
    currentGuess += key.toLowerCase();
    updateBoard();
  }
}

function addKeyboardListeners() {
  const buttons = document.querySelectorAll('.key-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-key');
      handleKeyPress(key);
    });
  });
}

function createHintButton() {
  const hintBtn = document.createElement('button');
  hintBtn.id = 'hint-btn';
  hintBtn.className = 'hint-button';
  hintBtn.innerHTML = 'Hint';
  hintBtn.style.marginLeft = '10px';
  hintBtn.addEventListener('click', () => {
    if (secretWord && secretWord.category) {
      bottomBar.innerHTML = `<span style="font-size:1.2em;">💡 Hint: <b>${secretWord.category}</b></span>`;
      setTimeout(() => { bottomBar.innerHTML = ''; }, 2000);
    }
  });
  return hintBtn;
}


// Attach to settings button in header
const settingsBtn = document.getElementById('settings-button');
if (settingsBtn) {
  settingsBtn.onclick = showSettingsModal;
}

function setupUI() {
  createBoard();
  createKeyboard();
  addKeyboardListeners();
  updateBoard();
  renderBottomBar();
}

function startGame() {
  secretWord = pickSecretWord();
  guesses = [];
  currentGuess = '';
  secretWordDictEntries = null;
  renderBottomBar();
  setupUI();

  // Fetch definition for the secret word and store the result for hints
  fetch('https://word-game-backend.netlify.app/.netlify/functions/define?word=' + encodeURIComponent(secretWord.word))
    .then(res => res.json())
    .then(data => {
      // Filter to only entries where meta.id is the word or starts with the word + ' '
      const word = secretWord.word.toLowerCase();
      const filtered = data.filter(entry => {
        if (entry.meta && entry.meta.id) {
          const idBase = entry.meta.id.split(':')[0].toLowerCase();
          return idBase === word || idBase.startsWith(word + ' ');
        }
        return false;
      });
      secretWordDictEntries = filtered;
      // For testing: log the part-of-speech hint
      const posHint = window.getPartOfSpeechHint(filtered);
      if (posHint) {
        console.log('Hint:', posHint);
      }
    })
    .catch(err => console.error('Error fetching definition:', err));
}

document.addEventListener('DOMContentLoaded', startGame);
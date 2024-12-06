import { subscribe, EventTypes } from './eventBus.js';
import * as events from './events.js';

export function initializeUI() {
    subscribe(EventTypes.GAME_INIT, handleGameInit);
    subscribe(EventTypes.CELL_REVEALED, handleCellRevealed);
    subscribe(EventTypes.FLAG_TOGGLED, handleFlagToggled);
    subscribe(EventTypes.FLAGS_UPDATED, handleFlagsUpdated);
    subscribe(EventTypes.MESSAGE_UPDATED, handleMessageUpdated);
    subscribe(EventTypes.GAME_OVER, handleGameOver);
}

function handleGameInit({ width, height, numMines }) {
    const cellSize = setupStyles(width, height);
    const game = document.getElementById("game");
    game.innerHTML = '';
    game.style = `grid-template-columns: repeat(${width}, ${cellSize}px)`;

    // Create UI grid
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = createCell(x, y, cellSize);
            game.appendChild(cell);
        }
    }

    updateBottomBar(numMines);
    attachEventListeners();
}

function handleFlagToggled({ x, y, isFlagged }) {
    const cell = getCellElement(x, y);
    cell.classList.toggle("flagged", isFlagged);
    cell.querySelector(".cell-front").textContent = isFlagged ? "x" : "";
}

function handleFlagsUpdated({ remaining }) {
    const flagsSpan = document.querySelector('.flags-remaining');
    if (flagsSpan) {
        flagsSpan.textContent = remaining;
    }
}

function handleCellRevealed({ x, y, delay, isMine, mineCount, isOasis }) {
    setTimeout(() => {
        const cell = getCellElement(x, y);
        const back = cell.querySelector(".cell-back");
        cell.classList.add("revealed");

        if (isMine) {
            back.innerHTML = "<img src='treasure-chest.png'>";
            back.classList.add("mine");
        } else if (isOasis) {
            back.classList.add("oasis");
            back.textContent = "🌴";
        } else if (mineCount > 0) {
            back.textContent = mineCount;
            back.dataset.number = mineCount;
        }
    }, delay);
}

function handleGameOver({ won, flaggedMines }) {
    const message = won ? "Yarrr! You found all the treasure!" : "Ye found some treasure!";
    showMessage(message);

    if (won) {
        flaggedMines.forEach((mine, index) => {
            setTimeout(() => {
                const cell = getCellElement(mine.x, mine.y);
                cell.classList.add("revealed");
                const back = cell.querySelector(".cell-back");
                back.innerHTML = "<img src='treasure-chest.png'>";
                back.classList.add("mine");
            }, index * 100);
        });

        // Trigger confetti if available
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 200,
                spread: 70,
                startVelocity: 55,
                origin: { y: 0.9 }
            });
        }
    }
}

export function setupStyles(width, height) {
    const gameContainer = document.querySelector('.game-container');
    const containerWidth = gameContainer.offsetWidth;
    const containerHeight = gameContainer.offsetHeight;
    
    return Math.min(
        Math.floor(containerWidth / width),
        Math.floor(containerHeight / height)
    );
}

export function showMessage(message) {
    const bottomBar = document.getElementById('bottom-bar');
    bottomBar.textContent = message;
}

export function updateFlagsRemaining(count) {
    const bottomBar = document.getElementById('bottom-bar');
    bottomBar.textContent = `Flags remaining: ${count}`;
}

export function animateTransition(gameContainer, direction) {
    return new Promise(resolve => {
        gameContainer.classList.remove('ready');
        gameContainer.classList.add(`sailing-${direction}`);
        
        setTimeout(() => {
            gameContainer.classList.remove(`sailing-${direction}`);
            resolve();
        }, 800);
    });
}

export function createCell(x, y, cellSize) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.x = x;
    cell.dataset.y = y;

    const cellContent = document.createElement("div");
    cellContent.className = "cell-content";

    const front = document.createElement("div");
    front.className = "cell-front";

    const back = document.createElement("div");
    back.className = "cell-back";

    cellContent.appendChild(front);
    cellContent.appendChild(back);
    cell.appendChild(cellContent);

    return cell;
}

export function updateBottomBar(flagsRemaining) {
    const bottomBar = document.getElementById('bottom-bar');
    bottomBar.innerHTML = `
        <div class="flag-controls">
            <div class="flag-container">
                <div class="draggable-flag" draggable="true">x</div>
            </div>
            <span class="flags-remaining">${flagsRemaining}</span>
        </div>
        <div class="message-container" id="message-container">
            <div id="message"></div>
            <button id="try-again-button">
                <img src="../assets/refresh-button.png">
            </button>
        </div>
    `;
}

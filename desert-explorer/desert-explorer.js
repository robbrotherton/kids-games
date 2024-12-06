import { generateBlobPoints, createBlobPath, setupGameUI } from './desert-explorer-ui.js';
import { getNeighbors } from './desert-explorer-utils.js';
import { width, height, numMines, getCellSize } from './config.js';
import { simulateGame } from './simulation.js';
import { handleLongPressStart, handleLongPressEnd, handleFlagTouchStart, handleFlagTouchMove, handleFlagTouchEnd, handleDragOver } from './touch-interaction.js'
import { progressiveValidator } from './hint-system.js';
import { initUI, showMessage } from './desert-explorer-ui.js';

const game = document.getElementById("game");
export let grid = [];
export let firstClick = true;
export var revealedCells = 0;

export function init() {
    const cellSize = getCellSize();
    setupGameUI();

    // start from scratch on reset
    game.innerHTML = '';
    game.style = `grid-template-columns: repeat(${width}, ${cellSize}px);`;
    grid = [];
    // clearMines();

    // create the grid
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
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

            game.appendChild(cell);

            grid[y][x] = { cell, mine: false, revealed: false, flagged: false };
            cell.addEventListener("click", () => reveal(x, y, 0));
            cell.addEventListener("contextmenu", e => {
                e.preventDefault(); // prevent context menu
                toggleFlag(x, y);
            });
            cell.addEventListener("touchstart", handleLongPressStart);
            cell.addEventListener("touchend", handleLongPressEnd);

            // Add drop event listeners
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', (e) => handleDrop(e, x, y));
        }
    }
}

export function resetGameState() {
    revealedCells = 0;
    firstClick = true;
    grid = [];
}

function placeMinesAvoiding(safeX, safeY) {
    const MAX_ATTEMPTS = 500;
    let attempts = 0;

    do {
        clearMines();
        let placedMines = 0;

        while (placedMines < numMines) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            // New safer safe zone - just the clicked cell and orthogonal adjacents
            const isSafeZone = (x === safeX && y === safeY) ||  // clicked cell
                (x === safeX && Math.abs(y - safeY) === 1) ||  // vertical adjacents
                (y === safeY && Math.abs(x - safeX) === 1);    // horizontal adjacents

            if (!grid[y][x].mine && !isSafeZone) {
                grid[y][x].mine = true;
                // grid[y][x].cell.querySelector('.cell-front').classList.add('mine');
                placedMines++;
            }
        }

        // Reveal first click to test solvability
        const testGrid = JSON.parse(JSON.stringify(grid));
        testGrid[safeY][safeX].revealed = true;
        if (countMines(safeX, safeY) === 0) {
            // Simulate cascade reveal for zero
            getNeighbors(safeX, safeY, width, height).forEach(([nx, ny]) => {
                testGrid[ny][nx].revealed = true;
            });
        }

        attempts++;
        if (simulateGame(testGrid)) {
            console.log(`Found solvable board in ${attempts} attempts`);
            return true;
        }
        console.log(`Attempt ${attempts} failed, retrying...`);

    } while (attempts < MAX_ATTEMPTS);

    console.log(`Failed to find solvable board in ${MAX_ATTEMPTS} attempts`);
    return false;
}

function clearMines() {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            grid[y][x].mine = false;
        }
    }
}

export function countMines(x, y) {
    return getNeighbors(x, y, width, height).filter(([nx, ny]) => grid[ny][nx]?.mine).length;
}

export function reveal(x, y, delay) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const cellData = grid[y][x];
    if (cellData.revealed || cellData.flagged) return;

    if (firstClick) {
        placeMinesAvoiding(x, y);
        firstClick = false;
        // Run simulation after first click
        setTimeout(() => simulateGame(), 500);
    }

    cellData.revealed = true;
    revealedCells++;
    const back = cellData.cell.querySelector(".cell-back");
    const mineCount = countMines(x, y);

    setTimeout(() => {
        cellData.cell.classList.add("revealed");

        if (cellData.mine) {
            back.innerHTML = "<img src='treasure-chest.png'>";
            back.classList.add("mine");
            //   alert("game over!");
            if (delay === 0) showMessage("Ye found some treasure!");

            return;
        }

        if (mineCount > 0) {
            back.textContent = mineCount;
            back.dataset.number = mineCount;
        } else {
            back.classList.add("oasis");
            back.textContent = "🌴";
            getNeighbors(x, y, width, height).forEach(([nx, ny]) => reveal(nx, ny, delay + 50));
        }
    }, delay);

    progressiveValidator();
    checkWin();
}

export function toggleFlag(x, y, createNewFlag = true, removeFlag = true) {
    const cellData = grid[y][x];
    if (cellData.revealed) return;

    const totalFlags = grid.flat().filter(cell => cell.flagged).length;
    const flagsRemainingEl = document.querySelector('.flags-remaining');

    // Prevent adding more flags than the number of mines
    if (!cellData.flagged && totalFlags >= numMines) {
        return;
    }

    cellData.flagged = !cellData.flagged;

    // Update flags remaining counter
    if (cellData.flagged) {
        flagsRemainingEl.textContent = numMines - totalFlags - 1;
    } else {
        flagsRemainingEl.textContent = numMines - totalFlags + 1;
    }

    if (cellData.flagged) {
        cellData.cell.classList.add("flagged");
        cellData.cell.querySelector(".cell-front").textContent = "x";
    } else {
        cellData.cell.classList.remove("flagged");
        cellData.cell.querySelector(".cell-front").textContent = "";
    }

    progressiveValidator();
    checkWin();
}

function checkWin() {
    const totalNonMines = width * height - numMines;
    const correctlyFlaggedMines = grid.flat().filter(cell => cell.mine && cell.flagged).length;
    const totalFlags = grid.flat().filter(cell => cell.flagged).length;
    const allRevealed = revealedCells === totalNonMines;

    if (correctlyFlaggedMines === numMines && totalFlags === numMines) {
        const messageContainer = document.getElementById("message-container");
        if (messageContainer && messageContainer.classList.contains('visible')) {
            return;
        }
        
        showMessage("Yarrr! You found all the treasure!");

        // Reveal all flagged mine cells with a delay effect
        grid.flat()
            .filter(cell => cell.flagged && cell.mine)
            .forEach((cell, index) => {
                setTimeout(() => {
                    cell.revealed = true;
                    cell.cell.classList.add("revealed");
                    const back = cell.cell.querySelector(".cell-back");
                    back.innerHTML = "<img src='treasure-chest.png'>";
                    back.classList.add("mine");
                }, index * 100);
            });

        confetti({
            particleCount: 200,
            spread: 70,
            startVelocity: 55,
            origin: { y: 0.9 }
        });
    }
}

initUI();
init();
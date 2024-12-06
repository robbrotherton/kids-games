import { width, height, numMines } from './config.js';
import { getNeighbors } from './utils.js';
import { publish, EventTypes } from './eventBus.js';

export let grid = [];
export let revealedCells = 0;
export let firstClick = true;

export function init() {
    // Reset game state
    grid = [];
    revealedCells = 0;
    firstClick = true;

    // Create grid data structure
    for (let y = 0; y < height; y++) {
        grid[y] = [];
        for (let x = 0; x < width; x++) {
            grid[y][x] = {
                mine: false,
                revealed: false,
                flagged: false,
                x,
                y
            };
        }
    }

    publish(EventTypes.GAME_INIT, { width, height, numMines });
    publish(EventTypes.FLAGS_UPDATED, { remaining: numMines });
}

export function toggleFlag(x, y) {
    const cellData = grid[y][x];
    if (cellData.revealed) return;
    const totalFlags = grid.flat().filter(cell => cell.flagged).length;

    if (!cellData.flagged && totalFlags >= numMines) return;

    cellData.flagged = !cellData.flagged;
    publish(EventTypes.FLAG_TOGGLED, { x, y, isFlagged: cellData.flagged });
    publish(EventTypes.FLAGS_UPDATED, { 
        remaining: numMines - grid.flat().filter(c => cell.flagged).length 
    });
}

export function reveal(x, y, delay = 0) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const cellData = grid[y][x];
    if (cellData.revealed || cellData.flagged) return;

    if (firstClick) {
        placeMinesAvoiding(x, y);
        firstClick = false;
        publish(EventTypes.FIRST_CLICK, { x, y });
    }

    cellData.revealed = true;
    revealedCells++;
    
    const mineCount = countMines(x, y);
    
    publish(EventTypes.CELL_REVEALED, {
        x,
        y,
        delay,
        isMine: cellData.mine,
        mineCount,
        isOasis: mineCount === 0
    });

    // Handle mine hit
    if (cellData.mine) {
        publish(EventTypes.GAME_OVER, { won: false });
        return;
    }

    // Handle empty cell cascade
    if (mineCount === 0) {
        getNeighbors(x, y).forEach(([nx, ny]) => {
            setTimeout(() => reveal(nx, ny, delay + 50), delay);
        });
    }

    checkWin();
}

function checkWin() {
    const totalNonMines = width * height - numMines;
    const correctlyFlaggedMines = grid.flat().filter(cell => cell.mine && cell.flagged).length;
    const totalFlags = grid.flat().filter(cell => cell.flagged).length;

    if ((revealedCells === totalNonMines && correctlyFlaggedMines === numMines) ||
        (correctlyFlaggedMines === numMines && totalFlags === numMines)) {
        
        publish(EventTypes.GAME_OVER, { 
            won: true,
            flaggedMines: grid.flat()
                .filter(cell => cell.flagged && cell.mine)
                .map(cell => ({ x: cell.x, y: cell.y }))
        });
    }
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
            
            const isSafeZone = (x === safeX && y === safeY) ||
                (x === safeX && Math.abs(y - safeY) === 1) ||
                (y === safeY && Math.abs(x - safeX) === 1);

            if (!grid[y][x].mine && !isSafeZone) {
                grid[y][x].mine = true;
                placedMines++;
            }
        }

        if (validateBoard() && simulateGame(safeX, safeY)) {
            publish(EventTypes.MINES_PLACED, { count: numMines });
            return true;
        }

        attempts++;
    } while (attempts < MAX_ATTEMPTS);

    return false;
}

// ...rest of existing helper functions...

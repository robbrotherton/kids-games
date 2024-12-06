import { width, height } from './config.js';
import { grid, countMines } from './desert-explorer.js';
import { getNeighbors } from './desert-explorer-utils.js';

export function progressiveValidator() {
    const markedMines = new Set(); // track definite mines

    // step 1: identify definite mines
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cellData = grid[y][x];
            if (cellData.revealed && countMines(x, y) > 0) {
                findDefiniteMines(x, y, markedMines);
            }
        }
    }

    // step 2: identify definite safe cells
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cellData = grid[y][x];
            if (cellData.revealed && countMines(x, y) > 0) {
                findDefiniteSafeCells(x, y, markedMines);
            }
        }
    }
}

function findDefiniteMines(x, y, markedMines) {
    const mineCount = countMines(x, y); // number on the revealed cell
    const neighbors = getNeighbors(x, y, width, height);

    const flaggedNeighbors = neighbors.filter(([nx, ny]) => grid[ny][nx].flagged);
    const unknownNeighbors = neighbors.filter(([nx, ny]) => !grid[ny][nx].revealed && !grid[ny][nx].flagged);

    const remainingMines = mineCount - flaggedNeighbors.length;

    // if all unknown neighbors are mines
    if (remainingMines === unknownNeighbors.length) {
        unknownNeighbors.forEach(([nx, ny]) => {
            const key = `${nx},${ny}`;
            if (!markedMines.has(key)) {
                markedMines.add(key);
                markMine(nx, ny);
            }
        });
    }
}

function findDefiniteSafeCells(x, y, markedMines) {
    const mineCount = countMines(x, y); // number on the revealed cell
    const neighbors = getNeighbors(x, y, width, height);

    const flaggedOrMarkedMines = neighbors.filter(([nx, ny]) =>
        grid[ny][nx].flagged || markedMines.has(`${nx},${ny}`)
    );
    const unknownNeighbors = neighbors.filter(([nx, ny]) => !grid[ny][nx].revealed && !grid[ny][nx].flagged);

    const remainingMines = mineCount - flaggedOrMarkedMines.length;

    // if all required mines are flagged/marked, the remaining neighbors are safe
    if (remainingMines === 0) {
        unknownNeighbors.forEach(([nx, ny]) => markSafe(nx, ny));
    }
}



function checkDeducibleNeighbors(x, y) {
    console.log("checking deducability");
    const mineCount = countMines(x, y);
    const neighbors = getNeighbors(x, y, width, height);

    const flaggedNeighbors = neighbors.filter(([nx, ny]) => grid[ny][nx].flagged);
    const unknownNeighbors = neighbors.filter(([nx, ny]) => !grid[ny][nx].revealed && !grid[ny][nx].flagged);

    // if all required mines are flagged, remaining neighbors are safe
    if (flaggedNeighbors.length === mineCount) {
        unknownNeighbors.forEach(([nx, ny]) => markSafe(nx, ny));
    }
}

function markMine(x, y) {
    const cellData = grid[y][x];
    if (!cellData.revealed && !cellData.flagged) {
        cellData.cell.classList.add("mine-hint"); // add yellow background
    }
}

function markSafe(x, y) {
    const cellData = grid[y][x];
    if (!cellData.revealed && !cellData.flagged && !cellData.mine) {
        cellData.cell.classList.add("safe");
        // Remove auto-play trigger and just track if cell would be safe
        // console.log(`Cell ${x},${y} would be safe to click`);
    }
}
import { width, height, numMines } from './config.js';
import { grid } from './desert-explorer.js';
import { getNeighbors } from './desert-explorer-utils.js';

export function simulateGame(testGrid = null) {
    let simulationGrid = testGrid || JSON.parse(JSON.stringify(grid));
    let previousRevealedCount = 0;

    // First, simulate the reveal cascade from already revealed cells
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (simulationGrid[y][x].revealed && countMinesInSimulation(x, y, simulationGrid) === 0) {
                revealNeighborsInSimulation(x, y, simulationGrid);
            }
        }
    }

    do {
        previousRevealedCount = simulationGrid.flat().filter(cell => cell.revealed).length;
        const markedMines = new Set();

        // Find all definite mines first
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cellData = simulationGrid[y][x];
                if (cellData.revealed) {
                    findDefiniteMinesInSimulation(x, y, markedMines, simulationGrid);
                }
            }
        }

        // Then find and reveal all safe cells
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const cellData = simulationGrid[y][x];
                if (cellData.revealed) {
                    findDefiniteSafeCellsInSimulation(x, y, markedMines, simulationGrid);
                }
            }
        }

        // Reveal any safe cells and their cascades
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (simulationGrid[y][x].safe && !simulationGrid[y][x].revealed) {
                    simulationGrid[y][x].revealed = true;
                    if (countMinesInSimulation(x, y, simulationGrid) === 0) {
                        revealNeighborsInSimulation(x, y, simulationGrid);
                    }
                }
            }
        }

        // Count current revealed cells
        const currentRevealedCount = simulationGrid.flat().filter(cell => cell.revealed).length;
        const totalSafeCells = width * height - simulationGrid.flat().filter(cell => cell.mine).length;

        if (currentRevealedCount === totalSafeCells) {
            console.log("Simulation shows game can be won through deduction!");
            return true;
        }

        // If no new cells were revealed in this iteration, we're stuck
        if (currentRevealedCount === previousRevealedCount) {
            console.log("Simulation stuck - no more cells can be safely revealed");
            console.log("Revealed:", currentRevealedCount, "of", totalSafeCells, "safe cells");
            return false;
        }

    } while (true);
}


function findDefiniteSafeCellsInSimulation(x, y, markedMines, simGrid) {
    const mineCount = countMinesInSimulation(x, y, simGrid);
    const neighbors = getNeighbors(x, y, width, height);
    // Remove mine check - only use flags and marked mines
    const flaggedOrMarkedMines = neighbors.filter(([nx, ny]) =>
        simGrid[ny][nx].flagged ||
        markedMines.has(`${nx},${ny}`));
    const unknownNeighbors = neighbors.filter(([nx, ny]) =>
        !simGrid[ny][nx].revealed && !simGrid[ny][nx].flagged);

    if (mineCount === flaggedOrMarkedMines.length && unknownNeighbors.length > 0) {
        unknownNeighbors.forEach(([nx, ny]) => {
            simGrid[ny][nx].safe = true;
        });
    }

    // Add new logic to find cells that must be safe due to mine constraints
    const totalMineCount = numMines;
    const knownMineLocations = new Set();

    // Find all cells that must contain mines based on current numbers
    for (let cy = 0; cy < height; cy++) {
        for (let cx = 0; cx < width; cx++) {
            if (simGrid[cy][cx].revealed) {
                const number = countMinesInSimulation(cx, cy, simGrid);
                const possibleMineLocations = getNeighbors(cx, cy)
                    .filter(([nx, ny]) => !simGrid[ny][nx].revealed);
                if (possibleMineLocations.length === number) {
                    possibleMineLocations.forEach(([nx, ny]) =>
                        knownMineLocations.add(`${nx},${ny}`));
                }
            }
        }
    }

    // If we can account for all mines in specific areas,
    // then other areas must be safe
    if (knownMineLocations.size === totalMineCount) {
        for (let cy = 0; cy < height; cy++) {
            for (let cx = 0; cx < width; cx++) {
                const key = `${cx},${cy}`;
                if (!simGrid[cy][cx].revealed &&
                    !simGrid[cy][cx].flagged &&
                    !knownMineLocations.has(key)) {
                    simGrid[cy][cx].safe = true;
                }
            }
        }
    }
}

function countMinesInSimulation(x, y, simGrid) {
    return getNeighbors(x, y, width, height).filter(([nx, ny]) => simGrid[ny][nx]?.mine).length;
}

function revealNeighborsInSimulation(x, y, simGrid) {
    getNeighbors(x, y, width, height).forEach(([nx, ny]) => {
        if (!simGrid[ny][nx].revealed && !simGrid[ny][nx].mine) {
            simGrid[ny][nx].revealed = true;
            if (countMinesInSimulation(nx, ny, simGrid) === 0) {
                revealNeighborsInSimulation(nx, ny, simGrid);
            }
        }
    });
}

function findDefiniteMinesInSimulation(x, y, markedMines, simGrid) {
    const mineCount = countMinesInSimulation(x, y, simGrid);
    const neighbors = getNeighbors(x, y, width, height);
    const flaggedNeighbors = neighbors.filter(([nx, ny]) => simGrid[ny][nx].flagged);
    const unknownNeighbors = neighbors.filter(([nx, ny]) =>
        !simGrid[ny][nx].revealed && !simGrid[ny][nx].flagged);

    const remainingMines = mineCount - flaggedNeighbors.length;

    // Original logic for direct deduction
    if (remainingMines === unknownNeighbors.length && remainingMines > 0) {
        unknownNeighbors.forEach(([nx, ny]) => {
            const key = `${nx},${ny}`;
            if (!markedMines.has(key)) {
                markedMines.add(key);
                simGrid[ny][nx].flagged = true;
            }
        });
        return;
    }

    // Add pattern matching for constrained mine arrangements
    if (remainingMines > 0) {
        // Get all revealed neighbors that share unknown cells with this one
        const revealedNeighbors = getNeighbors(x, y, width, height)
            .filter(([nx, ny]) => simGrid[ny][nx].revealed)
            .map(([nx, ny]) => ({ x: nx, y: ny, number: countMinesInSimulation(nx, ny, simGrid) }));

        // If we have a pattern where N cells must contain M mines
        // and those N cells are the only possible locations for those M mines
        const sharedUnknowns = new Set();
        revealedNeighbors.forEach(neighbor => {
            getNeighbors(neighbor.x, neighbor.y)
                .filter(([nx, ny]) => !simGrid[ny][nx].revealed && !simGrid[ny][nx].flagged)
                .forEach(([nx, ny]) => sharedUnknowns.add(`${nx},${ny}`));
        });

        // If the number of possible positions equals the number of remaining mines
        if (sharedUnknowns.size === remainingMines) {
            Array.from(sharedUnknowns).forEach(key => {
                const [nx, ny] = key.split(',').map(Number);
                if (!markedMines.has(key)) {
                    markedMines.add(key);
                    simGrid[ny][nx].flagged = true;
                }
            });
        }
    }
}
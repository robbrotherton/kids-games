const width = 4;
const height = 4;
const numMines = 4;

const game = document.getElementById("game");
let grid = [];
let firstClick = true;
let revealedCells = 0;

function generateBlobPoints(numPoints = 30, radius = 100) {  // increased points
    const points = [];
    const baseJitter = 0.5;  // base randomness
    const waveFreq = 100;      // how many small waves to add
    const waveAmp = 0.01;    // how pronounced the waves are

    for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Add multiple layers of randomness
        const mainJitter = (Math.random() - 0.5) * baseJitter;
        const wave = Math.sin(angle * waveFreq) * waveAmp;
        const r = radius * (1 + mainJitter + wave);

        // Add slight x/y variation for more natural look
        const xOffset = (Math.random() - 0.5) * 10;
        const yOffset = (Math.random() - 0.5) * 10;

        points.push({
            x: Math.cos(angle) * r + radius * 1.2 + xOffset,
            y: Math.sin(angle) * r + radius * 1.2 + yOffset
        });
    }
    return points;
}

function createBlobPath(points) {
    const smooth = 0.3;  // reduced for smoother transitions
    let path = `M ${points[0].x},${points[0].y}`;

    // Create smoother curves by using more control points
    for (let i = 0; i < points.length; i++) {
        const p0 = points[(i - 1 + points.length) % points.length];
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const p3 = points[(i + 2) % points.length];

        // Use four points to calculate control points
        const cp1x = p1.x + (p2.x - p0.x) * smooth;
        const cp1y = p1.y + (p2.y - p0.y) * smooth;
        const cp2x = p2.x - (p3.x - p1.x) * smooth;
        const cp2y = p2.y - (p3.y - p1.y) * smooth;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path + 'Z';
}

function init() {
    // Create flags row container
    let flagsRow = document.querySelector('.flags-row');
    if (!flagsRow) {
        flagsRow = document.createElement('div');
        flagsRow.className = 'flags-row';
        game.parentElement.insertBefore(flagsRow, game);
        
        // Create individual flag containers
        for (let i = 0; i < numMines; i++) {
            const flagContainer = document.createElement('div');
            flagContainer.className = 'flag-container';
            
            const flag = document.createElement('div');
            flag.className = 'draggable-flag';
            flag.textContent = 'x';
            flag.draggable = true;
            flag.addEventListener('dragstart', handleDragStart);
            flag.addEventListener('dragend', handleDragEnd);
            
            flagContainer.appendChild(flag);
            flagsRow.appendChild(flagContainer);
        }
    }

    // Create blob container if it doesn't exist
    let blobContainer = document.querySelector('.blob-container');
    if (!blobContainer) {
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';
        game.parentElement.insertBefore(gameContainer, game);
        gameContainer.appendChild(game);

        blobContainer = document.createElement('div');
        blobContainer.className = 'blob-container';
        gameContainer.appendChild(blobContainer);
    }

    // Generate new blob with adjusted size
    const blobPoints = generateBlobPoints(8, 120);
    const blobPath = createBlobPath(blobPoints);

    blobContainer.innerHTML = `
        <svg viewBox="0 0 300 300" class="blob" preserveAspectRatio="xMidYMid meet">
            <path d="${blobPath}" />
        </svg>
    `;

    // start from scratch on reset
    game.innerHTML = '';
    game.style = `grid-template-columns: repeat( ${width}, 40px);`;
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

function placeMinesAvoiding(safeX, safeY) {
    const MAX_ATTEMPTS = 50;
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
            getNeighbors(safeX, safeY).forEach(([nx, ny]) => {
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

function validateBoard() {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x].mine) {
                const numbers = countNumberedNeighbors(x, y);
                if (numbers < 2) {
                    return false; // reject the board
                }
            }
        }
    }
    return true;
}

function countNumberedNeighbors(x, y) {
    return getNeighbors(x, y).filter(([nx, ny]) => countMines(nx, ny) > 0).length;
}

function countMines(x, y) {
    return getNeighbors(x, y).filter(([nx, ny]) => grid[ny][nx]?.mine).length;
}

function getNeighbors(x, y) {
    return [
        [x - 1, y - 1],
        [x, y - 1],
        [x + 1, y - 1],
        [x - 1, y],
        [x + 1, y],
        [x - 1, y + 1],
        [x, y + 1],
        [x + 1, y + 1],
    ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < width && ny < height);
}

function reveal(x, y, delay) {
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
            if (delay === 0) showMessage("You found some treasure!");

            return;
        }

        if (mineCount > 0) {
            back.textContent = mineCount;
            back.dataset.number = mineCount;
        } else {
            back.classList.add("oasis");
            back.textContent = "🌴";
            getNeighbors(x, y).forEach(([nx, ny]) => reveal(nx, ny, delay + 50));
        }
    }, delay);

    progressiveValidator();
    checkWin();
}

function toggleFlag(x, y, createNewFlag = true, removeFlag = true) {
    const cellData = grid[y][x];
    if (cellData.revealed) return;

    // If we're setting a flag, remove one from the flags row (unless told not to)
    if (!cellData.flagged && removeFlag) {
        const flagsRow = document.querySelector('.flags-row');
        const firstFlagContainer = flagsRow.querySelector('.flag-container');
        if (firstFlagContainer) {
            firstFlagContainer.remove();
        }
    } else if (createNewFlag) {
        // Create new flag container when unflagging
        const flagsRow = document.querySelector('.flags-row');
        const flagContainer = document.createElement('div');
        flagContainer.className = 'flag-container';
        
        const newFlag = document.createElement('div');
        newFlag.className = 'draggable-flag';
        newFlag.textContent = 'x';
        newFlag.draggable = true;
        newFlag.addEventListener('dragstart', handleDragStart);
        newFlag.addEventListener('dragend', handleDragEnd);
        
        flagContainer.appendChild(newFlag);
        flagsRow.appendChild(flagContainer);
    }

    cellData.flagged = !cellData.flagged;

    if (cellData.flagged) {
        cellData.cell.classList.add("flagged");
        cellData.cell.querySelector(".cell-front").textContent = "x"; // add flag icon
    } else {
        cellData.cell.classList.remove("flagged");
        cellData.cell.querySelector(".cell-front").textContent = ""; // remove flag icon
    }

    progressiveValidator();
    checkWin(); // reevaluate win condition
}


let longPressTimer = null;

function handleLongPressStart(event) {
    const x = +event.currentTarget.dataset.x;
    const y = +event.currentTarget.dataset.y;

    longPressTimer = setTimeout(() => {
        toggleFlag(x, y);
    }, 500); // 500ms threshold for long press
}

function handleLongPressEnd() {
    clearTimeout(longPressTimer);
}



function checkWin() {
    const totalNonMines = width * height - numMines;
    const correctlyFlaggedMines = grid.flat().filter(cell => cell.mine && cell.flagged).length;
    const totalFlags = grid.flat().filter(cell => cell.flagged).length;
    const allRevealed = revealedCells === totalNonMines;

    if (correctlyFlaggedMines === numMines && totalFlags === numMines) {
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
            origin: { y: 0.9 }
        });
    }
}

function progressiveValidator() {
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
    const neighbors = getNeighbors(x, y);

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
    const neighbors = getNeighbors(x, y);

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
    const neighbors = getNeighbors(x, y);

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

function simulateGame(testGrid = null) {
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

// Modify findDefiniteSafeCellsInSimulation to be more precise
function findDefiniteSafeCellsInSimulation(x, y, markedMines, simGrid) {
    const mineCount = countMinesInSimulation(x, y, simGrid);
    const neighbors = getNeighbors(x, y);
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
    return getNeighbors(x, y).filter(([nx, ny]) => simGrid[ny][nx]?.mine).length;
}

function revealNeighborsInSimulation(x, y, simGrid) {
    getNeighbors(x, y).forEach(([nx, ny]) => {
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
    const neighbors = getNeighbors(x, y);
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
        const revealedNeighbors = getNeighbors(x, y)
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

function showMessage(message) {
    const messageContainer = document.getElementById("message-container");
    const messageElement = document.getElementById("message");
    messageElement.textContent = message;
    messageContainer.classList.add('visible');
}

document.getElementById("try-again-button").addEventListener("click", () => {
    const messageContainer = document.getElementById("message-container");
    messageContainer.classList.remove('visible');

    // Add animation to flip back the cells
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell, index) => {
        setTimeout(() => {
            cell.classList.remove("revealed");
            if (index === cells.length - 1) {
                revealedCells = 0;
                firstClick = true;
                
                // Reset flags row with animation
                const flagsRow = document.querySelector('.flags-row');
                if (flagsRow) {
                    // Fade out current flags
                    flagsRow.style.opacity = '0';
                    setTimeout(() => {
                        // Clear and recreate flags
                        flagsRow.innerHTML = '';
                        for (let i = 0; i < numMines; i++) {
                            const flagContainer = document.createElement('div');
                            flagContainer.className = 'flag-container';
                            
                            const flag = document.createElement('div');
                            flag.className = 'draggable-flag';
                            flag.textContent = 'x';
                            flag.draggable = true;
                            flag.addEventListener('dragstart', handleDragStart);
                            flag.addEventListener('dragend', handleDragEnd);
                            
                            flagContainer.appendChild(flag);
                            flagsRow.appendChild(flagContainer);
                        }
                        // Fade in new flags
                        flagsRow.style.opacity = '1';
                        setTimeout(init, 300); // Restart the game after flags are reset
                    }, 300);
                }
            }
        }, 10);
    });
});

// Add these new drag and drop handler functions
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', 'flag');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary to allow drop
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e, x, y) {
    e.preventDefault();
    const cellData = grid[y][x];
    
    if (!cellData.revealed && !cellData.flagged) {
        // Remove the entire flag container, not just the draggable flag
        const draggedFlag = document.querySelector('.draggable-flag.dragging');
        if (draggedFlag) {
            draggedFlag.parentElement.remove(); // Remove the container
        }
        toggleFlag(x, y, false, false); // Don't create new flag and don't remove another flag
    }
}

init();
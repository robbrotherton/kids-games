const DIFFICULTY_SETTINGS = {
    easy: { width: 5, height: 4, numMines: 4 },
    medium: { width: 6, height: 5, numMines: 7 },
    hard: { width: 8, height: 6, numMines: 12 }
};

let currentDifficulty = 'easy';
let width = DIFFICULTY_SETTINGS[currentDifficulty].width;
let height = DIFFICULTY_SETTINGS[currentDifficulty].height;
let numMines = DIFFICULTY_SETTINGS[currentDifficulty].numMines;

const game = document.getElementById("game");
let grid = [];
let firstClick = true;
let revealedCells = 0;
let settingsVisible = false;



function init() {
    // Calculate cell size based on difficulty
    const cellSize = Math.min(40, Math.floor(320 / Math.max(width, height))); // 320px is example max game area
    const fontSize = Math.max(1, cellSize / 24); // Scale font with cell size
    
    const style = document.createElement('style');
    style.textContent = `
        .cell {
            width: ${cellSize}px;
            height: ${cellSize}px;
            font-size: ${fontSize}em;
        }
        .cell-front, .cell-back {
            line-height: ${cellSize}px;
        }
        .flag-container {
            width: ${cellSize}px;
            height: ${cellSize}px;
        }
    `;
    document.head.appendChild(style);

    // Ensure container starts in correct position if this is first run
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer && !gameContainer.classList.contains('ready')) {
        gameContainer.classList.add('ready');
    }
    
    // Create flags row container and flags only if they don't exist
    let flagsRow = document.querySelector('.flags-row');
    if (!flagsRow) {
        flagsRow = document.createElement('div');
        flagsRow.className = 'flags-row';
        game.parentElement.insertBefore(flagsRow, game);
    }
    
    // Add any missing flags up to numMines
    const existingFlags = flagsRow.querySelectorAll('.flag-container').length;
    for (let i = existingFlags; i < numMines; i++) {
        const flagContainer = document.createElement('div');
        flagContainer.className = 'flag-container';
        
        const flag = document.createElement('div');
        flag.className = 'draggable-flag';
        flag.textContent = 'x';
        flag.draggable = true;
        flag.addEventListener('dragstart', handleDragStart);
        flag.addEventListener('dragend', handleDragEnd);
        // Add touch events for mobile
        flag.addEventListener('touchstart', handleFlagTouchStart);
        flag.addEventListener('touchmove', handleFlagTouchMove);
        flag.addEventListener('touchend', handleFlagTouchEnd);
        
        flagContainer.appendChild(flag);
        flagsRow.appendChild(flagContainer);
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
        gameContainer.parentElement.appendChild(blobContainer);
    }

    // Simplified blob generation
    const { points: blobPoints, width: blobWidth, height: blobHeight } = generateBlobPoints(width, height);
    const blobPath = createBlobPath(blobPoints);

    blobContainer.innerHTML = `
        <svg viewBox="0 0 ${blobWidth} ${blobHeight}" 
             class="blob" 
             preserveAspectRatio="xMidYMid meet">
            <path d="${blobPath}" />
        </svg>
    `;

    // start from scratch on reset
    game.innerHTML = '';
    game.style = `grid-template-columns: repeat( ${width}, ${cellSize}px);`;
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

    const totalFlags = grid.flat().filter(cell => cell.flagged).length;

    // Prevent adding more flags than the number of mines
    if (!cellData.flagged && totalFlags >= numMines) {
        return;
    }

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
        // Add touch events for mobile
        newFlag.addEventListener('touchstart', handleFlagTouchStart);
        newFlag.addEventListener('touchmove', handleFlagTouchMove);
        newFlag.addEventListener('touchend', handleFlagTouchEnd);
        
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
let wasDragging = false;  // Add this flag
let touchStartTime = 0;   // Add this to track tap duration

function handleLongPressStart(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const x = +event.currentTarget.dataset.x;
    const y = +event.currentTarget.dataset.y;
    
    touchStartTime = Date.now();
    wasDragging = false;

    longPressTimer = setTimeout(() => {
        wasDragging = true;  // Mark that we triggered the long press
        toggleFlag(x, y);
    }, 500);
}

function handleLongPressEnd(event) {
    event.preventDefault();
    event.stopPropagation();
    
    clearTimeout(longPressTimer);
    
    // If it was a short tap (less than 500ms) and not a drag operation
    if (Date.now() - touchStartTime < 500 && !wasDragging) {
        const x = +event.currentTarget.dataset.x;
        const y = +event.currentTarget.dataset.y;
        reveal(x, y, 0);
    }
    
    wasDragging = false;
}

// Add touch handlers for draggable flags
let touchTarget = null;

function handleFlagTouchStart(e) {
    e.preventDefault();
    touchTarget = e.target;
    touchTarget.classList.add('dragging');
}

function handleFlagTouchMove(e) {
    if (!touchTarget) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const cell = elements.find(el => el.classList.contains('cell'));
    
    // Highlight potential drop target
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('drag-over'));
    if (cell) {
        cell.classList.add('drag-over');
    }
}

function handleFlagTouchEnd(e) {
    if (!touchTarget) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const cell = elements.find(el => el.classList.contains('cell'));
    
    if (cell) {
        const x = +cell.dataset.x;
        const y = +cell.dataset.y;
        const cellData = grid[y][x];
        
        if (!cellData.revealed && !cellData.flagged) {
            touchTarget.parentElement.remove();
            toggleFlag(x, y, false, false);
        }
    }
    
    touchTarget.classList.remove('dragging');
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('drag-over'));
    touchTarget = null;
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

    // Clear all flags immediately
    // grid.forEach(row => row.forEach(cell => {
    //     if (cell.flagged) {
    //         cell.flagged = false;
    //         cell.cell.classList.remove("flagged");
    //         cell.cell.querySelector(".cell-front").textContent = "";
    //     }
    // }));

    // Sail away animation
    const gameContainer = document.querySelector('.game-container');
    gameContainer.classList.remove('ready');
    gameContainer.classList.add('sailing-out');

    // After sailing out, prepare new game
    setTimeout(() => {
        // Temporarily disable transitions
        gameContainer.style.transition = 'none';
        
        // Instantly move to right side of screen
        gameContainer.classList.remove('sailing-out');
        gameContainer.classList.add('sailing-in');
        
        // Force reflow
        void gameContainer.offsetHeight;
        
        // Re-enable transitions
        gameContainer.style.transition = '';

        // Reset the grid state
        revealedCells = 0;
        firstClick = true;

        // Create new game board
        const flagsRow = document.querySelector('.flags-row');
        if (flagsRow) {
            // ...existing flag reset code...
        }

        // Initialize new game
        init();

        // Start sail in animation after a tiny delay
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                gameContainer.classList.remove('sailing-in');
                gameContainer.classList.add('ready');
            });
        });
    }, 800);
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

function openSettings() {
    const overlay = document.getElementById('settings-overlay');
    settingsVisible = !settingsVisible;
    
    if (settingsVisible) {
        overlay.classList.add('visible');
    } else {
        overlay.classList.remove('visible');
    }
}

// Add click handler to close settings when clicking outside
document.getElementById('settings-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'settings-overlay') {
        settingsVisible = false;
        e.target.classList.remove('visible');
    }
});

// Add new function to handle difficulty changes
function changeDifficulty(difficulty) {
    currentDifficulty = difficulty;
    width = DIFFICULTY_SETTINGS[difficulty].width;
    height = DIFFICULTY_SETTINGS[difficulty].height;
    numMines = DIFFICULTY_SETTINGS[difficulty].numMines;
    
    // Clear current game state
    revealedCells = 0;
    firstClick = true;
    grid = [];
    
    // Clear existing flags
    const flagsRow = document.querySelector('.flags-row');
    if (flagsRow) {
        flagsRow.innerHTML = ''; // Remove all existing flags
    }
    
    // Update game board
    const gameContainer = document.querySelector('.game-container');
    gameContainer.classList.remove('ready');
    gameContainer.classList.add('sailing-out');

    setTimeout(() => {
        gameContainer.style.transition = 'none';
        gameContainer.classList.remove('sailing-out');
        gameContainer.classList.add('sailing-in');
        
        void gameContainer.offsetHeight;
        gameContainer.style.transition = '';

        // Initialize new game with updated settings
        init();

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                gameContainer.classList.remove('sailing-in');
                gameContainer.classList.add('ready');
            });
        });
    }, 800);
}

// Add event listeners for difficulty radio buttons
document.querySelectorAll('.difficulty-options input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        changeDifficulty(e.target.value);
        // Close settings panel
        settingsVisible = false;
        document.getElementById('settings-overlay').classList.remove('visible');
    });
});

init();
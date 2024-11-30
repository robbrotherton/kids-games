const width = 5;
const height = 5;
const numMines = 4;

const game = document.getElementById("game");
let grid = [];
let firstClick = true;
let revealedCells = 0;

function init() {

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
    
            grid[y][x] = { cell, mine: false, revealed: false, flagged: false, x, y };
    
            // add click and flagging listeners
            cell.addEventListener("click", () => reveal(x, y, 0));
            cell.addEventListener("contextmenu", e => {
                e.preventDefault(); // prevent context menu
                toggleFlag(x, y);
            });
            cell.addEventListener("touchstart", handleLongPressStart);
            cell.addEventListener("touchend", handleLongPressEnd);
        }
    }
    console.log("Grid after initialization:", grid);    
}


function generateValidMinePlacements() {
    const unrevealedCells = [];
    const constraints = [];

    // collect all unrevealed cells and constraints
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = grid[y][x];
            if (!cell.revealed && !cell.flagged) {
                unrevealedCells.push([x, y]);
            } else if (cell.revealed && countMines(x, y) > 0) {
                constraints.push({ x, y, mineCount: countMines(x, y) });
            }
        }
    }

    // recursively generate all valid placements
    const validPlacements = [];
    function backtrack(index, placement) {
        if (index === unrevealedCells.length) {
            // validate the current placement against all constraints
            if (isPlacementValid(new Set(placement), constraints)) {
                validPlacements.push(new Set(placement));
            }
            return;
        }

        const [x, y] = unrevealedCells[index];
        // try placing a mine
        placement.push(`${x},${y}`);
        backtrack(index + 1, placement);
        placement.pop();

        // try leaving it empty
        backtrack(index + 1, placement);
    }

    backtrack(0, []);
    return validPlacements;
}


function isPlacementValid(placement, constraints) {
    for (const { x, y, mineCount } of constraints) {
        const neighbors = getNeighbors(x, y);
        const actualMines = neighbors.filter(([nx, ny]) => placement.has(`${nx},${ny}`)).length;
        if (actualMines !== mineCount) {
            return false; // constraint violated
        }
    }
    return true;
}



function calculateProbabilities(validPlacements) {
    const probabilities = {};
    const unrevealedCells = grid.flat().filter(cell => !cell.revealed && !cell.flagged);

    unrevealedCells.forEach(cell => {
        const key = `${cell.x},${cell.y}`;
        probabilities[key] = 0;
    });

    validPlacements.forEach(placement => {
        placement.forEach(cellKey => {
            probabilities[cellKey]++;
        });
    });

    // normalize probabilities
    const totalPlacements = validPlacements.length;
    Object.keys(probabilities).forEach(key => {
        probabilities[key] /= totalPlacements;
        const [x, y] = key.split(",").map(Number);

        // update cell UI to show probability
        const cell = grid[y][x];
        if (!cell.revealed) {
            cell.cell.querySelector(".cell-front").textContent = `${(probabilities[key] * 100).toFixed(1)}%`;
        }
    });

    return probabilities;
}



function placeMinesAndValidate(safeX, safeY) {
    let attempts = 0;

    while (true) {
        console.log(`placeMinesAndValidate, attempt ${attempts}`);
        if (attempts > 100) {
            console.error(`Failed to generate a solvable board after ${attempts} attempts.`);
            return false; // signal failure
        }

        clearMines(); // clear previous mines
        placeMinesAvoiding(safeX, safeY); // place mines around the safe zone

        return true;
        // optional: check hint density (ensures all non-mine cells have clues)
        if (!hasEnoughHints()) {
            attempts++;
            continue; // retry placement if hint density is insufficient
        }


        // validate the board using the new global reasoning approach
        if (validateBoard(safeX, safeY)) {
            return true; // solvable board generated
        }

        attempts++;
    }
}


function hasEnoughHints() {
    let hasClues = true;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = grid[y][x];
            if (!cell.mine && countMines(x, y) === 0) {
                // console.warn(`Cell with no clues: (${x}, ${y})`);
                hasClues = false; // at least one non-mine cell has no neighboring mines
            }
        }
    }

    console.log("Hint density check:", hasClues);
    return hasClues;
}





function placeMinesAvoiding(safeX, safeY) {
    const safeZone = new Set();
    const regions = Math.sqrt(numMines); // divide into roughly square regions

    // create 3x3 safe zone
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = safeX + dx;
            const ny = safeY + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                safeZone.add(`${nx},${ny}`);
            }
        }
    }

    // divide board into regions
    const validCells = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (!safeZone.has(`${x},${y}`)) {
                validCells.push([x, y]);
            }
        }
    }

    shuffleArray(validCells);

    // proportionally place mines
    for (let i = 0; i < numMines; i++) {
        const [x, y] = validCells[i];
        grid[y][x].mine = true;
    }
}



function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}




function findRandomMine() {
    const mines = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x].mine) mines.push([x, y]);
        }
    }
    return mines[Math.floor(Math.random() * mines.length)];
}


function clearMines() {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            grid[y][x].mine = false;
        }
    }
}

function validateBoard(safeX, safeY) {
    const revealed = new Set();
    const flaggedMines = new Set();
    const toReveal = [[safeX, safeY]];
    let isSolvable = true;

    while (toReveal.length > 0) {
        const [x, y] = toReveal.pop();
        const key = `${x},${y}`;
        if (revealed.has(key)) continue;

        revealed.add(key);

        // compute probabilities
        const validPlacements = generateValidMinePlacements();
        const probabilities = calculateProbabilities(validPlacements);

        // deduce safe cells and mines
        let safeFound = false;
        Object.entries(probabilities).forEach(([key, probability]) => {
            const [nx, ny] = key.split(",").map(Number);

            if (probability === 0) {
                toReveal.push([nx, ny]);
                safeFound = true;
            } else if (probability === 1) {
                flaggedMines.add(key);
                grid[ny][nx].flagged = true;
            }
        });

        if (!safeFound && toReveal.length === 0) {
            isSolvable = false;
            break;
        }
    }

    // update the solvability UI
    const solvabilityStatus = document.getElementById("solvability-status");
    if (isSolvable) {
        solvabilityStatus.textContent = "Board is solvable!";
        solvabilityStatus.style.color = "green";
    } else {
        solvabilityStatus.textContent = "Board is UNSOLVABLE.";
        solvabilityStatus.style.color = "red";
    }

    const totalNonMines = width * height - numMines;
    return revealed.size === totalNonMines && isSolvable;
}







function countNumberedNeighbors(x, y) {
    return getNeighbors(x, y).filter(([nx, ny]) => countMines(nx, ny) > 0).length;
}

function countMines(x, y) {
    const neighbors = getNeighbors(x, y);
    const mineCount = neighbors.filter(([nx, ny]) => grid[ny][nx]?.mine).length;
    // console.log(`CountMines (${x}, ${y}):`, mineCount);
    return mineCount;
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
        placeMinesAndValidate(x, y);
        firstClick = false;
    }

    cellData.revealed = true;
    revealedCells++;
    const back = cellData.cell.querySelector(".cell-back");
    const mineCount = countMines(x, y);

    setTimeout(() => {
        cellData.cell.classList.add("revealed");

        if (cellData.mine) {
            back.textContent = "🌵";
            back.classList.add("mine");
            if (delay === 0) showMessage("Ouch! You hit a cactus!");
            return;
        }

        if (mineCount > 0) {
            back.textContent = mineCount;
            back.dataset.number = mineCount;
        } else {
            back.classList.add("oasis");
            getNeighbors(x, y).forEach(([nx, ny]) => reveal(nx, ny, delay + 50));
        }

        // update probabilities and solvability
        const validPlacements = generateValidMinePlacements();
        calculateProbabilities(validPlacements);
        validateBoard(x, y);
    }, delay);
}

function toggleFlag(x, y) {
    const cellData = grid[y][x];
    if (cellData.revealed) return; // can't flag revealed cells

    cellData.flagged = !cellData.flagged;

    if (cellData.flagged) {
        cellData.cell.classList.add("flagged");
        cellData.cell.querySelector(".cell-front").textContent = "🚩"; // add flag icon
    } else {
        cellData.cell.classList.remove("flagged");
        cellData.cell.querySelector(".cell-front").textContent = ""; // remove flag icon
    }

    // update probabilities and solvability
    const validPlacements = generateValidMinePlacements();
    calculateProbabilities(validPlacements);
    validateBoard(x, y);
}



// function toggleFlag(x, y) {
//     const cellData = grid[y][x];
//     if (cellData.revealed) return; // can't flag revealed cells

//     cellData.flagged = !cellData.flagged;

//     if (cellData.flagged) {
//         cellData.cell.classList.add("flagged");
//         cellData.cell.querySelector(".cell-front").textContent = "🚩"; // add flag icon
//     } else {
//         cellData.cell.classList.remove("flagged");
//         cellData.cell.querySelector(".cell-front").textContent = ""; // remove flag icon
//     }

//     checkWin(); // reevaluate win condition
// }


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

    if (revealedCells === totalNonMines && correctlyFlaggedMines === numMines && totalFlags === numMines) {
        showMessage("Congratulations! You found all the treasure!");
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
    if (!cellData.revealed && !cellData.flagged) {
        cellData.cell.classList.add("safe"); // add green background
    }
}


function showMessage(message) {
    const messageContainer = document.getElementById("message-container");
    const messageElement = document.getElementById("message");
    messageElement.textContent = message;
    messageContainer.style.display = "block";
}

document.getElementById("try-again-button").addEventListener("click", () => {
    const messageContainer = document.getElementById("message-container");
    messageContainer.style.display = "none";

    // Add animation to flip back the cells
    const cells = document.querySelectorAll(".cell");
    cells.forEach((cell, index) => {
        setTimeout(() => {
            cell.classList.remove("revealed");
            if (index === cells.length - 1) {
                revealedCells = 0;
                firstClick = true;
                setTimeout(init, 300); // Restart the game after the animation
            }
        }, 10);
    });
});

document.getElementById("revise-board-button").addEventListener("click", () => {
    const solvabilityStatus = document.getElementById("solvability-status");
    solvabilityStatus.textContent = "Checking solvability...";
    solvabilityStatus.style.color = "black";

    // reset the board and retry placement
    firstClick = true;
    revealedCells = 0;
    init(); // reinitialize the grid
});


init();
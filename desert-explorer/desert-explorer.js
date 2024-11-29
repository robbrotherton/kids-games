const width = 6;
const height = 6;
const numMines = 4;

const game = document.getElementById("game");
let grid = [];
let firstClick = true;

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

            grid[y][x] = { cell, mine: false, revealed: false, flagged: false };
            cell.addEventListener("click", () => reveal(x, y, 0));
        }
    }
}

function placeMinesAvoiding(safeX, safeY) {
    let placedMines = 0;

    while (placedMines < numMines) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        const isSafeZone = Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1;

        if (!grid[y][x].mine && !isSafeZone) {
            grid[y][x].mine = true;
            placedMines++;
        }
    }

    // validate the board and retry if not solvable
    if (!validateBoard()) {
        clearMines();
        placeMinesAvoiding(safeX, safeY);
    }
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
    }

    cellData.revealed = true;
    const back = cellData.cell.querySelector(".cell-back");
    const mineCount = countMines(x, y);

    setTimeout(() => {
        cellData.cell.classList.add("revealed");

        if (cellData.mine) {
            back.textContent = "🌵";
            back.classList.add("mine");
            //   alert("game over!");
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
    }, delay);
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
                firstClick = true;
                setTimeout(init, 300); // Restart the game after the animation
            }
        }, 10);
    });
});

init();
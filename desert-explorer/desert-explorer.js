const width = 10;
const height = 10;
const numMines = 20;

const game = document.getElementById("game");
let grid = [];
const mines = new Set();

function init() {
    // Clear the existing game board
    game.innerHTML = '';
    grid = [];
    mines.clear();

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
            grid[y][x] = { cell, revealed: false, mine: false };

            // Add click event listener to the cell
            cell.addEventListener("click", () => reveal(x, y, 0));
        }
    }

    // Place mines randomly
    while (mines.size < numMines) {
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);
        if (!grid[y][x].mine) {
            grid[y][x].mine = true;
            mines.add(`${x},${y}`);
        }
    }
}

function countMines(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const nx = x + dx;
            const ny = y + dy;
            if (
                nx >= 0 &&
                ny >= 0 &&
                nx < width &&
                ny < height &&
                grid[ny][nx].mine
            ) {
                count++;
            }
        }
    }
    return count;
}

function reveal(x, y, delay) {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const cellData = grid[y][x];
    if (cellData.revealed) return;

    cellData.revealed = true;
    cellData.delay = delay;
    setTimeout(() => {
        cellData.cell.classList.add("revealed");
        const back = cellData.cell.querySelector(".cell-back");

        if (cellData.mine) {
            cellData.cell.classList.add("mine");
            back.textContent = "🌵"; // cactus emoji
            if (delay === 0) showMessage("Ouch! You hit a cactus!");
            return;
        }

        const mineCount = countMines(x, y);
        if (mineCount > 0) {
            back.textContent = mineCount;
        } else {
            // mark as an oasis
            back.classList.add("oasis");
            // back.textContent = "💧"; // oasis drop
            // recursively reveal neighbors with increasing delay
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx !== 0 || dy !== 0) {
                        reveal(x + dx, y + dy, delay + 20);
                    }
                }
            }
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
                setTimeout(init, 300); // Restart the game after the animation
            }
        }, 10);
    });
});

init();
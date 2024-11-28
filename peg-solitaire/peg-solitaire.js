const board = document.getElementById("game");

// initial board configuration: 7x7 grid with nulls as invalid spaces
const initialState = [
    [null, null, 1, 1, 1, null, null],
    [null, null, 1, 1, 1, null, null],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [null, null, 1, 1, 1, null, null],
    [null, null, 1, 1, 1, null, null],
];

let state = JSON.parse(JSON.stringify(initialState)); // deep copy

// generate the board
function drawBoard() {
    board.innerHTML = ""; // clear previous board
    state.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell === null) {
                const placeholder = document.createElement("div");
                placeholder.style.width = "50px";
                placeholder.style.height = "50px";
                board.appendChild(placeholder);
                return;
            }

            const hole = document.createElement("div");
            hole.classList.add("hole");
            hole.dataset.row = rowIndex;
            hole.dataset.col = colIndex;

            if (cell === 1) {
                const peg = document.createElement("div");
                peg.classList.add("peg");
                peg.addEventListener("mousedown", handlePegPickup);
                peg.addEventListener("touchstart", handlePegPickup);
                hole.appendChild(peg);
            }

            board.appendChild(hole);
        });
    });
}

let selectedPeg = null;
let dragPeg = null;

function handlePegPickup(e) {
    e.preventDefault();
    selectedPeg = e.target;
    const { row, col } = selectedPeg.parentElement.dataset;
    
    // Create drag peg
    dragPeg = selectedPeg.cloneNode(true);
    dragPeg.classList.add("dragging");
    document.body.appendChild(dragPeg);
    
    // Hide original peg
    selectedPeg.style.visibility = "hidden";
    
    // Highlight original hole
    selectedPeg.parentElement.classList.add("highlight");
    
    // Add move and end listeners
    document.addEventListener("mousemove", handlePointerMove);
    document.addEventListener("touchmove", handlePointerMove);
    document.addEventListener("mouseup", handlePegDrop);
    document.addEventListener("touchend", handlePegDrop);
    
    // Position drag peg initially
    updateDragPegPosition(e.clientX || e.touches[0].clientX, e.clientY || e.touches[0].clientY);
}

function updateDragPegPosition(x, y) {
    if (dragPeg) {
        dragPeg.style.left = `${x - 20}px`;
        dragPeg.style.top = `${y - 20}px`;
    }
}

function handlePointerMove(e) {
    e.preventDefault();
    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;
    updateDragPegPosition(x, y);
    
    // Highlight valid holes
    const holeElement = document.elementFromPoint(x, y);
    if (holeElement && holeElement.classList.contains("hole")) {
        const { row, col } = holeElement.dataset;
        const fromRow = selectedPeg.parentElement.dataset.row;
        const fromCol = selectedPeg.parentElement.dataset.col;
        
        document.querySelectorAll(".hole.highlight").forEach(h => {
            if (h !== selectedPeg.parentElement) h.classList.remove("highlight");
        });
        
        if (isValidMove(fromRow, fromCol, row, col)) {
            holeElement.classList.add("highlight");
        }
    }
}

function handlePegDrop(e) {
    const x = e.clientX || e.changedTouches?.[0].clientX;
    const y = e.clientY || e.changedTouches?.[0].clientY;
    const holeElement = document.elementFromPoint(x, y);
    
    if (holeElement?.classList.contains("hole")) {
        const { row, col } = holeElement.dataset;
        const fromRow = selectedPeg.parentElement.dataset.row;
        const fromCol = selectedPeg.parentElement.dataset.col;
        
        if (isValidMove(fromRow, fromCol, row, col)) {
            // Make the move
            state[fromRow][fromCol] = 0;
            state[(+fromRow + +row) / 2][(+fromCol + +col) / 2] = 0;
            state[row][col] = 1;
            drawBoard();
            
            // Check game state after move
            checkGameState();
        } else {
            selectedPeg.style.visibility = "visible";
        }
    } else {
        selectedPeg.style.visibility = "visible";
    }
    
    // Cleanup
    dragPeg.remove();
    dragPeg = null;
    selectedPeg = null;
    document.querySelectorAll(".hole.highlight").forEach(h => h.classList.remove("highlight"));
    
    document.removeEventListener("mousemove", handlePointerMove);
    document.removeEventListener("touchmove", handlePointerMove);
    document.removeEventListener("mouseup", handlePegDrop);
    document.removeEventListener("touchend", handlePegDrop);
}

function checkGameState() {
    const pegsLeft = countPegs();
    console.log(pegsLeft);
    const movesLeft = hasValidMovesRemaining();
    
    if (!movesLeft) {
        if (pegsLeft === 1) {
            showGameMessage("You won! 🎉");
        } else {
            showGameMessage(`Game over! ${pegsLeft} pegs remaining`);
        }
    }
}

function countPegs() {
    return state.flat().filter(cell => cell === 1).length;
}

function hasValidMovesRemaining() {
    for (let fromRow = 0; fromRow < state.length; fromRow++) {
        for (let fromCol = 0; fromCol < state[0].length; fromCol++) {
            if (state[fromRow][fromCol] !== 1) continue;
            
            // Check all possible jump directions
            const directions = [
                [0, 2], [0, -2], [2, 0], [-2, 0]
            ];
            
            for (const [dRow, dCol] of directions) {
                const toRow = fromRow + dRow;
                const toCol = fromCol + dCol;
                
                // Check bounds before validating move
                if (toRow >= 0 && toRow < state.length && 
                    toCol >= 0 && toCol < state[0].length) {
                    if (isValidMove(fromRow, fromCol, toRow, toCol)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

function showGameMessage(message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'game-message';
    messageEl.textContent = message;
    document.body.appendChild(messageEl);
    
    setTimeout(() => messageEl.classList.add('visible'), 100);
    
    // Add replay button
    const replayBtn = document.createElement('button');
    replayBtn.textContent = 'Play Again';
    replayBtn.onclick = () => {
        state = JSON.parse(JSON.stringify(initialState));
        drawBoard();
        messageEl.remove();
    };
    messageEl.appendChild(replayBtn);
}

// helper to check valid moves
function isValidMove(fromRow, fromCol, toRow, toCol) {
    fromRow = parseInt(fromRow);
    fromCol = parseInt(fromCol);
    toRow = parseInt(toRow);
    toCol = parseInt(toCol);

    // Check bounds
    if (toRow < 0 || toRow >= state.length || 
        toCol < 0 || toCol >= state[0].length) {
        return false;
    }

    // Check target is empty
    if (state[toRow][toCol] !== 0) return false;

    const dRow = Math.abs(toRow - fromRow);
    const dCol = Math.abs(toCol - fromCol);

    if ((dRow === 2 && dCol === 0) || (dRow === 0 && dCol === 2)) {
        const jumpedRow = (fromRow + toRow) / 2;
        const jumpedCol = (fromCol + toCol) / 2;
        return state[jumpedRow][jumpedCol] === 1; // must jump over a peg
    }

    return false;
}

// initial draw
drawBoard();

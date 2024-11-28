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
                peg.draggable = true;
                peg.addEventListener("dragstart", handleDragStart);
                peg.addEventListener("dragend", () => peg.classList.remove("dragging"));
                hole.appendChild(peg);
            }

            hole.addEventListener("dragover", handleDragOver);
            hole.addEventListener("dragleave", handleDragLeave); // remove highlight on leave
            hole.addEventListener("drop", handleDrop);

            board.appendChild(hole);
        });
    });
}



// drag and drop handlers
let draggedPeg = null;

function handleDragStart(event) {
    draggedPeg = event.target;
    const { row, col } = draggedPeg.parentElement.dataset;
    draggedPeg.dataset.row = row;
    draggedPeg.dataset.col = col;

    // add dragging effect
    draggedPeg.classList.add("dragging");

    // highlight the original hole
    const originalHole = document.querySelector(
        `.hole[data-row="${row}"][data-col="${col}"]`
    );
    originalHole.classList.add("highlight");

    // hide the peg after drag starts
    setTimeout(() => {
        draggedPeg.style.visibility = "hidden"; // hide it but keep its space intact
    }, 0);
}



function handleDrop(event) {
    const target = event.target;
    const { row, col } = target.dataset;
  
    // clear highlight from the original hole
    const originalHole = document.querySelector(
      `.hole[data-row="${draggedPeg.dataset.row}"][data-col="${draggedPeg.dataset.col}"]`
    );
    originalHole.classList.remove("highlight");
  
    // Ensure the target is a valid hole
    if (row !== undefined && col !== undefined && isValidMove(draggedPeg.dataset.row, draggedPeg.dataset.col, row, col)) {
      const fromRow = parseInt(draggedPeg.dataset.row);
      const fromCol = parseInt(draggedPeg.dataset.col);
      const toRow = parseInt(row);
      const toCol = parseInt(col);
  
      // make the move
      state[fromRow][fromCol] = 0;
      state[(fromRow + toRow) / 2][(fromCol + toCol) / 2] = 0; // remove jumped peg
      state[toRow][toCol] = 1;
  
      drawBoard();
    }
  
    // reset visibility and dragging state
    draggedPeg.style.visibility = "visible";
    draggedPeg.classList.remove("dragging");
    draggedPeg = null;
  }
  


function handleDragOver(event) {
    event.preventDefault();
    const { row, col } = event.target.dataset;

    if (isValidMove(draggedPeg.dataset.row, draggedPeg.dataset.col, row, col)) {
        event.target.classList.add("highlight");
    }
}

function handleDragEnd() {
    // ensure peg is shown again if drop is invalid
    draggedPeg.style.display = "";
    draggedPeg.classList.remove("dragging");

    // remove highlight from original hole
    const originalHole = document.querySelector(
        `.hole[data-row="${draggedPeg.dataset.row}"][data-col="${draggedPeg.dataset.col}"]`
    );
    originalHole.classList.remove("highlight");
    draggedPeg = null;
}


function handleDragLeave(event) {
    event.target.classList.remove("highlight");
}


// helper to check valid moves
function isValidMove(fromRow, fromCol, toRow, toCol) {
    fromRow = parseInt(fromRow);
    fromCol = parseInt(fromCol);
    toRow = parseInt(toRow);
    toCol = parseInt(toCol);

    if (state[toRow][toCol] !== 0) return false; // must drop in an empty hole

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

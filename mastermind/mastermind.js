const gameBoard = document.getElementById("gameBoard");
const colorControls = document.getElementById("colorControls");
const feedback = document.getElementById("feedback");
const winMessage = document.getElementById("winMessage");
const colors = ["red", "blue", "yellow", "green", "purple", "orange"]; // now expandable
const codeLength = 4;
const maxAttempts = 10;
let currentGuess = [];
let currentRow = 0;

// generate the secret code
const secretCode = Array.from({ length: codeLength }, () => 
  colors[Math.floor(Math.random() * colors.length)]
);

// create the game board
function initBoard() {
    for (let i = 0; i < maxAttempts; i++) {
        const rowContainer = document.createElement("div");
        rowContainer.classList.add("row-container");
        
        // Create slots for guesses
        const guessContainer = document.createElement("div");
        guessContainer.classList.add("guess-container");
        guessContainer.style.display = "flex";
        guessContainer.style.gap = "10px";
        
        for (let j = 0; j < codeLength; j++) {
            const slot = document.createElement("div");
            slot.classList.add("slot");
            slot.dataset.row = i;
            slot.dataset.col = j;
            guessContainer.appendChild(slot);
        }
        
        // Create pegs container
        const pegsContainer = document.createElement("div");
        pegsContainer.classList.add("pegs-container");
        for (let k = 0; k < codeLength; k++) {
            const peg = document.createElement("div");
            peg.classList.add("peg");
            pegsContainer.appendChild(peg);
        }
        
        rowContainer.appendChild(guessContainer);
        rowContainer.appendChild(pegsContainer);
        gameBoard.appendChild(rowContainer);
    }
}

function initColorControls() {
    colors.forEach(color => {
        const colorBtn = document.createElement("div");
        colorBtn.classList.add("color");
        colorBtn.style.backgroundColor = color;
        colorBtn.dataset.color = color;
        colorBtn.addEventListener("click", () => handleColorClick(colorBtn));
        colorControls.appendChild(colorBtn);
    });
}

function handleColorClick(colorBtn) {
    if (currentGuess.length < codeLength) {
        const nextSlot = gameBoard.querySelector(
            `.slot[data-row="${currentRow}"]:not(.filled)`
        );
        if (nextSlot) {
            nextSlot.style.backgroundColor = colorBtn.dataset.color;
            nextSlot.classList.add("filled");
            currentGuess.push(colorBtn.dataset.color);
        }
    }
}

function checkGuess(guess) {
    let exactMatches = 0;
    let colorMatches = 0;
    const tempCode = [...secretCode];
    const tempGuess = [...guess];

    // Check exact matches
    for (let i = 0; i < codeLength; i++) {
        if (tempGuess[i] === tempCode[i]) {
            exactMatches++;
            tempCode[i] = null;
            tempGuess[i] = null;
        }
    }

    // Check color matches
    tempGuess.forEach((color, idx) => {
        if (color && tempCode.includes(color)) {
            colorMatches++;
            tempCode[tempCode.indexOf(color)] = null;
        }
    });

    // Update pegs
    const pegsContainer = gameBoard.children[currentRow].querySelector(".pegs-container");
    const pegs = pegsContainer.children;
    let pegIndex = 0;
    
    // Add black pegs for exact matches
    for (let i = 0; i < exactMatches; i++) {
        pegs[pegIndex++].classList.add("black");
    }
    
    // Add white pegs for color matches
    for (let i = 0; i < colorMatches; i++) {
        pegs[pegIndex++].classList.add("white");
    }

    return exactMatches === codeLength;
}

// Modify check button event listener
document.getElementById("checkButton").addEventListener("click", () => {
    if (currentGuess.length === codeLength) {
        const isWin = checkGuess(currentGuess);
        if (isWin) {
            winMessage.textContent = "You win! 🎉";
            return;
        }
        if (++currentRow >= maxAttempts) {
            winMessage.textContent = `Game over! The code was: ${secretCode.join(", ")}`;
            return;
        }
        currentGuess = [];
    } else {
        feedback.textContent = "Please fill all slots before checking!";
    }
});

// Initialize the game
initBoard();
initColorControls();
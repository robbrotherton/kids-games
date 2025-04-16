const gameBoard = document.getElementById("gameBoard");
const colorControls = document.getElementById("colorControls");
const feedback = document.getElementById("feedback");
const winMessage = document.getElementById("winMessage");
// const colors = ["red", "blue", "yellow", "green", "purple", "orange"]; // now expandable
const colors = ["red", "blue", "yellow", "green"]; // now expandable
let codeLength = 4;
const maxAttempts = 10;
let currentGuess = [];
let currentRow = 0;
let settingsPanelOpen = false;
const availableColors = ["red", "blue", "yellow", "green", "purple", "orange"];


// generate the secret code
const secretCode = Array.from({ length: codeLength }, () => 
  colors[Math.floor(Math.random() * colors.length)]
);
console.log("Secret Code:", secretCode); // For debugging purposes

// create the game board
function initBoard() {
    // Create the indicator first, before any rows
    const indicator = document.createElement("div");
    indicator.classList.add("row-indicator");
    gameBoard.appendChild(indicator);

    for (let i = 0; i < maxAttempts; i++) {
        const rowContainer = document.createElement("div");
        rowContainer.classList.add("row-container");
        
        // Create slots for guesses
        const guessContainer = document.createElement("div");
        guessContainer.classList.add("guess-container");
        guessContainer.style.display = "flex";
        guessContainer.style.gap = "2px";
        
        for (let j = 0; j < codeLength; j++) {
            const slot = document.createElement("div");
            slot.classList.add("slot");
            slot.dataset.row = i;
            slot.dataset.col = j;
            // Add click event listener to allow removing a color
            slot.addEventListener("click", handleSlotClick);
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


function handleSlotClick(event) {
    const slot = event.target;
    const row = parseInt(slot.dataset.row);
    const col = parseInt(slot.dataset.col);
    
    // Only allow clicking slots in the current row that have been filled
    if (row === currentRow && slot.classList.contains("filled")) {
        // Find the color position in the currentGuess array
        // Since the slots are filled in order, the column number corresponds to the position
        
        // Remove the color from the currentGuess array
        currentGuess.splice(col, 1);
        
        // Clear the clicked slot
        slot.style.backgroundColor = "";
        slot.classList.remove("filled");
        
        // Need to reset all slots after this one
        const currentRowSlots = gameBoard.querySelectorAll(`.slot[data-row="${currentRow}"]`);
        
        // Clear all slots from this position to the end of the row
        for (let i = col + 1; i < codeLength; i++) {
            if (currentRowSlots[i].classList.contains("filled")) {
                currentRowSlots[i].style.backgroundColor = "";
                currentRowSlots[i].classList.remove("filled");
            }
        }
        
        // Rebuild the currentGuess array with remaining colors
        const filledSlots = gameBoard.querySelectorAll(`.slot[data-row="${currentRow}"].filled`);
        currentGuess = Array.from(filledSlots).map(s => {
            // Extract the color from the backgroundColor style
            const bgColor = s.style.backgroundColor;
            // Convert to a simple color name if needed
            return bgColor.replace("rgb(255, 0, 0)", "red")
                         .replace("rgb(0, 0, 255)", "blue")
                         .replace("rgb(255, 255, 0)", "yellow")
                         .replace("rgb(0, 128, 0)", "green");
        });
        
        // Update the button state
        const checkButton = document.getElementById("checkButton");
        checkButton.classList.remove("active");
    }
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
            
            // Toggle active class when guess is complete
            const checkButton = document.getElementById("checkButton");
            if (currentGuess.length === codeLength) {
                checkButton.classList.add("active");
            }
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

    // Update pegs - Fix the selector to skip the indicator
    const rowContainers = gameBoard.getElementsByClassName('row-container');
    const pegsContainer = rowContainers[currentRow].querySelector(".pegs-container");
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

function resetGame() {
    // Reset game state
    currentGuess = [];
    currentRow = 0;
    
    // Generate new secret code using current settings
    secretCode.length = 0;
    secretCode.push(...Array.from({ length: codeLength }, () => 
        colors[Math.floor(Math.random() * colors.length)]
    ));
    console.log("New Secret Code:", secretCode); // For debugging purposes
    
    // Clear the board
    gameBoard.innerHTML = '';
    colorControls.innerHTML = '';
    
    // Reset the footer
    document.getElementById("bottom-bar").innerHTML = `
        <button id="checkButton" class="check-button baumans-regular">CHECK GUESS</button>
    `;
    
    // Add check button listener
    document.getElementById("checkButton").addEventListener("click", handleCheckButton);
    
    // Reinitialize the game
    initBoard();
    initColorControls();
}

// Extract check button logic to reusable function
function handleCheckButton() {
    if (currentGuess.length === codeLength) {
        const isWin = checkGuess(currentGuess);
        if (isWin) {
            const footer = document.getElementById("bottom-bar");
            const numGuesses = currentRow + 1;
            
            footer.innerHTML = `
                <div class="win-container">
                    <div class="win-message baumans-regular">YOU WON IN ${numGuesses} ${numGuesses === 1 ? 'GUESS' : 'GUESSES'}! <button id="try-again-button"><img src="../assets/refresh-button.png"></button></div>
                </div>
            `;

            // Add click handler to try-again button
            document.getElementById("try-again-button").addEventListener("click", resetGame);

            confetti({
                particleCount: 200,
                spread: 50,
                // height: 100,
                origin: { y: 0.9 }
            });
            
            return;
        }
        if (++currentRow >= maxAttempts) {
            const footer = document.getElementById("bottom-bar");
            footer.innerHTML = `
                <div class="game-over-container">
                    <div class="game-over-message baumans-regular">GAME OVER! THE CODE WAS: ${secretCode.map(color => 
                        `<span class="code-reveal" style="background-color: ${color}"></span>`
                    ).join("")} <button id="try-again-button"><img src="../assets/refresh-button.png"></button></div>
                </div>
            `;
            
            // Add click handler to try-again button
            document.getElementById("try-again-button").addEventListener("click", resetGame);
            return;
        }

        // Move indicator and reset button state
        const indicator = document.querySelector(".row-indicator");
        const rowHeight = 60; // height of a row (50px) + gap (10px)
        indicator.style.transform = `translateY(${currentRow * rowHeight}px)`;
        currentGuess = [];
        document.getElementById("checkButton").classList.remove("active"); // Add this
    } else {
        feedback.textContent = "Please fill all slots before checking!";
    }
}

function toggleSettingsPanel() {
    if (settingsPanelOpen) {
        // Close the panel if it's open
        const existingPanel = document.getElementById("settings-panel");
        if (existingPanel) {
            existingPanel.remove();
        }
        settingsPanelOpen = false;
    } else {
        // Create settings panel
        const settingsPanel = document.createElement("div");
        settingsPanel.id = "settings-panel";
        settingsPanel.className = "settings-panel";
        
        // Create panel contents
        settingsPanel.innerHTML = `
            <div class="settings-header">
                <h3 class="baumans-regular">Settings</h3>
                <button id="close-settings" class="close-button">×</button>
            </div>
            <div class="settings-content">
                <div class="setting-group">
                    <label class="setting-label baumans-regular">Number of Colors:</label>
                    <div class="setting-control">
                        <input type="range" id="color-count" min="2" max="6" value="${colors.length}" />
                        <span id="color-count-value" class="setting-value baumans-regular">${colors.length}</span>
                    </div>
                </div>
                <div class="setting-group">
                    <label class="setting-label baumans-regular">Code Length:</label>
                    <div class="setting-control">
                        <input type="range" id="code-length" min="3" max="4" value="${codeLength}" />
                        <span id="code-length-value" class="setting-value baumans-regular">${codeLength}</span>
                    </div>
                </div>
                <button id="apply-settings" class="apply-button baumans-regular">Apply & Restart</button>
            </div>
        `;
        
        document.body.appendChild(settingsPanel);
        
        // Add event listeners for settings controls
        document.getElementById("color-count").addEventListener("input", (e) => {
            document.getElementById("color-count-value").textContent = e.target.value;
        });
        
        document.getElementById("code-length").addEventListener("input", (e) => {
            document.getElementById("code-length-value").textContent = e.target.value;
        });
        
        // Close button functionality
        document.getElementById("close-settings").addEventListener("click", toggleSettingsPanel);
        
        // Apply button functionality
        document.getElementById("apply-settings").addEventListener("click", applySettings);
        
        settingsPanelOpen = true;
    }
}

function applySettings() {
    const newColorCount = parseInt(document.getElementById("color-count").value);
    const newCodeLength = parseInt(document.getElementById("code-length").value);
    
    // Update game settings
    colors.length = 0; // Clear the array
    colors.push(...availableColors.slice(0, newColorCount)); // Add selected number of colors
    
    // Update code length - use the actual variable, not a window property
    codeLength = newCodeLength;
    
    // Close settings panel
    toggleSettingsPanel();
    
    // Reset and restart the game
    resetGame();
}

// Add event listener to the settings button in your HTML
document.addEventListener("DOMContentLoaded", function() {
    // Set up settings button
    const settingsButton = document.getElementById("settings-button");
    if (settingsButton) {
        settingsButton.addEventListener("click", toggleSettingsPanel);
    } else {
        console.error("Settings button not found");
    }
    
    // Set up check button
    document.getElementById("checkButton").addEventListener("click", handleCheckButton);
});

// Replace the anonymous check button listener with named function
document.getElementById("checkButton").addEventListener("click", handleCheckButton);

// Initialize the game
initBoard();
initColorControls();
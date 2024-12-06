import { width, height, numMines, DIFFICULTY_SETTINGS, setDifficulty } from './config.js'
import { firstClick, revealedCells, grid, init, resetGameState } from './desert-explorer.js'
import { addFlagListeners } from './touch-interaction.js';

const bottomBar = document.getElementById('bottom-bar');
var settingsVisible = false;

export function initUI() {

    createBlob();

   
    // Setup bottom bar with both flag controls and message container
    // bottomBar = document.getElementById('bottom-bar');
    bottomBar.innerHTML = `
    <div class="flag-controls">
    <div class="flag-container">
    <div class="draggable-flag" draggable="true">x</div>
    </div>
    <span class="flags-remaining">${numMines}</span>
    </div>
    <div class="message-container" id="message-container">
    <div id="message"></div>
    <button id="try-again-button"><img src="../assets/refresh-button.png"></button>
    </div>
    `;

    
    document.getElementById('settings-button').addEventListener("click", openSettings);
    document.getElementById("try-again-button").addEventListener("click", handleTryAgain);
    
    document.getElementById('settings-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'settings-overlay') {
            settingsVisible = false;
            e.target.classList.remove('visible');
        }
    });
    
    addFlagListeners();
    
}



export function openSettings() {
    console.log('settings');
    const overlay = document.getElementById('settings-overlay');
    settingsVisible = !settingsVisible;

    if (settingsVisible) {
        overlay.classList.add('visible');
    } else {
        overlay.classList.remove('visible');
    }
}



export function showMessage(message) {
    const messageContainer = document.getElementById("message-container");
    const messageElement = document.getElementById("message");
    const flagControls = document.querySelector('.flag-controls');
    
    messageElement.textContent = message;
    flagControls.style.display = 'none';
    messageContainer.style.display = 'flex';
}



// Add new function to handle difficulty changes
function changeDifficulty(difficulty) {
    setDifficulty(difficulty);
    resetGameState();
    
    // Reset flags remaining counter
    document.querySelector('.flags-remaining').textContent = numMines;
    
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



function handleTryAgain() {
    const messageContainer = document.getElementById("message-container");
    messageContainer.classList.remove('visible');
    
    // Reset flags remaining counter
    document.querySelector('.flags-remaining').textContent = numMines;
    
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
    resetGameState();
    // revealedCells = 0;
    // firstClick = true;

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

    // Reset and show flag controls
    const flagControls = document.querySelector('.flag-controls');
    // const messageContainer = document.getElementById("message-container");
    flagControls.style.display = 'flex';
    messageContainer.style.display = 'none';
}


function createBlob() {
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
}

export function generateBlobPoints(width, height, numPoints = 30) {
    // Calculate actual desired blob size based on grid cells + padding
    const cellSize = 40;  // Match cell size from CSS
    const padding = 40;   // Padding around grid
    const rectWidth = width * cellSize + padding * 2;
    const rectHeight = height * cellSize + padding * 2;

    const points = [];
    const baseJitter = 20; // Actual pixel value for jitter
    const waveFreq = 3;   // Reduced for gentler waves
    const waveAmp = 10;   // Actual pixel value for wave size

    for (let i = 0; i < numPoints; i++) {
        const t = i / numPoints;
        let x, y;

        // Generate base rectangle points
        if (t < 0.25) {
            x = t * 4 * rectWidth;
            y = 0;
        } else if (t < 0.5) {
            x = rectWidth;
            y = (t - 0.25) * 4 * rectHeight;
        } else if (t < 0.75) {
            x = (1 - (t - 0.5) * 4) * rectWidth;
            y = rectHeight;
        } else {
            x = 0;
            y = (1 - (t - 0.75) * 4) * rectHeight;
        }

        // Add organic deformation
        const angle = Math.atan2(y - rectHeight / 2, x - rectWidth / 2);
        const jitter = Math.random() * baseJitter;
        const wave = Math.sin(t * Math.PI * 2 * waveFreq) * waveAmp;

        x += Math.cos(angle) * (jitter + wave);
        y += Math.sin(angle) * (jitter + wave);

        points.push({ x, y });
    }

    return {
        points,
        width: rectWidth,
        height: rectHeight
    };
}

export function createBlobPath(points) {
    const smooth = 0.2;  // reduced for sharper corners
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

export function setupGameUI() {
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
}
class LightsOut {
    constructor() {
        this.N = 4;
        this.dirs = [[0,0],[1,0],[-1,0],[0,1],[0,-1]]; // plus neighborhood
        this.board = this.createBoard();
        this.moves = 0;
        this.gameWon = false;
        
        this.initializeDOM();
        this.startNewGame();
    }

    createBoard() {
        return Array.from({length: this.N}, () => Array(this.N).fill(false));
    }

    clone(board) {
        return board.map(row => row.slice());
    }

    press(board, r, c) {
        for (const [dr, dc] of this.dirs) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < this.N && nc >= 0 && nc < this.N) {
                board[nr][nc] = !board[nr][nc];
            }
        }
    }

    scramble(board, k = 8) {
        // Reset board first
        for (let i = 0; i < this.N; i++) {
            for (let j = 0; j < this.N; j++) {
                board[i][j] = false;
            }
        }
        
        // Apply random presses
        for (let i = 0; i < k; i++) {
            const r = Math.floor(Math.random() * this.N);
            const c = Math.floor(Math.random() * this.N);
            this.press(board, r, c);
        }
        return board;
    }

    solve4x4(initial) {
        let best = null;
        for (let mask = 0; mask < 16; mask++) {
            const board = this.clone(initial);
            const moves = [];
            
            // Apply first-row presses per mask
            for (let c = 0; c < this.N; c++) {
                if ((mask >> c) & 1) {
                    this.press(board, 0, c);
                    moves.push({r: 0, c});
                }
            }
            
            // Chase rows 1..3
            for (let r = 0; r < this.N - 1; r++) {
                for (let c = 0; c < this.N; c++) {
                    if (board[r][c]) {
                        this.press(board, r + 1, c);
                        moves.push({r: r + 1, c});
                    }
                }
            }
            
            // Check last row all off
            const solved = board[this.N - 1].every(v => !v);
            if (solved && (!best || moves.length < best.length)) {
                best = moves;
            }
        }
        return best;
    }

    isGameWon() {
        return this.board.every(row => row.every(cell => !cell));
    }

    initializeDOM() {
        this.gameBoard = document.getElementById('game-board');
        this.movesText = document.getElementById('moves-text');
        this.gameStatus = document.getElementById('game-status');
        this.resetButton = document.getElementById('reset-button');
        this.nextLevelButton = document.getElementById('next-level');

        // Create grid
        this.createGrid();

        // Add event listeners
        this.resetButton.addEventListener('click', () => this.resetGame());
        this.nextLevelButton.addEventListener('click', () => this.startNewGame());
    }

    createGrid() {
        this.gameBoard.innerHTML = '';
        this.lightElements = [];

        for (let r = 0; r < this.N; r++) {
            this.lightElements[r] = [];
            for (let c = 0; c < this.N; c++) {
                const light = document.createElement('div');
                light.className = 'light off';
                light.dataset.row = r;
                light.dataset.col = c;
                
                light.addEventListener('click', () => this.handleLightClick(r, c));
                
                this.gameBoard.appendChild(light);
                this.lightElements[r][c] = light;
            }
        }
    }

    handleLightClick(r, c) {
        if (this.gameWon) return;

        // Add pressed effect
        const clickedLight = this.lightElements[r][c];
        clickedLight.classList.add('pressed');
        setTimeout(() => clickedLight.classList.remove('pressed'), 300);

        // Apply game logic
        this.press(this.board, r, c);
        this.moves++;

        // Update display
        this.updateDisplay();

        // Check win condition
        if (this.isGameWon()) {
            this.gameWon = true;
            this.showWin();
        }
    }

    updateDisplay() {
        // Update moves counter
        this.movesText.textContent = `Moves: ${this.moves}`;

        // Update light states
        for (let r = 0; r < this.N; r++) {
            for (let c = 0; c < this.N; c++) {
                const light = this.lightElements[r][c];
                if (this.board[r][c]) {
                    light.className = 'light on';
                } else {
                    light.className = 'light off';
                }
            }
        }

        // Update status
        if (!this.gameWon) {
            this.gameStatus.innerHTML = '<div class="status-message status-playing">Turn off all the lights!</div>';
        }
    }

    showWin() {
        this.gameStatus.innerHTML = '<div class="status-message status-win">🎉 You Won! 🎉</div>';
        
        // Confetti celebration
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    }

    resetGame() {
        this.moves = 0;
        this.gameWon = false;
        
        // Reset board to current puzzle state (don't generate new puzzle)
        this.board = this.clone(this.initialBoard);
        this.updateDisplay();
    }

    startNewGame() {
        this.moves = 0;
        this.gameWon = false;
        
        // Generate new puzzle
        this.board = this.createBoard();
        this.scramble(this.board);
        
        // Store initial state for reset
        this.initialBoard = this.clone(this.board);
        
        this.updateDisplay();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LightsOut();
});

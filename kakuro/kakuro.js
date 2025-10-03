class KakuroGame {
    constructor() {
        this.grid = [];
        this.solution = [];
        this.currentPuzzle = null;
        this.selectedCell = null;
        this.settings = {
            showHints: true,
            highlightErrors: true,
            gridSize: '2x2'
        };
        this.difficulty = 'easy';
        
        this.initializeGame();
        this.setupEventListeners();
    }

    initializeGame() {
        this.loadSettings();
        this.updateDifficultyButtonsVisibility();
        this.generatePuzzle();
    }

    updateDifficultyButtonsVisibility() {
        const difficultyButtons = document.querySelector('.difficulty-buttons');
        if (this.settings.gridSize === '2x2' || this.settings.gridSize === '3x3') {
            difficultyButtons.classList.add('hidden');
        } else {
            difficultyButtons.classList.remove('hidden');
        }
    }

    setupEventListeners() {
        // Difficulty buttons
        document.querySelectorAll('.difficulty-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.setDifficulty(e.target.dataset.difficulty);
            });
        });

        // Try again button
        document.getElementById('try-again-button').addEventListener('click', () => {
            this.generatePuzzle();
        });

        // Settings modal
        const settingsButton = document.getElementById('settings-button');
        const settingsModal = document.getElementById('settings-modal');
        const closeModal = document.querySelector('.close');

        settingsButton.addEventListener('click', () => {
            settingsModal.style.display = 'block';
        });

        closeModal.addEventListener('click', () => {
            settingsModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === settingsModal) {
                settingsModal.style.display = 'none';
            }
        });

        // Settings checkboxes
        document.getElementById('show-hints').addEventListener('change', (e) => {
            this.settings.showHints = e.target.checked;
            this.saveSettings();
        });

        document.getElementById('highlight-errors').addEventListener('change', (e) => {
            this.settings.highlightErrors = e.target.checked;
            this.saveSettings();
        });

        // Grid size dropdown
        document.getElementById('grid-size').addEventListener('change', (e) => {
            this.settings.gridSize = e.target.value;
            this.saveSettings();
            this.updateDifficultyButtonsVisibility();
            this.generatePuzzle();
        });

        // Keyboard input
        document.addEventListener('keydown', (e) => {
            this.handleKeyInput(e);
        });

        // Digit palette interactions (pointer-based for mobile)
        this.setupDigitPalette();
    }

    setupDigitPalette() {
        // Initialize drag state early (needed by cells too)
        if (!this._dragState) {
            this._dragState = { dragging: false, value: null, origin: null, clone: null };
        }

        const palette = document.getElementById('digit-palette');
        if (!palette) return;

        // Add pointer handlers to palette tiles
        palette.querySelectorAll('.digit-tile').forEach(tile => {
            tile.addEventListener('pointerdown', (e) => this.onPalettePointerDown(e, tile));
            // click/tap fallback: quick tap sets selected cell value
            tile.addEventListener('click', (e) => {
                const value = tile.dataset.value;
                if (this.selectedCell) {
                    this.setCellValue(this.selectedCell.row, this.selectedCell.col, value);
                    // visually select
                    const sel = document.querySelector('.kakuro-cell.selected');
                    if (sel) sel.classList.remove('selected');
                }
            });
            // Prevent default to avoid scrolling during drag
            tile.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
        });

        // Global pointer handlers for move and up - only add once
        if (!this._globalHandlersAdded) {
            this._globalHandlersAdded = true;
            document.addEventListener('pointermove', (e) => this.onPointerMove(e));
            document.addEventListener('pointerup', (e) => this.onPointerUp(e));
        }
    }

    onPalettePointerDown(e, tile) {
        e.preventDefault();
        const value = tile.dataset.value;
        this._dragState.dragging = true;
        this._dragState.value = value;
        this._dragState.origin = { type: 'palette' };
        this._dragState.pointerId = e.pointerId;

        // create clone element to follow pointer
        const clone = document.createElement('div');
        clone.className = 'dragging-clone';
        clone.textContent = value === '' ? '×' : value;
        document.body.appendChild(clone);
        this._dragState.clone = clone;
        this.updateClonePosition(e.clientX, e.clientY);

        // mark possible targets
        document.querySelectorAll('.kakuro-cell.white').forEach(c => c.classList.add('droppable'));
        
        // Set pointer capture to ensure we get move/up events
        tile.setPointerCapture(e.pointerId);
    }

    onPointerMove(e) {
        if (!this._dragState || !this._dragState.dragging) return;
        
        this.updateClonePosition(e.clientX, e.clientY);

        // highlight cell under pointer
        const el = document.elementFromPoint(e.clientX, e.clientY);
        document.querySelectorAll('.kakuro-cell.drop-target').forEach(x => x.classList.remove('drop-target'));
        if (el) {
            const cell = el.closest && el.closest('.kakuro-cell');
            if (cell && cell.classList.contains('white')) {
                cell.classList.add('drop-target');
            }
        }
    }

    onPointerUp(e) {
        if (!this._dragState || !this._dragState.dragging) return;
        this._dragState.dragging = false;

        const clone = this._dragState.clone;
        if (clone && clone.parentNode) clone.parentNode.removeChild(clone);

        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el && el.closest ? el.closest('.kakuro-cell') : null;

        // clear droppable visuals
        document.querySelectorAll('.kakuro-cell.drop-target').forEach(x => x.classList.remove('drop-target'));
        document.querySelectorAll('.kakuro-cell.droppable').forEach(x => x.classList.remove('droppable'));

        if (cell && cell.classList.contains('white')) {
            const row = parseInt(cell.dataset.row, 10);
            const col = parseInt(cell.dataset.col, 10);
            // If origin was palette, set value
            if (this._dragState.origin.type === 'palette') {
                this.setCellValue(row, col, this._dragState.value);
            } else if (this._dragState.origin.type === 'cell') {
                // move value from origin cell to this cell
                const o = this._dragState.origin;
                // avoid no-op
                if (!(o.row === row && o.col === col)) {
                    const movingValue = this.grid[o.row][o.col].value;
                    this.setCellValue(row, col, movingValue);
                    this.setCellValue(o.row, o.col, '');
                }
            }
        } else {
            // Dropped off-board: if dragging from a cell, clear origin
            if (this._dragState.origin.type === 'cell') {
                const o = this._dragState.origin;
                this.setCellValue(o.row, o.col, '');
            }
        }

        this._dragState = { dragging: false, value: null, origin: null, clone: null };
    }

    updateClonePosition(x, y) {
        if (!this._dragState || !this._dragState.clone) return;
        const clone = this._dragState.clone;
        const offset = 22; // center the clone on pointer
        clone.style.left = (x - offset) + 'px';
        clone.style.top = (y - offset) + 'px';
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        document.querySelectorAll('.difficulty-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.difficulty === difficulty);
        });
        this.generatePuzzle();
    }

    generatePuzzle() {
        let puzzle;
        
        if (this.settings.gridSize === '2x2') {
            puzzle = this.generate2x2Puzzle();
        } else if (this.settings.gridSize === '3x3') {
            puzzle = this.generate3x3Puzzle();
        } else {
            const puzzles = this.getPuzzles();
            const puzzleSet = puzzles[this.difficulty];
            puzzle = puzzleSet[Math.floor(Math.random() * puzzleSet.length)];
        }
        
        this.currentPuzzle = puzzle;
        this.createGrid();
        this.renderGrid();
        
        if (this.settings.gridSize === '2x2' || this.settings.gridSize === '3x3') {
            this.updateStatus('Fill in the numbers! Each clue shows what the sum should be.');
        } else {
            this.updateStatus('Fill in the numbers so each clue adds up correctly!');
        }
    }

    generate2x2Puzzle() {
        // Generate 4 unique random numbers 1-9
        const numbers = this.getUniqueRandomNumbers(4, 1, 9);
        
        // Arrange in 2x2 grid
        const grid = [
            [numbers[0], numbers[1]], // row 1: a, b
            [numbers[2], numbers[3]]  // row 2: c, d
        ];
        
        // Calculate clues
        const downClue1 = grid[0][0] + grid[1][0]; // a + c
        const downClue2 = grid[0][1] + grid[1][1]; // b + d
        const rightClue1 = grid[0][0] + grid[0][1]; // a + b
        const rightClue2 = grid[1][0] + grid[1][1]; // c + d
        
        return {
            size: [3, 3],
            clues: [
                { row: 0, col: 1, down: downClue1 },
                { row: 0, col: 2, down: downClue2 },
                { row: 1, col: 0, right: rightClue1 },
                { row: 2, col: 0, right: rightClue2 }
            ],
            cells: [
                { row: 1, col: 1 },
                { row: 1, col: 2 },
                { row: 2, col: 1 },
                { row: 2, col: 2 }
            ]
        };
    }

    generate3x3Puzzle() {
        // Generate a 3x3 arrangement of unique numbers
        // We'll do a simple L-shape or cross pattern
        const numbers = this.getUniqueRandomNumbers(6, 1, 9);
        
        // Create an L-shaped pattern like:
        // x x x
        // x x .
        // x . .
        const gridValues = {
            '1,1': numbers[0], '1,2': numbers[1], '1,3': numbers[2],
            '2,1': numbers[3], '2,2': numbers[4],
            '3,1': numbers[5]
        };
        
        // Calculate clues
        const downClue1 = gridValues['1,1'] + gridValues['2,1'] + gridValues['3,1']; // col 1
        const downClue2 = gridValues['1,2'] + gridValues['2,2']; // col 2
        const downClue3 = gridValues['1,3']; // col 3
        const rightClue1 = gridValues['1,1'] + gridValues['1,2'] + gridValues['1,3']; // row 1
        const rightClue2 = gridValues['2,1'] + gridValues['2,2']; // row 2
        const rightClue3 = gridValues['3,1']; // row 3
        
        return {
            size: [4, 4],
            clues: [
                { row: 0, col: 1, down: downClue1 },
                { row: 0, col: 2, down: downClue2 },
                { row: 0, col: 3, down: downClue3 },
                { row: 1, col: 0, right: rightClue1 },
                { row: 2, col: 0, right: rightClue2 },
                { row: 3, col: 0, right: rightClue3 }
            ],
            cells: [
                { row: 1, col: 1 },
                { row: 1, col: 2 },
                { row: 1, col: 3 },
                { row: 2, col: 1 },
                { row: 2, col: 2 },
                { row: 3, col: 1 }
            ]
        };
    }

    getUniqueRandomNumbers(count, min, max) {
        const numbers = [];
        while (numbers.length < count) {
            const num = Math.floor(Math.random() * (max - min + 1)) + min;
            if (!numbers.includes(num)) {
                numbers.push(num);
            }
        }
        return numbers;
    }

    getPuzzles() {
        return {
            // Super simple 2x2 grids for beginners
            simple2x2: [
                {
                    size: [3, 3],
                    clues: [
                        { row: 0, col: 1, down: 3 },
                        { row: 0, col: 2, down: 5 },
                        { row: 1, col: 0, right: 4 },
                        { row: 2, col: 0, right: 4 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 }
                    ]
                },
                {
                    size: [3, 3],
                    clues: [
                        { row: 0, col: 1, down: 5 },
                        { row: 0, col: 2, down: 7 },
                        { row: 1, col: 0, right: 6 },
                        { row: 2, col: 0, right: 6 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 }
                    ]
                },
                {
                    size: [3, 3],
                    clues: [
                        { row: 0, col: 1, down: 4 },
                        { row: 0, col: 2, down: 6 },
                        { row: 1, col: 0, right: 5 },
                        { row: 2, col: 0, right: 5 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 }
                    ]
                }
            ],
            
            // Simple 3x3 grids
            simple3x3: [
                {
                    size: [4, 4],
                    clues: [
                        { row: 0, col: 1, down: 6 },
                        { row: 0, col: 2, down: 4 },
                        { row: 0, col: 3, down: 9 },
                        { row: 1, col: 0, right: 6 },
                        { row: 2, col: 0, right: 7 },
                        { row: 3, col: 0, right: 6 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 1, col: 3 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 },
                        { row: 3, col: 1 },
                        { row: 3, col: 3 }
                    ]
                },
                {
                    size: [4, 4],
                    clues: [
                        { row: 0, col: 1, down: 7 },
                        { row: 0, col: 2, down: 8 },
                        { row: 0, col: 3, down: 6 },
                        { row: 1, col: 0, right: 9 },
                        { row: 2, col: 0, right: 5 },
                        { row: 3, col: 0, right: 7 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 1, col: 3 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 },
                        { row: 3, col: 1 },
                        { row: 3, col: 3 }
                    ]
                },
                {
                    size: [4, 4],
                    clues: [
                        { row: 0, col: 1, down: 5 },
                        { row: 0, col: 2, down: 9 },
                        { row: 0, col: 3, down: 8 },
                        { row: 1, col: 0, right: 8 },
                        { row: 2, col: 0, right: 6 },
                        { row: 3, col: 0, right: 8 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 1, col: 3 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 },
                        { row: 3, col: 1 },
                        { row: 3, col: 3 }
                    ]
                }
            ],
            
            easy: [
                {
                    size: [5, 5],
                    clues: [
                        { row: 0, col: 1, down: 4 },
                        { row: 0, col: 2, down: 3 },
                        { row: 1, col: 0, right: 7 },
                        { row: 2, col: 0, right: 6 },
                        { row: 1, col: 3, down: 7 },
                        { row: 0, col: 4, down: 10 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 },
                        { row: 1, col: 4 },
                        { row: 2, col: 4 },
                        { row: 3, col: 4 }
                    ]
                },
                {
                    size: [6, 6],
                    clues: [
                        { row: 0, col: 1, down: 10 },
                        { row: 0, col: 2, down: 6 },
                        { row: 0, col: 4, down: 8 },
                        { row: 1, col: 0, right: 16 },
                        { row: 2, col: 0, right: 9 },
                        { row: 3, col: 0, right: 7 },
                        { row: 2, col: 3, down: 9 },
                        { row: 0, col: 5, down: 15 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 1, col: 4 },
                        { row: 1, col: 5 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 },
                        { row: 2, col: 4 },
                        { row: 3, col: 1 },
                        { row: 3, col: 4 },
                        { row: 3, col: 5 },
                        { row: 4, col: 4 },
                        { row: 4, col: 5 }
                    ]
                }
            ],
            medium: [
                {
                    size: [7, 7],
                    clues: [
                        { row: 0, col: 1, down: 15 },
                        { row: 0, col: 2, down: 11 },
                        { row: 0, col: 4, down: 16 },
                        { row: 0, col: 5, down: 7 },
                        { row: 1, col: 0, right: 23 },
                        { row: 2, col: 0, right: 14 },
                        { row: 3, col: 0, right: 10 },
                        { row: 4, col: 0, right: 8 },
                        { row: 2, col: 3, down: 12 },
                        { row: 0, col: 6, down: 20 },
                        { row: 4, col: 3, right: 9 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 1, col: 4 },
                        { row: 1, col: 5 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 },
                        { row: 2, col: 4 },
                        { row: 3, col: 1 },
                        { row: 3, col: 4 },
                        { row: 3, col: 5 },
                        { row: 4, col: 1 },
                        { row: 4, col: 2 },
                        { row: 4, col: 4 },
                        { row: 4, col: 5 },
                        { row: 1, col: 6 },
                        { row: 2, col: 6 },
                        { row: 3, col: 6 }
                    ]
                }
            ],
            hard: [
                {
                    size: [8, 8],
                    clues: [
                        { row: 0, col: 1, down: 24 },
                        { row: 0, col: 2, down: 18 },
                        { row: 0, col: 4, down: 21 },
                        { row: 0, col: 5, down: 12 },
                        { row: 0, col: 7, down: 25 },
                        { row: 1, col: 0, right: 30 },
                        { row: 2, col: 0, right: 19 },
                        { row: 3, col: 0, right: 15 },
                        { row: 4, col: 0, right: 11 },
                        { row: 5, col: 0, right: 14 },
                        { row: 2, col: 3, down: 17 },
                        { row: 0, col: 6, down: 13 },
                        { row: 4, col: 3, right: 20 },
                        { row: 5, col: 6, down: 8 }
                    ],
                    cells: [
                        { row: 1, col: 1 },
                        { row: 1, col: 2 },
                        { row: 1, col: 4 },
                        { row: 1, col: 5 },
                        { row: 1, col: 7 },
                        { row: 2, col: 1 },
                        { row: 2, col: 2 },
                        { row: 2, col: 4 },
                        { row: 2, col: 5 },
                        { row: 2, col: 7 },
                        { row: 3, col: 1 },
                        { row: 3, col: 2 },
                        { row: 3, col: 4 },
                        { row: 3, col: 5 },
                        { row: 3, col: 7 },
                        { row: 4, col: 1 },
                        { row: 4, col: 2 },
                        { row: 4, col: 4 },
                        { row: 4, col: 5 },
                        { row: 4, col: 7 },
                        { row: 5, col: 1 },
                        { row: 5, col: 2 },
                        { row: 1, col: 6 },
                        { row: 2, col: 6 },
                        { row: 3, col: 6 },
                        { row: 6, col: 6 },
                        { row: 7, col: 6 }
                    ]
                }
            ]
        };
    }

    createGrid() {
        const [rows, cols] = this.currentPuzzle.size;
        this.grid = Array(rows).fill(null).map(() => Array(cols).fill(null));

        // Initialize as black cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                this.grid[row][col] = { type: 'black', value: null };
            }
        }

        // Set clue cells
        this.currentPuzzle.clues.forEach(clue => {
            this.grid[clue.row][clue.col] = {
                type: 'clue',
                downClue: clue.down,
                rightClue: clue.right
            };
        });

        // Set white cells (empty to start)
        this.currentPuzzle.cells.forEach(cell => {
            this.grid[cell.row][cell.col] = { type: 'white', value: '' };
        });
    }

    renderGrid() {
        const gameDiv = document.getElementById('game');
        const [rows, cols] = this.currentPuzzle.size;
        
        gameDiv.innerHTML = '';
        
        const gridDiv = document.createElement('div');
        gridDiv.className = 'kakuro-grid';
        gridDiv.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        gridDiv.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const cell = this.createCell(row, col);
                gridDiv.appendChild(cell);
            }
        }

        gameDiv.appendChild(gridDiv);
    }

    createCell(row, col) {
        const cellData = this.grid[row][col];
        const cellDiv = document.createElement('div');
        cellDiv.className = 'kakuro-cell';
        cellDiv.dataset.row = row;
        cellDiv.dataset.col = col;

        if (cellData.type === 'black') {
            cellDiv.classList.add('black');
        } else if (cellData.type === 'clue') {
            cellDiv.classList.add('black', 'clue-cell');
            
            const diagonal = document.createElement('div');
            diagonal.className = 'diagonal';
            cellDiv.appendChild(diagonal);

            if (cellData.downClue) {
                const downClue = document.createElement('div');
                downClue.className = 'down-clue';
                downClue.textContent = cellData.downClue;
                cellDiv.appendChild(downClue);
            }

            if (cellData.rightClue) {
                const rightClue = document.createElement('div');
                rightClue.className = 'right-clue';
                rightClue.textContent = cellData.rightClue;
                cellDiv.appendChild(rightClue);
            }
        } else if (cellData.type === 'white') {
            cellDiv.classList.add('white');
            cellDiv.textContent = cellData.value;
            
            cellDiv.addEventListener('click', () => {
                this.selectCell(row, col);
            });

            // allow dragging a placed number to move or remove it
            cellDiv.addEventListener('pointerdown', (e) => {
                // only start a drag if there is a value in the cell
                const value = this.grid[row][col].value;
                if (!value) return;
                
                // Initialize drag state if not already done
                if (!this._dragState) {
                    this._dragState = { dragging: false, value: null, origin: null, clone: null };
                }
                
                // For touch events, prevent default to stop scrolling
                if (e.pointerType === 'touch') {
                    e.preventDefault();
                }
                e.stopPropagation();
                
                this._dragState.dragging = true;
                this._dragState.value = value;
                this._dragState.origin = { type: 'cell', row, col };

                const clone = document.createElement('div');
                clone.className = 'dragging-clone';
                clone.textContent = value;
                document.body.appendChild(clone);
                this._dragState.clone = clone;
                this.updateClonePosition(e.clientX, e.clientY);

                // mark other white cells as droppable
                document.querySelectorAll('.kakuro-cell.white').forEach(c => c.classList.add('droppable'));
                
                // Set pointer capture to ensure we get move/up events even if pointer leaves element
                cellDiv.setPointerCapture(e.pointerId);
            });
            
            // Release pointer capture on pointerup
            cellDiv.addEventListener('pointerup', (e) => {
                if (cellDiv.hasPointerCapture(e.pointerId)) {
                    cellDiv.releasePointerCapture(e.pointerId);
                }
            });
            
            cellDiv.addEventListener('pointercancel', (e) => {
                if (cellDiv.hasPointerCapture(e.pointerId)) {
                    cellDiv.releasePointerCapture(e.pointerId);
                }
            });
        }

        return cellDiv;
    }

    selectCell(row, col) {
        // Remove previous selection
        document.querySelectorAll('.kakuro-cell.selected').forEach(cell => {
            cell.classList.remove('selected');
        });

        this.selectedCell = { row, col };
        const cellDiv = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cellDiv.classList.add('selected');
    }

    handleKeyInput(e) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        const cellData = this.grid[row][col];

        if (cellData.type !== 'white') return;

        if (e.key >= '1' && e.key <= '9') {
            this.setCellValue(row, col, e.key);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            this.setCellValue(row, col, '');
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || 
                   e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            e.preventDefault();
            this.moveSelection(e.key);
        }
    }

    setCellValue(row, col, value) {
        this.grid[row][col].value = value;
        const cellDiv = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cellDiv.textContent = value;

        // Remove error/correct classes from this cell
        cellDiv.classList.remove('error', 'correct');

        if (this.settings.highlightErrors) {
            // Re-validate this cell if it has a value
            if (value) {
                this.validateCell(row, col);
            }
            
            // Also re-validate all other cells in the same clue groups
            // This ensures that errors are cleared when they're no longer valid
            const clues = this.getCluesForCell(row, col);
            clues.forEach(clue => {
                const cells = this.getCellsForClue(clue);
                cells.forEach(cell => {
                    // Skip the current cell (already validated above)
                    if (cell.row !== row || cell.col !== col) {
                        const cellValue = this.grid[cell.row][cell.col].value;
                        // Clear error class first
                        const otherCellDiv = document.querySelector(`[data-row="${cell.row}"][data-col="${cell.col}"]`);
                        otherCellDiv.classList.remove('error', 'correct');
                        // Re-validate if it has a value
                        if (cellValue) {
                            this.validateCell(cell.row, cell.col);
                        }
                    }
                });
            });
        }

        this.checkCompletion();
    }

    moveSelection(direction) {
        if (!this.selectedCell) return;

        const { row, col } = this.selectedCell;
        const [rows, cols] = this.currentPuzzle.size;
        let newRow = row;
        let newCol = col;

        switch (direction) {
            case 'ArrowUp':
                newRow = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                newRow = Math.min(rows - 1, row + 1);
                break;
            case 'ArrowLeft':
                newCol = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                newCol = Math.min(cols - 1, col + 1);
                break;
        }

        // Find next white cell
        while ((newRow !== row || newCol !== col) && this.grid[newRow][newCol].type !== 'white') {
            switch (direction) {
                case 'ArrowUp':
                    newRow = Math.max(0, newRow - 1);
                    if (newRow === 0 && this.grid[newRow][newCol].type !== 'white') return;
                    break;
                case 'ArrowDown':
                    newRow = Math.min(rows - 1, newRow + 1);
                    if (newRow === rows - 1 && this.grid[newRow][newCol].type !== 'white') return;
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, newCol - 1);
                    if (newCol === 0 && this.grid[newRow][newCol].type !== 'white') return;
                    break;
                case 'ArrowRight':
                    newCol = Math.min(cols - 1, newCol + 1);
                    if (newCol === cols - 1 && this.grid[newRow][newCol].type !== 'white') return;
                    break;
            }
        }

        if (this.grid[newRow][newCol].type === 'white') {
            this.selectCell(newRow, newCol);
        }
    }

    validateCell(row, col) {
        const cellDiv = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        const currentValue = parseInt(this.grid[row][col].value);
        
        if (!currentValue) return;

        // Check if this violates any clue rules
        const clues = this.getCluesForCell(row, col);
        let hasError = false;

        clues.forEach(clue => {
            const cells = this.getCellsForClue(clue);
            const values = cells.map(c => parseInt(this.grid[c.row][c.col].value) || 0).filter(v => v > 0);
            
            // Check for duplicates
            if (values.length !== new Set(values).size) {
                hasError = true;
            }
            
            // Check if sum exceeds clue
            if (values.reduce((sum, v) => sum + v, 0) > clue.sum) {
                hasError = true;
            }
        });

        if (hasError) {
            cellDiv.classList.add('error');
        } else {
            cellDiv.classList.remove('error');
        }
    }

    getCluesForCell(row, col) {
        const clues = [];
        
        // Find clues that affect this cell
        this.currentPuzzle.clues.forEach(clue => {
            if (clue.down) {
                // Check if this cell is in the down clue
                for (let r = clue.row + 1; r < this.currentPuzzle.size[0]; r++) {
                    if (this.grid[r][clue.col].type === 'black' || this.grid[r][clue.col].type === 'clue') break;
                    if (r === row && clue.col === col) {
                        clues.push({ ...clue, sum: clue.down, direction: 'down' });
                        break;
                    }
                }
            }
            
            if (clue.right) {
                // Check if this cell is in the right clue
                for (let c = clue.col + 1; c < this.currentPuzzle.size[1]; c++) {
                    if (this.grid[clue.row][c].type === 'black' || this.grid[clue.row][c].type === 'clue') break;
                    if (clue.row === row && c === col) {
                        clues.push({ ...clue, sum: clue.right, direction: 'right' });
                        break;
                    }
                }
            }
        });
        
        return clues;
    }

    getCellsForClue(clue) {
        const cells = [];
        
        if (clue.direction === 'down') {
            for (let r = clue.row + 1; r < this.currentPuzzle.size[0]; r++) {
                if (this.grid[r][clue.col].type === 'black' || this.grid[r][clue.col].type === 'clue') break;
                cells.push({ row: r, col: clue.col });
            }
        } else if (clue.direction === 'right') {
            for (let c = clue.col + 1; c < this.currentPuzzle.size[1]; c++) {
                if (this.grid[clue.row][c].type === 'black' || this.grid[clue.row][c].type === 'clue') break;
                cells.push({ row: clue.row, col: c });
            }
        }
        
        return cells;
    }

    checkCompletion() {
        const [rows, cols] = this.currentPuzzle.size;
        let allFilled = true;
        let allValid = true;

        // First check if all cells are filled
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (this.grid[row][col].type === 'white') {
                    if (!this.grid[row][col].value) {
                        allFilled = false;
                        break;
                    }
                }
            }
            if (!allFilled) break;
        }

        // If all filled, validate each clue
        if (allFilled) {
            allValid = this.validateAllClues();
        }

        if (allFilled && allValid) {
            this.updateStatus('🎉 Congratulations! Puzzle completed! 🎉');
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        } else if (allFilled) {
            this.updateStatus('Almost there! Check your answers.');
        }
    }

    validateAllClues() {
        // Check each clue to make sure it's valid
        for (const clue of this.currentPuzzle.clues) {
            if (clue.down && !this.validateClue(clue, 'down')) {
                return false;
            }
            if (clue.right && !this.validateClue(clue, 'right')) {
                return false;
            }
        }
        return true;
    }

    validateClue(clue, direction) {
        const cells = [];
        const sum = direction === 'down' ? clue.down : clue.right;
        
        if (direction === 'down') {
            for (let r = clue.row + 1; r < this.currentPuzzle.size[0]; r++) {
                if (this.grid[r][clue.col].type === 'black' || this.grid[r][clue.col].type === 'clue') break;
                cells.push({ row: r, col: clue.col });
            }
        } else {
            for (let c = clue.col + 1; c < this.currentPuzzle.size[1]; c++) {
                if (this.grid[clue.row][c].type === 'black' || this.grid[clue.row][c].type === 'clue') break;
                cells.push({ row: clue.row, col: c });
            }
        }

        // Get values from cells
        const values = cells.map(cell => {
            const value = parseInt(this.grid[cell.row][cell.col].value);
            return isNaN(value) ? 0 : value;
        });

        // Check if all values are filled (no zeros)
        if (values.includes(0)) return false;

        // Check sum
        const actualSum = values.reduce((a, b) => a + b, 0);
        if (actualSum !== sum) return false;

        // Check for duplicates
        const uniqueValues = new Set(values);
        if (uniqueValues.size !== values.length) return false;

        // Check if all values are 1-9
        if (values.some(v => v < 1 || v > 9)) return false;

        return true;
    }

    updateStatus(message) {
        document.getElementById('game-status').textContent = message;
    }

    loadSettings() {
        const saved = localStorage.getItem('kakuro-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        document.getElementById('show-hints').checked = this.settings.showHints;
        document.getElementById('highlight-errors').checked = this.settings.highlightErrors;
        document.getElementById('grid-size').value = this.settings.gridSize;
    }

    saveSettings() {
        localStorage.setItem('kakuro-settings', JSON.stringify(this.settings));
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new KakuroGame();
});
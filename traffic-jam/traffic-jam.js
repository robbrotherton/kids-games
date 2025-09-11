// Traffic Jam Game
// A sliding puzzle game where the goal is to move the red car to the exit

class TrafficJamGame {
    constructor() {
        this.moves = 0;
        this.gameBoard = null;
        this.cars = [];
        this.gridSize = 6;
        this.cellSize = 50;
        this.isDragging = false;
        this.dragCar = null;
        this.dragOffset = { x: 0, y: 0 };
        this.soundEffects = true;
        this.currentPuzzle = null; // Store the current puzzle info
        this.soundEffects = true;
        this.puzzles = []; // Will hold parsed puzzles
        
        this.initializeGame();
        this.setupEventListeners();
        
        // Wait a moment for DOM to be fully ready, then load first puzzle
        setTimeout(() => {
            this.loadRandomPuzzle();
        }, 100);
    }

    initializeGame() {
        this.gameBoard = document.getElementById('game-board');
        this.createGrid();
        this.updateUI();
    }

    createGrid() {
        this.gameBoard.innerHTML = '';
        // Always create all 36 grid cells
        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            // Position each grid cell explicitly
            const row = Math.floor(i / this.gridSize);
            const col = i % this.gridSize;
            cell.style.gridArea = `${row + 1} / ${col + 1} / ${row + 2} / ${col + 2}`;
            this.gameBoard.appendChild(cell);
        }
        console.log(`Created ${this.gridSize * this.gridSize} grid cells`);
    }

    setupEventListeners() {
        // Bottom bar buttons
        document.getElementById('next-level').addEventListener('click', () => {
            this.loadRandomPuzzle();
        });
        
        document.getElementById('reset-button').addEventListener('click', () => {
            // Reload the current puzzle
            if (this.currentPuzzle) {
                this.loadPuzzleFromConfig(this.currentPuzzle.configLine);
            }
        });

        // Touch and mouse events for dragging
        this.gameBoard.addEventListener('mousedown', this.handleStart.bind(this));
        this.gameBoard.addEventListener('touchstart', this.handleStart.bind(this));
        
        document.addEventListener('mousemove', this.handleMove.bind(this));
        document.addEventListener('touchmove', this.handleMove.bind(this));
        
        document.addEventListener('mouseup', this.handleEnd.bind(this));
        document.addEventListener('touchend', this.handleEnd.bind(this));
    }

    // Get levels from parsed puzzles or fallback to original levels
    get levels() {
        if (this.puzzles && this.puzzles.length > 0) {
            return this.puzzles;
        }
        // Fallback to original levels if puzzles haven't loaded yet
        return [
            // Level 1 - 1 move required
            {
                cars: [
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '🚗' },
                ],
                hint: "Just slide the red car to the right! One move and you win!",
                solution: ["Move red car right to exit"]
            },
            // Level 2 - 2 moves required
            {
                cars: [
                    { id: 'car1', color: 'blue', orientation: 'vertical', size: 3, position: { row: 0, col: 2 }, symbol: '�' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '�' },
                ],
                hint: "Move the blue bus first, then the red car can escape!",
                solution: ["Move blue bus down", "Move red car right to exit"]
            },
            // Level 3 - 2 moves required
            {
                cars: [
                    { id: 'car1', color: 'blue', orientation: 'vertical', size: 3, position: { row: 0, col: 4 }, symbol: '🚌' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '🚗' },
                ],
                hint: "The blue bus is blocking the path. Move it out of the way!",
                solution: ["Move blue bus down", "Move red car right to exit"]
            },
            // Level 4 - 3 moves required
            {
                cars: [
                    { id: 'car1', color: 'blue', orientation: 'horizontal', size: 3, position: { row: 0, col: 0 }, symbol: '�' },
                    { id: 'car2', color: 'yellow', orientation: 'vertical', size: 2, position: { row: 1, col: 2 }, symbol: '🚕' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '�' },
                ],
                hint: "You need to move multiple cars. Start with the yellow taxi!",
                solution: ["Move yellow taxi down", "Move blue bus right", "Move red car right to exit"]
            },
            // Level 5 - 3 moves required
            {
                cars: [
                    { id: 'car1', color: 'blue', orientation: 'horizontal', size: 3, position: { row: 0, col: 3 }, symbol: '🚌' },
                    { id: 'car2', color: 'yellow', orientation: 'vertical', size: 2, position: { row: 1, col: 5 }, symbol: '🚕' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '🚗' },
                ],
                hint: "Think about which cars are blocking the red car's path.",
                solution: ["Move yellow taxi up", "Move blue bus left", "Move red car right to exit"]
            },
            // Level 6 - 4 moves required
            {
                cars: [
                    { id: 'car1', color: 'purple', orientation: 'vertical', size: 3, position: { row: 0, col: 2 }, symbol: '🚓' },
                    { id: 'car2', color: 'blue', orientation: 'horizontal', size: 3, position: { row: 0, col: 3 }, symbol: '�' },
                    { id: 'car3', color: 'orange', orientation: 'vertical', size: 2, position: { row: 1, col: 5 }, symbol: '�' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 3 }, symbol: '�' },
                    { id: 'car4', color: 'green', orientation: 'horizontal', size: 3, position: { row: 3, col: 1 }, symbol: '🚐' },
                    { id: 'car5', color: 'yellow', orientation: 'vertical', size: 2, position: { row: 3, col: 4 }, symbol: '🚕' },
                ],
                hint: "This puzzle has more vehicles! Take your time and plan ahead.",
                solution: ["Move carefully to create a path for the red car"]
            },
            // Level 7 - 4 moves required
            {
                cars: [
                    { id: 'car1', color: 'yellow', orientation: 'vertical', size: 2, position: { row: 1, col: 2 }, symbol: '�' },
                    { id: 'car2', color: 'purple', orientation: 'vertical', size: 2, position: { row: 1, col: 4 }, symbol: '�' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '�' },
                    { id: 'car3', color: 'green', orientation: 'horizontal', size: 3, position: { row: 3, col: 0 }, symbol: '�' },
                ],
                hint: "Look for cars that need to move to make space for others.",
                solution: ["Plan your moves to clear the red car's path"]
            },
            // Level 8 - 4 moves required
            {
                cars: [
                    { id: 'car1', color: 'blue', orientation: 'horizontal', size: 3, position: { row: 0, col: 2 }, symbol: '�' },
                    { id: 'car2', color: 'purple', orientation: 'vertical', size: 3, position: { row: 0, col: 5 }, symbol: '�' },
                    { id: 'car3', color: 'yellow', orientation: 'vertical', size: 2, position: { row: 1, col: 4 }, symbol: '🚕' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '🚗' },
                ],
                hint: "Multiple vehicles are in the way. Find the right sequence!",
                solution: ["Work systematically to clear the path"]
            },
            // Level 9 - 5 moves required
            {
                cars: [
                    { id: 'car1', color: 'blue', orientation: 'horizontal', size: 3, position: { row: 0, col: 0 }, symbol: '�' },
                    { id: 'car2', color: 'yellow', orientation: 'vertical', size: 2, position: { row: 1, col: 3 }, symbol: '�' },
                    { id: 'car3', color: 'purple', orientation: 'vertical', size: 2, position: { row: 1, col: 4 }, symbol: '�' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '�' },
                    { id: 'car4', color: 'green', orientation: 'horizontal', size: 2, position: { row: 3, col: 2 }, symbol: '�' },
                    { id: 'car5', color: 'orange', orientation: 'vertical', size: 2, position: { row: 4, col: 2 }, symbol: '�' },
                ],
                hint: "This is getting trickier! Take your time to plan the sequence.",
                solution: ["This requires 5 moves - think step by step"]
            },
            // Level 10 - 5 moves required  
            {
                cars: [
                    { id: 'car1', color: 'purple', orientation: 'vertical', size: 3, position: { row: 0, col: 3 }, symbol: '�' },
                    { id: 'car2', color: 'blue', orientation: 'horizontal', size: 2, position: { row: 0, col: 4 }, symbol: '�' },
                    { id: 'car3', color: 'orange', orientation: 'vertical', size: 2, position: { row: 1, col: 5 }, symbol: '�' },
                    { id: 'red', color: 'red', orientation: 'horizontal', size: 2, position: { row: 2, col: 0 }, symbol: '🚗' },
                    { id: 'car4', color: 'yellow', orientation: 'horizontal', size: 3, position: { row: 5, col: 1 }, symbol: '�' },
                ],
                hint: "You're becoming a Traffic Jam expert! Figure out the right order.",
                solution: ["Requires careful planning - 5 optimal moves"]
            }
        ];
    }

    async loadRandomPuzzle() {
        try {
            const response = await fetch('./puzzle_configs.txt');
            const text = await response.text();
            const lines = text.split('\n').filter(line => {
                line = line.trim();
                return line && !line.startsWith('#') && !line.startsWith('//');
            });
            
            if (lines.length > 0) {
                // Pick a random line
                const randomLine = lines[Math.floor(Math.random() * lines.length)];
                this.loadPuzzleFromConfig(randomLine);
            }
        } catch (error) {
            console.error('Error loading puzzle:', error);
        }
    }

    loadPuzzleFromConfig(configLine) {
        console.log('Loading config line:', configLine);
        const parts = configLine.trim().split(/\s+/);
        console.log('Parts:', parts);
        
        if (parts.length >= 2) {
            const minMoves = parseInt(parts[0]);
            const boardConfig = parts[1];
            
            console.log('Parsed minMoves:', minMoves, 'boardConfig length:', boardConfig?.length);
            
            if (boardConfig && boardConfig.length === 36) {
                this.currentPuzzle = {
                    minMoves: minMoves,
                    configLine: configLine
                };
                
                console.log('Created currentPuzzle:', this.currentPuzzle);
                
                this.moves = 0;
                this.clearBoard();
                
                const cars = this.parseBoard(boardConfig);
                this.createCars(cars);
                this.updateUI();
                
                // Clear status elements if they exist
                const hintText = document.getElementById('hint-text');
                const gameStatus = document.getElementById('game-status');
                if (hintText) hintText.textContent = '';
                if (gameStatus) gameStatus.textContent = '';
            }
        }
    }

    parseBoard(boardConfig) {
        const cars = [];
        const carPositions = new Map();
        const wallPositions = [];
        
        console.log('Parsing board config:', boardConfig);
        
        // Display config as a readable grid
        console.log('Board layout:');
        for (let row = 0; row < 6; row++) {
            const start = row * 6;
            const end = start + 6;
            const rowChars = boardConfig.slice(start, end).split('').join(' ');
            const positions = `(positions ${start}-${end-1})`;
            console.log(`Row ${row}: ${rowChars}   ${positions}`);
        }
        
        // Find all positions for each car letter and walls
        for (let i = 0; i < boardConfig.length; i++) {
            const char = boardConfig[i];
            const row = Math.floor(i / 6);
            const col = i % 6;
            
            if (char === 'x') {
                // Handle walls
                console.log(`Found wall at position ${i} (row ${row}, col ${col})`);
                wallPositions.push({ row, col });
            } else if (char !== 'o') {
                // Handle cars (not empty spaces)
                if (!carPositions.has(char)) {
                    carPositions.set(char, []);
                }
                carPositions.get(char).push({ row, col, index: i });
            }
        }
        
        console.log('Car positions map:', carPositions);
        console.log('Wall positions:', wallPositions);
        
        // Create wall objects
        wallPositions.forEach((pos, index) => {
            const wallObj = {
                id: `wall-${index}`,
                color: 'grey',
                orientation: 'horizontal',
                size: 1,
                position: {
                    row: pos.row,
                    col: pos.col
                },
                isWall: true
            };
            console.log(`Creating wall object:`, wallObj);
            cars.push(wallObj);
        });
        
        // Create car objects
        let carId = 0;
        for (const [carLetter, positions] of carPositions) {
            if (positions.length < 2) continue;
            
            positions.sort((a, b) => a.index - b.index);
            const firstPos = positions[0];
            const lastPos = positions[positions.length - 1];
            
            // Determine orientation
            let orientation;
            if (firstPos.row === lastPos.row) {
                orientation = 'horizontal';
            } else if (firstPos.col === lastPos.col) {
                orientation = 'vertical';
            } else {
                continue;
            }
            
            // Determine color - simplified
            let color;
            if (carLetter === 'A') {
                color = 'red';
            } else {
                color = 'blue'; // All other cars are blue
            }
            
            cars.push({
                id: carId++,
                color: color,
                orientation: orientation,
                size: positions.length,
                position: {
                    row: firstPos.row,
                    col: firstPos.col
                },
                isWall: false
            });
        }
        
        return cars;
    }

    clearBoard() {
        console.log('Clearing board...');
        const existingCars = this.gameBoard.querySelectorAll('.car');
        const existingWalls = this.gameBoard.querySelectorAll('.wall');
        console.log(`Found ${existingCars.length} existing cars and ${existingWalls.length} existing walls to remove`);
        
        // Only remove cars and walls, leave grid cells intact
        existingCars.forEach(car => car.remove());
        existingWalls.forEach(wall => wall.remove());
        this.cars = [];
        
        const remainingElements = this.gameBoard.querySelectorAll('.grid-cell');
        console.log(`Board cleared. Remaining grid cells: ${remainingElements.length}`);
    }

    createCars(carData) {
        console.log(`Creating ${carData.length} cars/walls:`, carData);
        carData.forEach(carInfo => {
            const car = this.createCar(carInfo);
            this.cars.push({
                element: car,
                id: carInfo.id,
                color: carInfo.color,
                orientation: carInfo.orientation,
                size: carInfo.size,
                position: { ...carInfo.position }
            });
            this.gameBoard.appendChild(car);
            this.positionCar(car, carInfo.position);
        });
        console.log(`Total elements in game board after creation: ${this.gameBoard.children.length}`);
        console.log(`Cars array length: ${this.cars.length}`);
        
        // Debug: Check what elements are actually in the DOM
        const allElements = Array.from(this.gameBoard.children);
        console.log('All elements in DOM:');
        allElements.forEach((element, index) => {
            console.log(`  ${index}: class="${element.className}", data-car-id="${element.dataset.carId}", gridArea="${element.style.gridArea}"`);
        });
    }

    createCar(carInfo) {
        console.log(`Creating car/wall element:`, carInfo);
        const car = document.createElement('div');
        if (carInfo.isWall) {
            car.className = `wall ${carInfo.color}`;
        } else {
            car.className = `car ${carInfo.color} ${carInfo.orientation}`;
        }
        car.dataset.carId = carInfo.id;
        
        console.log(`Created element with className: ${car.className}, data-car-id: ${car.dataset.carId}`);
        
        // Clear any previous animation styles (in case of level reload after win)
        car.style.transition = '';
        car.style.transform = '';
        
        // Clear any previous animation styles (in case of level reload after win)
        car.style.transition = '';
        car.style.transform = '';
        
        // Only add symbol if it exists (for backward compatibility)
        if (carInfo.symbol) {
            car.textContent = carInfo.symbol;
        }
        
        if (carInfo.size === 3) {
            car.classList.add(`long-${carInfo.orientation}`);
        }
        
        return car;
    }

    positionCar(carElement, position) {
        // Use CSS Grid positioning instead of absolute positioning
        const carData = this.cars.find(car => car.element === carElement);
        if (!carData) return;
        
        this.updateCarGridPosition(carElement, position, carData);
    }

    updateCarGridPosition(carElement, position, carData) {
        // Grid areas are 1-indexed, our positions are 0-indexed
        const startRow = position.row + 1;
        const startCol = position.col + 1;
        
        let endRow, endCol;
        
        if (carData.isWall) {
            // Walls always occupy exactly one cell
            endRow = startRow + 1;
            endCol = startCol + 1;
        } else if (carData.orientation === 'horizontal') {
            endRow = startRow + 1;
            endCol = startCol + carData.size;
        } else {
            endRow = startRow + carData.size;
            endCol = startCol + 1;
        }
        
        // Set the grid area to span the correct cells
        console.log(`Setting grid area for ${carData.isWall ? 'wall' : 'car'} ${carData.id}: ${startRow} / ${startCol} / ${endRow} / ${endCol}`);
        carElement.style.gridArea = `${startRow} / ${startCol} / ${endRow} / ${endCol}`;
        
        // Remove any absolute positioning styles
        carElement.style.position = '';
        carElement.style.left = '';
        carElement.style.top = '';
        carElement.style.width = '';
        carElement.style.height = '';
        carElement.style.zIndex = '';
    }

    handleStart(e) {
        e.preventDefault();
        const target = e.target.closest('.car');
        if (!target) return;

        // Check if this is a wall - don't allow dragging walls
        const carData = this.cars.find(c => c.element === target);
        if (carData && carData.isWall) return;

        this.isDragging = true;
        this.dragCar = target;
        target.classList.add('dragging');

        const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY;
        const rect = target.getBoundingClientRect();

        this.dragOffset = {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    handleMove(e) {
        if (!this.isDragging || !this.dragCar) return;
        
        e.preventDefault();
        const rect = this.gameBoard.getBoundingClientRect();
        const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        
        const carData = this.cars.find(c => c.element === this.dragCar);
        if (!carData) return;
        
        const cellSize = rect.width / this.gridSize;
        const gap = 2;
        const actualCellSize = (rect.width - (gap * (this.gridSize - 1))) / this.gridSize;
        
        let newX = clientX - this.dragOffset.x;
        let newY = clientY - this.dragOffset.y;
        
        // Convert to board-relative coordinates
        newX -= rect.left;
        newY -= rect.top;
        
        let desiredPosition;
        
        // Constrain movement based on car orientation and snap to grid
        if (carData.orientation === 'horizontal') {
            // Only allow horizontal movement
            const gridCol = Math.round(newX / (actualCellSize + gap));
            
            // Allow red car to move beyond the grid by 2 spaces for the exit effect
            let maxCol = this.gridSize - carData.size;
            
            const snappedCol = Math.max(0, Math.min(maxCol, gridCol));
            desiredPosition = { row: carData.position.row, col: snappedCol };
        } else {
            // Only allow vertical movement
            const gridRow = Math.round(newY / (actualCellSize + gap));
            const snappedRow = Math.max(0, Math.min(this.gridSize - carData.size, gridRow));
            desiredPosition = { row: snappedRow, col: carData.position.col };
        }
        
        // Find the furthest valid position the car can slide to without jumping over obstacles
        const reachablePosition = this.getFurthestReachablePosition(carData, desiredPosition);
        
        // Only update position if it's different from current and reachable
        if ((reachablePosition.row !== carData.position.row || reachablePosition.col !== carData.position.col)) {
            // Update the visual position immediately during drag
            this.updateCarGridPosition(this.dragCar, reachablePosition, carData);
        }
    }

    getFurthestReachablePosition(carData, desiredPosition) {
        const currentPos = carData.position;
        
        // If desired position is the same as current, return current
        if (currentPos.row === desiredPosition.row && currentPos.col === desiredPosition.col) {
            return currentPos;
        }
        
        // Determine direction of movement
        let direction;
        if (carData.orientation === 'horizontal') {
            direction = desiredPosition.col > currentPos.col ? 1 : -1; // 1 = right, -1 = left
        } else {
            direction = desiredPosition.row > currentPos.row ? 1 : -1; // 1 = down, -1 = up
        }
        
        // Start from current position and move step by step until we hit an obstacle
        let testPosition = { ...currentPos };
        let lastValidPosition = { ...currentPos };
        
        while (true) {
            // Calculate next position
            if (carData.orientation === 'horizontal') {
                testPosition.col += direction;
                // Stop if we've reached the desired position or gone beyond bounds
                if ((direction > 0 && testPosition.col > desiredPosition.col) ||
                    (direction < 0 && testPosition.col < desiredPosition.col)) {
                    break;
                }
            } else {
                testPosition.row += direction;
                // Stop if we've reached the desired position or gone beyond bounds
                if ((direction > 0 && testPosition.row > desiredPosition.row) ||
                    (direction < 0 && testPosition.row < desiredPosition.row)) {
                    break;
                }
            }
            
            // Check if this position is valid
            if (this.isValidMove(carData, testPosition)) {
                lastValidPosition = { ...testPosition };
            } else {
                // Hit an obstacle, stop here
                break;
            }
        }
        
        return lastValidPosition;
    }

    handleEnd(e) {
        if (!this.isDragging || !this.dragCar) return;
        
        this.isDragging = false;
        this.dragCar.classList.remove('dragging');
        
        const carData = this.cars.find(c => c.element === this.dragCar);
        if (!carData) return;
        
        // Get the current grid position from the car's grid area
        const gridArea = this.dragCar.style.gridArea;
        if (gridArea) {
            const parts = gridArea.split(' / ');
            const newPosition = {
                row: parseInt(parts[0]) - 1, // Convert back to 0-indexed
                col: parseInt(parts[1]) - 1
            };
            
            // Check if position actually changed
            const positionChanged = (
                newPosition.row !== carData.position.row || 
                newPosition.col !== carData.position.col
            );
            
            if (positionChanged && this.isValidMove(carData, newPosition)) {
                this.moveCar(carData, newPosition);
                this.moves++;
                this.updateUI();
                this.checkWinCondition();
            } else if (!this.isValidMove(carData, newPosition)) {
                // Snap back to original position if invalid move
                this.positionCar(this.dragCar, carData.position);
            }
        }
        
        this.dragCar = null;
    }

    getCarPixelPosition(gridPosition) {
        const gap = 2;
        const actualCellSize = (this.gameBoard.offsetWidth - (gap * (this.gridSize - 1))) / this.gridSize;
        return {
            left: gridPosition.col * (actualCellSize + gap),
            top: gridPosition.row * (actualCellSize + gap)
        };
    }

    getGridPositionFromPixels(pixelX, pixelY) {
        const gap = 2;
        const actualCellSize = (this.gameBoard.offsetWidth - (gap * (this.gridSize - 1))) / this.gridSize;
        const col = Math.round(pixelX / (actualCellSize + gap));
        const row = Math.round(pixelY / (actualCellSize + gap));
        
        return { 
            row: Math.max(0, Math.min(this.gridSize - 1, row)), 
            col: Math.max(0, Math.min(this.gridSize - 1, col)) 
        };
    }

    isValidMove(carData, newPosition) {
        // Check boundaries
        if (carData.orientation === 'horizontal') {
            if (newPosition.col + carData.size > this.gridSize) return false;
        } else {
            if (newPosition.row + carData.size > this.gridSize) return false;
        }
        
        // Check for collisions with other cars
        return !this.checkCollision(carData.id, newPosition, carData.orientation, carData.size);
    }

    checkCollision(carId, position, orientation, size) {
        const occupiedCells = this.getOccupiedCells(carId);
        const newCells = this.getCarCells(position, orientation, size);
        
        return newCells.some(cell => 
            occupiedCells.some(occupied => 
                occupied.row === cell.row && occupied.col === cell.col
            )
        );
    }

    getOccupiedCells(excludeCarId) {
        const cells = [];
        this.cars.forEach(car => {
            if (car.id === excludeCarId) return;
            cells.push(...this.getCarCells(car.position, car.orientation, car.size));
        });
        return cells;
    }

    getCarCells(position, orientation, size) {
        const cells = [];
        for (let i = 0; i < size; i++) {
            if (orientation === 'horizontal') {
                cells.push({ row: position.row, col: position.col + i });
            } else {
                cells.push({ row: position.row + i, col: position.col });
            }
        }
        return cells;
    }

    moveCar(carData, newPosition) {
        carData.position = newPosition;
        this.positionCar(carData.element, newPosition);
    }

    checkWinCondition() {
        const redCar = this.cars.find(car => car.color === 'red');
        if (!redCar) return;
        
        // Red car wins if it reaches the right edge (position.col + size >= gridSize)
        if (redCar.position.col + redCar.size >= this.gridSize) {
            this.animateRedCarExit(redCar);
        }
    }

    animateRedCarExit(redCar) {
        // Disable further dragging
        this.isDragging = false;
        this.dragCar = null;
        
        // Get the red car element
        const redCarElement = redCar.element;
        
        // Add CSS transition for smooth animation
        redCarElement.style.transition = 'transform 1s ease-in-out';
        
        // Animate the car sliding off to the right
        redCarElement.style.transform = 'translateX(200px)';
        
        // Trigger celebration after animation starts
        setTimeout(() => {
            this.celebrateWin();
        }, 500);
        
        // Don't reset the transform - let the car stay off-screen
        // The transform will be cleared when a new level loads
    }

    celebrateWin() {
        document.getElementById('game-status').textContent = '🎉 Level Complete! 🎉';
        
        // Confetti animation
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
        
        // Victory pulse animation
        this.gameBoard.classList.add('victory-pulse');
        setTimeout(() => {
            this.gameBoard.classList.remove('victory-pulse');
        }, 600);
        
        // Auto-advance to next level after a delay
        setTimeout(() => {
            this.loadRandomPuzzle();
        }, 3000);
    }

    showHint() {
        if (!this.showHints || !this.currentPuzzle) return;
        
        const minMoves = this.currentPuzzle.minMoves;
        const hints = [
            "Just slide the red car to the right!",
            "Move blocking cars to clear the path!",
            "Think about the sequence of moves!",
            "Plan your moves carefully!",
            "This puzzle requires some strategy!",
            "Getting trickier! Take your time!",
            "This is challenging! Think ahead!",
            "Advanced puzzle! Consider all blocking cars!",
            "Expert level! This requires careful planning!"
        ];
        
        const hintIndex = Math.min(Math.floor((minMoves - 1) / 2), hints.length - 1);
        const hintText = document.getElementById('hint-text');
        hintText.textContent = hints[hintIndex];
        
        // Auto-hide hint after 8 seconds
        setTimeout(() => {
            hintText.textContent = '';
        }, 8000);
    }

    updateHintVisibility() {
        const hintContainer = document.getElementById('hint-container');
        hintContainer.style.display = this.showHints ? 'flex' : 'none';
    }

    updateUI() {
        const minMoves = this.currentPuzzle ? this.currentPuzzle.minMoves : '?';
        console.log('updateUI called - currentPuzzle:', this.currentPuzzle, 'minMoves:', minMoves);
        
        const levelText = document.getElementById('level-text');
        const movesText = document.getElementById('moves-text');
        
        if (levelText) {
            levelText.textContent = `Puzzle (Min: ${minMoves} moves)`;
        }
        if (movesText) {
            movesText.textContent = `Moves: ${this.moves}`;
        }
        
        if (this.moves === 0) {
            const gameStatus = document.getElementById('game-status');
            if (gameStatus) {
                gameStatus.textContent = 'Move the red car to the exit! 🚗➡️';
            }
        } else {
            const gameStatus = document.getElementById('game-status');
            if (gameStatus) {
                gameStatus.textContent = ``;
            }
        }
    }

    updateNavigationButtons() {
        // Always enable both buttons for random puzzle selection
        const prevButton = document.getElementById('previous-level');
        const nextButton = document.getElementById('next-level');
        prevButton.disabled = false;
        nextButton.disabled = false;
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TrafficJamGame();
});

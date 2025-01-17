// ...existing code...

document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game');
    const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');
    let gameMode = 'random';
    let board = Array(9).fill(null);
    let currentPlayer = 'X';

    gameModeRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            gameMode = event.target.value;
            startNewGame();
        });
    });

    document.getElementById('try-again-button').addEventListener('click', startNewGame);

    function startNewGame() {
        board = Array(9).fill(null);
        currentPlayer = 'X';
        renderBoard();
    }

    function renderBoard() {
        gameContainer.innerHTML = '';
        board.forEach((cell, index) => {
            const cellElement = document.createElement('div');
            cellElement.classList.add('cell');
            if (cell === 'X') cellElement.classList.add('x');
            if (cell === 'O') cellElement.classList.add('o');
            cellElement.textContent = cell;
            cellElement.addEventListener('click', () => handleCellClick(index));
            gameContainer.appendChild(cellElement);
        });
    }

    function handleCellClick(index) {
        if (board[index] || checkWinner(board) || isDraw(board)) return;
        makeMove(index);
        
        const winner = checkWinner(board);
        console.log('Winner detected:', winner); // Add logging
        if (winner) {
            announceWinner(winner);
            return;
        }
        if (isDraw(board)) {
            announceDraw();
            return;
        }

        if (gameMode !== 'local' && currentPlayer === 'O') {
            setTimeout(() => {
                if (gameMode === 'random') makeRandomMove();
                else if (gameMode === 'perfect') makePerfectMove();
            }, 500);
        }
    }

    function makeMove(index) {
        board[index] = currentPlayer;
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        renderBoard();
    }

    function makeRandomMove() {
        const emptyCells = board.map((cell, index) => cell === null ? index : null).filter(index => index !== null);
        const randomIndex = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        board[randomIndex] = 'O';
        currentPlayer = 'X';
        renderBoard();
        
        // Check for winner after computer move
        const winner = checkWinner(board);
        if (winner) {
            announceWinner(winner);
            return;
        }
        if (isDraw(board)) {
            announceDraw();
        }
    }

    function makePerfectMove() {
        const bestMove = findBestMove(board, 'O');
        board[bestMove] = 'O';
        currentPlayer = 'X';
        renderBoard();
        
        // Check for winner after computer move
        const winner = checkWinner(board);
        if (winner) {
            announceWinner(winner);
            return;
        }
        if (isDraw(board)) {
            announceDraw();
        }
    }

    function findBestMove(board, player) {
        const opponent = player === 'O' ? 'X' : 'O';
        
        // Base cases
        const winner = checkWinner(board);
        if (winner === player) return 10;
        if (winner === opponent) return -10;
        if (isDraw(board)) return 0;
        
        // Recursive case
        let bestScore = player === 'O' ? -Infinity : Infinity;
        let bestMove = -1;
        
        board.forEach((cell, index) => {
            if (!cell) {
                board[index] = player;
                const score = minimax(board, 0, false, player);
                board[index] = null;
                
                if (player === 'O' && score > bestScore) {
                    bestScore = score;
                    bestMove = index;
                } else if (player === 'X' && score < bestScore) {
                    bestScore = score;
                    bestMove = index;
                }
            }
        });
        
        return bestMove;
    }

    function minimax(board, depth, isMaximizing, player) {
        const opponent = player === 'O' ? 'X' : 'O';
        const winner = checkWinner(board);
        
        if (winner === player) return 10 - depth;
        if (winner === opponent) return depth - 10;
        if (isDraw(board)) return 0;
        
        if (isMaximizing) {
            let bestScore = -Infinity;
            board.forEach((cell, index) => {
                if (!cell) {
                    board[index] = player;
                    bestScore = Math.max(bestScore, minimax(board, depth + 1, false, player));
                    board[index] = null;
                }
            });
            return bestScore;
        } else {
            let bestScore = Infinity;
            board.forEach((cell, index) => {
                if (!cell) {
                    board[index] = opponent;
                    bestScore = Math.min(bestScore, minimax(board, depth + 1, true, player));
                    board[index] = null;
                }
            });
            return bestScore;
        }
    }

    function checkWinner(board) {
        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (const combination of winningCombinations) {
            const [a, b, c] = combination;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    function isDraw(board) {
        return !board.includes(null) && !checkWinner(board);
    }

    var scalar = 10;
    var confettiX = confetti.shapeFromText({ 
        text: 'X', 
        scalar,
        color: '#e74c3c',  // red
        fontFamily: 'Varela Round'
    });
    var confettiO = confetti.shapeFromText({ 
        text: 'O', 
        scalar,
        color: '#3498db',  // blue
        fontFamily: 'Varela Round'
    });
    
    function announceWinner(winner) {
        console.log('Announcing winner:', winner);
        confetti({
            shapes: [winner === 'X' ? confettiX : confettiO],
            scalar,
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8 },
            gravity: 2,    // Make particles fall faster
            decay: 0.90,   // Slower opacity decay (almost none)
            opacity: 1     // Start at full opacity
        });
    }

    function announceDraw() {
        console.log('Announcing draw');
        confetti({
            shapes: [confettiX, confettiO],
            scalar,
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8 },
            gravity: 2,    // Make particles fall faster
            decay: 0.90,   // Slower opacity decay (almost none)
            opacity: 1     // Start at full opacity
        });
    }

    startNewGame();
});

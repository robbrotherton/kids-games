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

function scramble(b, k=4){
  for (let i=0;i<k;i++){
    const r = (Math.random()*N)|0, c = (Math.random()*N)|0;
    press(b,r,c);
  }
  return b;
}

// solver: enumerate first-row presses (2^4=16), then "chase" lights down.
// returns shortest solution as list of {r,c}, or null if none (shouldn’t happen if you scrambled)
function solve4x4(initial){
  let best = null;
  for (let mask=0; mask<16; mask++){
    const b = clone(initial);
    const moves = [];
    // apply first-row presses per mask
    for (let c=0;c<N;c++) if ((mask>>c)&1){ press(b,0,c); moves.push({r:0,c}); }
    // chase rows 1..3
    for (let r=0;r<N-1;r++){
      for (let c=0;c<N;c++){
        if (b[r][c]){ press(b,r+1,c); moves.push({r:r+1,c}); }
      }
    }
    // check last row all off
    const ok = b[N-1].every(v=>!v);
    if (ok && (!best || moves.length < best.length)) best = moves;
  }
  return best; // array of presses in order
}

// example usage
let board = mk();
scramble(board, 5);
let solution = solve4x4(board); // for hints or to gate difficulty

// next-hint: pick the first move whose row has any lit cell above it (simple, kid-friendly)
function nextHint(b){
  const sol = solve4x4(b);
  return sol ? sol[0] : null;
}
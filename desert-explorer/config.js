export const DIFFICULTY_SETTINGS = {
    easy: { width: 5, height: 4, numMines: 4 },
    medium: { width: 6, height: 6, numMines: 7 },
    hard: { width: 8, height: 8, numMines: 12 }
};

export let currentDifficulty = 'easy';
export let width = DIFFICULTY_SETTINGS[currentDifficulty].width;
export let height = DIFFICULTY_SETTINGS[currentDifficulty].height;
export let numMines = DIFFICULTY_SETTINGS[currentDifficulty].numMines;

export function getCellSize() {
    return Math.min(40, Math.floor(320 / Math.max(width, height)));
}

export function setDifficulty(difficulty) {
    if (DIFFICULTY_SETTINGS[difficulty]) {
        currentDifficulty = difficulty;
        width = DIFFICULTY_SETTINGS[difficulty].width;
        height = DIFFICULTY_SETTINGS[difficulty].height;
        numMines = DIFFICULTY_SETTINGS[difficulty].numMines;
    }
}
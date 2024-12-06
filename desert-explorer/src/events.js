import { toggleFlag, reveal } from './game.js';

export function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', 'flag');
    e.dataTransfer.effectAllowed = 'move';
}

export function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary to allow drop
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

export function handleDrop(e, x, y) {
    e.preventDefault();
    const cellData = grid[y][x];
    
    if (!cellData.revealed && !cellData.flagged) {
        // Don't remove the flag from the bottom bar, just remove dragging class
        document.querySelector('.draggable-flag').classList.remove('dragging');
        toggleFlag(x, y, false, false);
    }
}


export function openSettings() {
    const overlay = document.getElementById('settings-overlay');
    settingsVisible = !settingsVisible;
    
    if (settingsVisible) {
        overlay.classList.add('visible');
    } else {
        overlay.classList.remove('visible');
    }
}
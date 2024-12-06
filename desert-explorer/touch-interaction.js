import { grid, reveal, toggleFlag } from "./desert-explorer.js";

let longPressTimer = null;
let wasDragging = false;  // Add this flag
let touchStartTime = 0;   // Add this to track tap duration
let touchTarget = null;

export function handleLongPressStart(event) {
    event.preventDefault();
    event.stopPropagation();
    
    const x = +event.currentTarget.dataset.x;
    const y = +event.currentTarget.dataset.y;
    
    touchStartTime = Date.now();
    wasDragging = false;

    longPressTimer = setTimeout(() => {
        wasDragging = true;  // Mark that we triggered the long press
        toggleFlag(x, y);
    }, 500);
}

export function handleLongPressEnd(event) {
    event.preventDefault();
    event.stopPropagation();
    
    clearTimeout(longPressTimer);
    
    // If it was a short tap (less than 500ms) and not a drag operation
    if (Date.now() - touchStartTime < 500 && !wasDragging) {
        const x = +event.currentTarget.dataset.x;
        const y = +event.currentTarget.dataset.y;
        reveal(x, y, 0);
    }
    
    wasDragging = false;
}

export function handleFlagTouchStart(e) {
    e.preventDefault();
    touchTarget = e.target;
    touchTarget.classList.add('dragging');
}

export function handleFlagTouchMove(e) {
    if (!touchTarget) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const cell = elements.find(el => el.classList.contains('cell'));
    
    // Highlight potential drop target
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('drag-over'));
    if (cell) {
        cell.classList.add('drag-over');
    }
}

export function handleFlagTouchEnd(e) {
    if (!touchTarget) return;
    e.preventDefault();
    
    const touch = e.changedTouches[0];
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const cell = elements.find(el => el.classList.contains('cell'));
    
    if (cell) {
        const x = +cell.dataset.x;
        const y = +cell.dataset.y;
        const cellData = grid[y][x];
        
        if (!cellData.revealed && !cellData.flagged) {
            touchTarget.classList.remove('dragging');
            toggleFlag(x, y, false, false);
        }
    }
    
    touchTarget.classList.remove('dragging');
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('drag-over'));
    touchTarget = null;
}

export function addFlagListeners() {
    // Add event listeners to the single flag
    const flag = document.getElementById('bottom-bar').querySelector('.draggable-flag');
    flag.addEventListener('dragstart', handleDragStart);
    flag.addEventListener('dragend', handleDragEnd);
    flag.addEventListener('touchstart', handleFlagTouchStart);
    flag.addEventListener('touchmove', handleFlagTouchMove);
    flag.addEventListener('touchend', handleFlagTouchEnd);
}

// Add these new drag and drop handler functions
function handleDragStart(e) {
    e.target.classList.add('dragging');
    e.dataTransfer.setData('text/plain', 'flag');
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

export function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // Necessary to allow drop
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDrop(e, x, y) {
    e.preventDefault();
    const cellData = grid[y][x];
    
    if (!cellData.revealed && !cellData.flagged) {
        // Don't remove the flag from the bottom bar, just remove dragging class
        document.querySelector('.draggable-flag').classList.remove('dragging');
        toggleFlag(x, y, false, false);
    }
}
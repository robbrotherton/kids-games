import { init } from './game.js';
import { setDifficulty } from './config.js';
import { initializeUI } from './ui.js';
import { subscribe, EventTypes } from './eventBus.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize UI event subscribers first
    initializeUI();
    
    // Then start the game
    init();
});

// Game reset handler
document.getElementById('try-again-button')?.addEventListener('click', () => {
    init();
});

// Difficulty changes
document.querySelectorAll('.difficulty-options input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        setDifficulty(e.target.value);
        init();
    });
});

// Optional: Subscribe to game events for debugging
if (process.env.NODE_ENV === 'development') {
    subscribe(EventTypes.GAME_INIT, data => console.log('Game initialized:', data));
    subscribe(EventTypes.GAME_OVER, data => console.log('Game over:', data));
}
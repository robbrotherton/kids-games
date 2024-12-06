import { init } from './board.js';
import { setDifficulty } from './config.js';

document.addEventListener('DOMContentLoaded', () => {
    init();
});

// difficulty changes
document.querySelectorAll('.difficulty-options input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        setDifficulty(e.target.value);
        init();
    });
});

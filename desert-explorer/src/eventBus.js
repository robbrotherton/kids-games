
const subscribers = new Map();

export const EventTypes = {
    CELL_REVEALED: 'cellRevealed',
    FLAG_TOGGLED: 'flagToggled',
    GAME_INIT: 'gameInit',
    GAME_OVER: 'gameOver',
    FLAGS_UPDATED: 'flagsUpdated',
    MESSAGE_UPDATED: 'messageUpdated'
};

export function subscribe(event, callback) {
    if (!subscribers.has(event)) {
        subscribers.set(event, new Set());
    }
    subscribers.get(event).add(callback);
}

export function publish(event, data) {
    if (subscribers.has(event)) {
        subscribers.get(event).forEach(callback => callback(data));
    }
}

export function unsubscribe(event, callback) {
    if (subscribers.has(event)) {
        subscribers.get(event).delete(callback);
    }
}
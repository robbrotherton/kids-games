
export function getNeighbors(x, y, width, height) {
    return [
        [x - 1, y - 1], [x, y - 1], [x + 1, y - 1],
        [x - 1, y], [x + 1, y],
        [x - 1, y + 1], [x, y + 1], [x + 1, y + 1],
    ].filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < width && ny < height);
}

export function generateBlobPoints(width, height) {
    // Blob generation logic from original file
    // ...
}

export function createBlobPath(points) {
    // Blob path creation logic from original file
    // ...
}
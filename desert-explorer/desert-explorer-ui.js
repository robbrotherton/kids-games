function generateBlobPoints(width, height, numPoints = 30) {
    // Calculate actual desired blob size based on grid cells + padding
    const cellSize = 40;  // Match cell size from CSS
    const padding = 40;   // Padding around grid
    const rectWidth = width * cellSize + padding * 2;
    const rectHeight = height * cellSize + padding * 2;
    
    const points = [];
    const baseJitter = 20; // Actual pixel value for jitter
    const waveFreq = 3;   // Reduced for gentler waves
    const waveAmp = 10;   // Actual pixel value for wave size
    
    for (let i = 0; i < numPoints; i++) {
        const t = i / numPoints;
        let x, y;
        
        // Generate base rectangle points
        if (t < 0.25) {
            x = t * 4 * rectWidth;
            y = 0;
        } else if (t < 0.5) {
            x = rectWidth;
            y = (t - 0.25) * 4 * rectHeight;
        } else if (t < 0.75) {
            x = (1 - (t - 0.5) * 4) * rectWidth;
            y = rectHeight;
        } else {
            x = 0;
            y = (1 - (t - 0.75) * 4) * rectHeight;
        }
        
        // Add organic deformation
        const angle = Math.atan2(y - rectHeight/2, x - rectWidth/2);
        const jitter = Math.random() * baseJitter;
        const wave = Math.sin(t * Math.PI * 2 * waveFreq) * waveAmp;
        
        x += Math.cos(angle) * (jitter + wave);
        y += Math.sin(angle) * (jitter + wave);
        
        points.push({ x, y });
    }
    
    return { 
        points,
        width: rectWidth,
        height: rectHeight
    };
}

function createBlobPath(points) {
    const smooth = 0.2;  // reduced for sharper corners
    let path = `M ${points[0].x},${points[0].y}`;

    // Create smoother curves by using more control points
    for (let i = 0; i < points.length; i++) {
        const p0 = points[(i - 1 + points.length) % points.length];
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        const p3 = points[(i + 2) % points.length];

        // Use four points to calculate control points
        const cp1x = p1.x + (p2.x - p0.x) * smooth;
        const cp1y = p1.y + (p2.y - p0.y) * smooth;
        const cp2x = p2.x - (p3.x - p1.x) * smooth;
        const cp2y = p2.y - (p3.y - p1.y) * smooth;

        path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path + 'Z';
}
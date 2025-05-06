// Base level configuration
export const createLevelConfig = (colors, pattern, speed) => ({
    colors,
    pattern,
    speed: Math.min(speed, 4.5), // Cap speed at 4.5 (level 6 speed)
    brickRowCount: 6,
    brickColumnCount: 9,
    brickWidth: 70,
    brickHeight: 20,
    brickPadding: 8,
    brickOffsetTop: 50
});

// Pattern types
export const PATTERNS = {
    STANDARD: 'standard',
    ALTERNATE: 'alternate',
    PYRAMID: 'pyramid',
    DIAMOND: 'diamond',
    ZIGZAG: 'zigzag',
    CHECKERBOARD: 'checkerboard',
    SPIRAL: 'spiral',
    CROSS: 'cross',
    DOUBLE: 'double',
    CHALLENGE: 'challenge'
}; 
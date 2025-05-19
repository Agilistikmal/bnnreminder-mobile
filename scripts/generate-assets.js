const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const ICON_SIZE = 1024;
const SPLASH_SIZE = 1242;

function generateIcon() {
    const canvas = createCanvas(ICON_SIZE, ICON_SIZE);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(0, 0, ICON_SIZE, ICON_SIZE);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 120px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BNN', ICON_SIZE/2, ICON_SIZE/2 - 40);
    ctx.fillText('KGB', ICON_SIZE/2, ICON_SIZE/2 + 40);

    return canvas.toBuffer();
}

function generateSplash() {
    const canvas = createCanvas(SPLASH_SIZE, SPLASH_SIZE);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#2196F3';
    ctx.fillRect(0, 0, SPLASH_SIZE, SPLASH_SIZE);

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 140px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BNN Reminder', SPLASH_SIZE/2, SPLASH_SIZE/2);

    return canvas.toBuffer();
}

// Ensure directory exists
const assetsDir = path.join(__dirname, '../assets/images');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate and save files
fs.writeFileSync(path.join(assetsDir, 'icon.png'), generateIcon());
fs.writeFileSync(path.join(assetsDir, 'splash.png'), generateSplash());

console.log('Generated icon.png and splash.png in assets/images/'); 
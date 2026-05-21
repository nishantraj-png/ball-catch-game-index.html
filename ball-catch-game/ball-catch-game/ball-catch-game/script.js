// Game variables
let gameState = 'start'; // start, playing, paused, gameOver
let score = 0;
let playerName = 'Player';
let currentLevel = 0;
let gameSpeed = 1;

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Resize canvas to fit window
function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game objects
const catcher = {
    x: canvas.width / 2,
    y: canvas.height - 80,
    radius: 40,
    speedX: 0,
    maxSpeed: 8
};

let balls = [];
let spawnRate = 2;
let ballSpawnCounter = 0;

// Level configuration
const levels = [
    { name: 'Easy', speed: 2, spawnRate: 1.5, minRadius: 15, maxRadius: 25 },
    { name: 'Medium', speed: 3.5, spawnRate: 2.5, minRadius: 12, maxRadius: 20 },
    { name: 'Hard', speed: 5, spawnRate: 3.5, minRadius: 10, maxRadius: 18 },
    { name: 'Extreme', speed: 6.5, spawnRate: 4.5, minRadius: 8, maxRadius: 15 },
    { name: 'Insane', speed: 8, spawnRate: 5.5, minRadius: 8, maxRadius: 15 }
];

// Color palette
const colors = [
    'rgba(255, 107, 107, 0.9)',
    'rgba(255, 193, 7, 0.9)',
    'rgba(76, 175, 80, 0.9)',
    'rgba(33, 150, 243, 0.9)',
    'rgba(156, 39, 176, 0.9)',
    'rgba(255, 87, 34, 0.9)'
];

// DOM Elements
const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const pauseScreen = document.getElementById('pauseScreen');

const playerNameInput = document.getElementById('playerName');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resumeBtn = document.getElementById('resumeBtn');
const retryBtn = document.getElementById('retryBtn');
const homeBtn = document.getElementById('homeBtn');
const quitBtn = document.getElementById('quitBtn');

const playerNameDisplay = document.getElementById('playerNameDisplay');
const scoreDisplay = document.getElementById('scoreDisplay');
const difficultyDisplay = document.getElementById('difficultyDisplay');
const pauseScore = document.getElementById('pauseScore');

// Event Listeners
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
retryBtn.addEventListener('click', restartGame);
homeBtn.addEventListener('click', goHome);
quitBtn.addEventListener('click', goHome);

// Mouse/Touch tracking
let mouseX = canvas.width / 2;
let mouseY = canvas.height - 80;

document.addEventListener('mousemove', (e) => {
    if (gameState === 'playing') {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        
        // Keep catcher in bounds
        mouseX = Math.max(catcher.radius, Math.min(canvas.width - catcher.radius, mouseX));
        mouseY = Math.max(catcher.radius, Math.min(canvas.height - catcher.radius, mouseY));
    }
});

// Touch support
document.addEventListener('touchmove', (e) => {
    if (gameState === 'playing') {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        mouseX = e.touches[0].clientX - rect.left;
        mouseY = e.touches[0].clientY - rect.top;
        
        // Keep catcher in bounds
        mouseX = Math.max(catcher.radius, Math.min(canvas.width - catcher.radius, mouseX));
        mouseY = Math.max(catcher.radius, Math.min(canvas.height - catcher.radius, mouseY));
    }
}, { passive: false });

// Ball class
class Ball {
    constructor() {
        const levelConfig = levels[currentLevel];
        this.x = Math.random() * (canvas.width - 40) + 20;
        this.y = -30;
        this.radius = Math.random() * (levelConfig.maxRadius - levelConfig.minRadius) + levelConfig.minRadius;
        this.speedY = levelConfig.speed * gameSpeed;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.caught = false;
    }

    update() {
        this.y += this.speedY;
    }

    draw() {
        // Ball glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        
        // Ball
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x - this.radius / 3, this.y - this.radius / 3, this.radius / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }

    isBelow() {
        return this.y - this.radius > canvas.height;
    }

    isCaught(catcher) {
        const dx = this.x - catcher.x;
        const dy = this.y - catcher.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < catcher.radius + this.radius;
    }
}

function startGame() {
    playerName = playerNameInput.value.trim() || 'Player';
    playerNameDisplay.textContent = playerName;
    
    // Reset game state
    score = 0;
    currentLevel = 0;
    gameSpeed = 1;
    balls = [];
    ballSpawnCounter = 0;
    gameState = 'playing';
    
    // Update UI
    scoreDisplay.textContent = score;
    updateDifficulty();
    
    // Show game screen
    showScreen(gameScreen);
    
    // Start game loop
    gameLoop();
}

function pauseGame() {
    gameState = 'paused';
    pauseScore.textContent = `Current Score: ${score}`;
    showScreen(pauseScreen);
}

function resumeGame() {
    gameState = 'playing';
    showScreen(gameScreen);
    gameLoop();
}

function endGame() {
    gameState = 'gameOver';
    showGameOverScreen();
}

function restartGame() {
    playerNameInput.value = '';
    playerNameInput.focus();
    showScreen(startScreen);
}

function goHome() {
    playerNameInput.value = '';
    playerNameInput.focus();
    showScreen(startScreen);
}

function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screen.classList.add('active');
}

function showGameOverScreen() {
    document.getElementById('resultPlayerName').textContent = playerName;
    document.getElementById('resultScore').textContent = score;
    document.getElementById('resultLevel').textContent = levels[currentLevel].name;
    showScreen(gameOverScreen);
}

function updateDifficulty() {
    // Update level based on score
    let newLevel = 0;
    if (score >= 50) newLevel = 1;
    if (score >= 150) newLevel = 2;
    if (score >= 300) newLevel = 3;
    if (score >= 500) newLevel = 4;
    
    if (newLevel !== currentLevel) {
        currentLevel = newLevel;
    }
    
    const levelConfig = levels[currentLevel];
    difficultyDisplay.textContent = `Level: ${levelConfig.name}`;
}

function spawnBall() {
    balls.push(new Ball());
}

function update() {
    // Update catcher position (smooth movement)
    catcher.x = mouseX;
    catcher.y = mouseY;
    
    // Spawn balls
    ballSpawnCounter++;
    if (ballSpawnCounter > 60 / levels[currentLevel].spawnRate) {
        spawnBall();
        ballSpawnCounter = 0;
    }
    
    // Update and check balls
    for (let i = balls.length - 1; i >= 0; i--) {
        balls[i].update();
        
        // Check if ball is caught
        if (!balls[i].caught && balls[i].isCaught(catcher)) {
            balls[i].caught = true;
            score += (currentLevel + 1) * 10;
            scoreDisplay.textContent = score;
            updateDifficulty();
            balls.splice(i, 1);
        }
        // Check if ball escaped
        else if (balls[i].isBelow()) {
            endGame();
            return;
        }
    }
}

function draw() {
    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(102, 126, 234, 0.1)');
    gradient.addColorStop(1, 'rgba(118, 75, 162, 0.1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw balls
    for (let ball of balls) {
        ball.draw();
    }
    
    // Draw catcher (hand cursor)
    ctx.shadowColor = 'rgba(102, 126, 234, 0.8)';
    ctx.shadowBlur = 20;
    
    // Outer circle
    ctx.fillStyle = 'rgba(102, 126, 234, 0.3)';
    ctx.beginPath();
    ctx.arc(catcher.x, catcher.y, catcher.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner circle (solid)
    ctx.fillStyle = 'rgba(102, 126, 234, 0.6)';
    ctx.beginPath();
    ctx.arc(catcher.x, catcher.y, catcher.radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Center dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(catcher.x, catcher.y, catcher.radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

function gameLoop() {
    if (gameState === 'playing') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    } else if (gameState === 'paused') {
        draw();
    }
}

// Focus on input field on load
playerNameInput.focus();

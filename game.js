const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const playerScoreDisplay = document.getElementById('playerScore');
const computerScoreDisplay = document.getElementById('computerScore');
const resetBtn = document.getElementById('resetBtn');
const statusText = document.getElementById('statusText');

// Canvas scaling for responsive design
function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const maxWidth = Math.min(800, window.innerWidth - 40);
    const aspectRatio = 800 / 400;
    const width = maxWidth;
    const height = width / aspectRatio;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game Objects
const paddleWidth = 10;
const paddleHeight = 80;
const ballRadius = 8;

const player = {
    x: 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    dy: 0,
    speed: 6
};

const computer = {
    x: canvas.width - paddleWidth - 10,
    y: canvas.height / 2 - paddleHeight / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 4
};

const ball = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    dx: 5,
    dy: 5,
    radius: ballRadius
};

let playerScore = 0;
let computerScore = 0;
let gameRunning = false;
let gameStarted = false;

// Input handling
const keys = {};
let mouseY = canvas.height / 2;
let touchStartY = 0;
let touchY = canvas.height / 2;
let isTouching = false;

// Keyboard events
document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !gameRunning) {
        startGame();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Mouse events
document.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    mouseY = (e.clientY - rect.top) * scaleY;
});

canvas.addEventListener('click', () => {
    if (!gameRunning) {
        startGame();
    }
});

// Touch events
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    gameRunning = true;
    gameStarted = true;
    statusText.textContent = 'Game Running...';
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    touchStartY = (touch.clientY - rect.top) * scaleY;
    touchY = touchStartY;
    isTouching = true;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const scaleY = canvas.height / rect.height;
    touchY = (touch.clientY - rect.top) * scaleY;
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    isTouching = false;
}, { passive: false });

// Prevent default touch behaviors
document.addEventListener('touchmove', (e) => {
    if (e.target === canvas || canvas.contains(e.target)) {
        e.preventDefault();
    }
}, { passive: false });

function startGame() {
    if (!gameRunning) {
        gameRunning = true;
        gameStarted = true;
        statusText.textContent = 'Game Running...';
        resetBall();
    }
}

function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.dx = (Math.random() > 0.5 ? 1 : -1) * 5;
    ball.dy = (Math.random() - 0.5) * 8;
}

function resetGame() {
    playerScore = 0;
    computerScore = 0;
    gameRunning = false;
    gameStarted = false;
    statusText.textContent = 'Game Ready - Click to Start';
    playerScoreDisplay.textContent = playerScore;
    computerScoreDisplay.textContent = computerScore;
    resetBall();
}

function updatePlayerPaddle() {
    // Keyboard control
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }

    // Mouse control
    if (mouseY - player.height / 2 > 0 && mouseY + player.height / 2 < canvas.height) {
        player.y = mouseY - player.height / 2;
    }

    // Touch control (left side of screen)
    if (isTouching && touchY > 0 && touchY < canvas.width / 2) {
        if (touchY - player.height / 2 > 0 && touchY + player.height / 2 < canvas.height) {
            player.y = touchY - player.height / 2;
        }
    }
}

function updateComputerPaddle() {
    const computerCenter = computer.y + computer.height / 2;
    const ballCenter = ball.y;

    if (computerCenter < ballCenter - 35) {
        computer.y += computer.speed;
    } else if (computerCenter > ballCenter + 35) {
        computer.y -= computer.speed;
    }

    // Keep within bounds
    if (computer.y < 0) computer.y = 0;
    if (computer.y + computer.height > canvas.height) {
        computer.y = canvas.height - computer.height;
    }
}

function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // Top and bottom collision
    if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
        ball.dy *= -1;
        ball.y = ball.y - ball.radius < 0 ? ball.radius : canvas.height - ball.radius;
    }

    // Paddle collisions
    if (
        ball.x - ball.radius < player.x + player.width &&
        ball.y > player.y &&
        ball.y < player.y + player.height
    ) {
        ball.dx = Math.abs(ball.dx);
        ball.x = player.x + player.width + ball.radius;
        ball.dy += (ball.y - (player.y + player.height / 2)) * 0.05;
    }

    if (
        ball.x + ball.radius > computer.x &&
        ball.y > computer.y &&
        ball.y < computer.y + computer.height
    ) {
        ball.dx = -Math.abs(ball.dx);
        ball.x = computer.x - ball.radius;
        ball.dy += (ball.y - (computer.y + computer.height / 2)) * 0.05;
    }

    // Scoring
    if (ball.x - ball.radius < 0) {
        computerScore++;
        computerScoreDisplay.textContent = computerScore;
        statusText.textContent = `Computer scored! | Score: Player ${playerScore} - ${computerScore} Computer`;
        gameRunning = false;
        setTimeout(resetBall, 1500);
        setTimeout(() => {
            if (gameStarted) gameRunning = true;
        }, 1500);
    }

    if (ball.x + ball.radius > canvas.width) {
        playerScore++;
        playerScoreDisplay.textContent = playerScore;
        statusText.textContent = `Player scored! | Score: Player ${playerScore} - ${computerScore} Computer`;
        gameRunning = false;
        setTimeout(resetBall, 1500);
        setTimeout(() => {
            if (gameStarted) gameRunning = true;
        }, 1500);
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Center line
    ctx.strokeStyle = '#fff';
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw paddles
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillRect(computer.x, computer.y, computer.width, computer.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
}

function update() {
    if (gameRunning) {
        updatePlayerPaddle();
        updateComputerPaddle();
        updateBall();
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

resetBtn.addEventListener('click', resetGame);

// Start the game loop
gameLoop();

// Prevent accidental scrolling
document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

// Handle device orientation
window.addEventListener('orientationchange', () => {
    resizeCanvas();
});

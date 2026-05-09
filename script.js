const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const messageElement = document.getElementById("message");

// Constants (Mapped from your Python code)
canvas.width = 800;
canvas.height = 600;
const BALL_DIAMETER = 15;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
let INITIAL_VELOCITY = 5;

// State Variables
let ballX = 20;
let ballY = 20;
let xVelocity = INITIAL_VELOCITY;
let yVelocity = INITIAL_VELOCITY;
let paddleY = (canvas.height - PADDLE_HEIGHT) / 2;
let score = 0;
let gameOver = false;

// Mouse Movement
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    paddleY = e.clientY - rect.top - PADDLE_HEIGHT / 2;
    
    // Keep paddle in bounds
    if (paddleY < 0) paddleY = 0;
    if (paddleY + PADDLE_HEIGHT > canvas.height) paddleY = canvas.height - PADDLE_HEIGHT;
});

function update() {
    if (gameOver) return;

    // Move Ball
    ballX += xVelocity;
    ballY += yVelocity;

    // Top and Bottom Wall Collision
    if (ballY <= 0 || ballY + BALL_DIAMETER >= canvas.height) {
        yVelocity = -yVelocity;
    }

    // Left Wall Collision
    if (ballX <= 0) {
        xVelocity = -xVelocity;
    }

    // Paddle Collision (Right side)
    const paddleX = canvas.width - PADDLE_WIDTH;
    if (ballX + BALL_DIAMETER >= paddleX && 
        ballY + BALL_DIAMETER >= paddleY && 
        ballY <= paddleY + PADDLE_HEIGHT) {
        
        if (xVelocity > 0) {
            xVelocity = -xVelocity;
            xVelocity *= 1.05; // Increase speed 5% each hit to make it "Better"
            yVelocity *= 1.05;
            score += 6; // Your specific scoring logic
            scoreElement.innerText = score;
        }
    }

    // Game Over Logic
    if (ballX > canvas.width) {
        gameOver = true;
        messageElement.innerText = `GAME OVER\nScore: ${score}`;
        setTimeout(() => location.reload(), 3000); // Restart after 3s
    }
}

function draw() {
    // Clear Canvas
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Neon Ball
    ctx.fillStyle = "#fff";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffcc";
    ctx.beginPath();
    ctx.arc(ballX + BALL_DIAMETER/2, ballY + BALL_DIAMETER/2, BALL_DIAMETER/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw Neon Paddle
    ctx.fillStyle = "#00ffcc";
    ctx.shadowBlur = 20;
    ctx.fillRect(canvas.width - PADDLE_WIDTH, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

    // Reset shadow for next frame
    ctx.shadowBlur = 0;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
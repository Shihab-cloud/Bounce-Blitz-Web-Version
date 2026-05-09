const canvas = document.getElementById("pongCanvas");
const ctx = canvas.getContext("2d");

// UI Elements
const screens = {
    start: document.getElementById("start-screen"),
    mode: document.getElementById("mode-screen"),
    hud: document.getElementById("hud")
};
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const p1ScoreEl = document.getElementById("p1-score");

// Resize canvas to fit wrapper (handles mobile scaling)
function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- STATE MANAGEMENT ---
let gameState = "menu"; // menu, select, playing, gameover
let gameMode = "single"; // single, multi
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

// --- AUDIO ENGINE ---
let audioCtx;
let bgmInterval;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(freq, type = "square", duration = 0.1, vol = 0.1) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

function startBGM() {
    if (bgmInterval) clearInterval(bgmInterval);
    const bassNotes = [110, 110, 146.83, 130.81]; // Synthwave bass pattern (A2, A2, D3, C3)
    let i = 0;
    bgmInterval = setInterval(() => {
        if (gameState === "playing") {
            playSound(bassNotes[i], "sawtooth", 0.15, 0.05);
            i = (i + 1) % bassNotes.length;
        }
    }, 250); // 16th notes
}

// --- PARTICLE ENGINE (Graphics Upgrade) ---
let particles = [];
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0;
        this.color = color;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }
    draw(ctx) {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, 4, 4);
        ctx.globalAlpha = 1.0;
    }
}

function spawnParticles(x, y, color) {
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(x, y, color));
    }
}

// --- GAME VARIABLES ---
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 12;

let score = 0, p1Score = 0;
let highScore = localStorage.getItem("pongHighScore") || 0;
highScoreEl.innerText = highScore;

let ballX = canvas.width / 2, ballY = canvas.height / 2;
let xVel = 5, yVel = 5;

let p1Y = (canvas.height - PADDLE_HEIGHT) / 2;
let p2Y = (canvas.height - PADDLE_HEIGHT) / 2;
const keys = {};

window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

// Touch/Mouse Controls (Works for both PC mouse and Mobile touch)
function handlePointer(y) {
    const rect = canvas.getBoundingClientRect();
    const targetY = y - rect.top - PADDLE_HEIGHT / 2;
    p2Y = Math.max(0, Math.min(targetY, canvas.height - PADDLE_HEIGHT));
    
    // In single player, if on mobile, control the right paddle
    if (gameMode === "single" && isMobile) {
         p2Y = Math.max(0, Math.min(targetY, canvas.height - PADDLE_HEIGHT));
    }
}

canvas.addEventListener("mousemove", (e) => handlePointer(e.clientY));
canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Stop scrolling
    handlePointer(e.touches[0].clientY);
}, { passive: false });


// --- MENU LOGIC ---
document.getElementById("btn-start").addEventListener("click", () => {
    initAudio(); // MUST happen on user interaction
    screens.start.classList.remove("active");
    screens.mode.classList.add("active");
    playSound(400, "square", 0.1);
    
    if (isMobile) {
        document.getElementById("btn-multi").style.opacity = "0.5";
        document.getElementById("btn-multi").style.pointerEvents = "none";
        document.getElementById("mobile-warning").style.display = "block";
    }
});

document.getElementById("btn-single").addEventListener("click", () => startGame("single"));
document.getElementById("btn-multi").addEventListener("click", () => startGame("multi"));

function startGame(mode) {
    gameMode = mode;
    gameState = "playing";
    screens.mode.classList.remove("active");
    screens.hud.classList.add("active");
    
    // Reset Variables
    score = 0; p1Score = 0;
    scoreEl.innerText = score;
    ballX = canvas.width / 2; ballY = canvas.height / 2;
    xVel = 6; yVel = 6;
    particles = [];
    
    if (mode === "multi") {
        p1ScoreEl.style.display = "inline";
    } else {
        p1ScoreEl.style.display = "none";
    }

    playSound(800, "square", 0.2);
    startBGM();
}

// --- GAME LOGIC ---
function update() {
    if (gameState !== "playing") return;

    // Paddle Movement
    if (gameMode === "multi") {
        if (keys['KeyW'] && p1Y > 0) p1Y -= 8;
        if (keys['KeyS'] && p1Y < canvas.height - PADDLE_HEIGHT) p1Y += 8;
        if (keys['ArrowUp'] && p2Y > 0) p2Y -= 8;
        if (keys['ArrowDown'] && p2Y < canvas.height - PADDLE_HEIGHT) p2Y += 8;
    }

    ballX += xVel;
    ballY += yVel;

    // Top/Bottom Walls
    if (ballY <= 0 || ballY + BALL_SIZE >= canvas.height) {
        yVel = -yVel;
        playSound(300, "square", 0.1);
        spawnParticles(ballX, yVel > 0 ? 0 : canvas.height, "#fff");
    }

    // Left Wall / Player 1 Paddle
    if (ballX <= PADDLE_WIDTH) {
        if (gameMode === "single") {
            // Bounce off wall in single player
            xVel = -xVel;
            playSound(300, "square", 0.1);
            spawnParticles(0, ballY, "#00ffcc");
        } else {
            // Multiplayer collision check
            if (ballY + BALL_SIZE >= p1Y && ballY <= p1Y + PADDLE_HEIGHT) {
                xVel = Math.abs(xVel) * 1.05;
                playSound(600, "square", 0.1);
                spawnParticles(PADDLE_WIDTH, ballY, "#ff0055");
            } else if (ballX < 0) {
                // P1 missed, P2 scores
                score++;
                scoreEl.innerText = score;
                resetBall(-1);
            }
        }
    }

    // Right Paddle (Player 2 / Single Player)
    if (ballX + BALL_SIZE >= canvas.width - PADDLE_WIDTH) {
        if (ballY + BALL_SIZE >= p2Y && ballY <= p2Y + PADDLE_HEIGHT) {
            xVel = -Math.abs(xVel) * 1.05;
            if (gameMode === "single") score += 6;
            scoreEl.innerText = score;
            playSound(800, "square", 0.1);
            spawnParticles(canvas.width - PADDLE_WIDTH, ballY, "#00ffcc");
        } else if (ballX > canvas.width) {
            // P2 missed
            if (gameMode === "single") {
                endGame();
            } else {
                p1Score++;
                p1ScoreEl.innerText = p1Score + " | ";
                resetBall(1);
            }
        }
    }

    // Update Particles
    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);
}

function resetBall(direction) {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    xVel = 6 * direction;
    yVel = (Math.random() > 0.5 ? 6 : -6);
    playSound(150, "sawtooth", 0.5); // Score sound
}

function endGame() {
    gameState = "gameover";
    playSound(100, "sawtooth", 1.0);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("pongHighScore", highScore);
        highScoreEl.innerText = highScore;
    }

    clearInterval(bgmInterval);
    document.getElementById("message").innerText = `SYSTEM FAILURE\nScore: ${score}`;
    screens.hud.style.justifyContent = "center";
    
    setTimeout(() => location.reload(), 3000);
}

// --- RENDER LOGIC ---
function draw() {
    // Background - instead of clearRect, we fill with slight transparency to create a motion blur/trail effect!
    ctx.fillStyle = "rgba(5, 1, 10, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (gameState === "playing" || gameState === "gameover") {
        ctx.shadowBlur = 15;
        
        // P1 Paddle (Only in multi)
        if (gameMode === "multi") {
            ctx.shadowColor = "#ff0055";
            ctx.fillStyle = "#ff0055";
            ctx.fillRect(0, p1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
        }

        // P2 Paddle (Cyber Cyan)
        ctx.shadowColor = "#00ffcc";
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(canvas.width - PADDLE_WIDTH, p2Y, PADDLE_WIDTH, PADDLE_HEIGHT);
        
        // Ball (White with cyan glow)
        ctx.fillStyle = "#fff";
        ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);
        
        // Draw Particles
        particles.forEach(p => p.draw(ctx));

        ctx.shadowBlur = 0; // Reset
    }
}

function loop() { 
    update(); 
    draw(); 
    requestAnimationFrame(loop); 
}
loop();
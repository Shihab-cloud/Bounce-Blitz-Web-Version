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
const messageEl = document.getElementById("message");
const gameOverControls = document.getElementById("game-over-controls");

function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- STATE MANAGEMENT ---
// menu -> ready (frozen) -> playing -> gameover
let gameState = "menu"; 
let gameMode = "single"; 
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

// --- AUDIO ENGINE ---
let audioCtx;
let bgmInterval;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
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
    const bassNotes = [110, 110, 146.83, 130.81]; 
    let i = 0;
    bgmInterval = setInterval(() => {
        // Play music in both ready and playing states
        if (gameState === "playing" || gameState === "ready") {
            playSound(bassNotes[i], "sawtooth", 0.15, 0.05);
            i = (i + 1) % bassNotes.length;
        }
    }, 250); 
}

// --- PARTICLE ENGINE ---
let particles = [];
class Particle {
    constructor(x, y, color) {
        this.x = x; this.y = y;
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = (Math.random() - 0.5) * 10;
        this.life = 1.0; this.color = color;
    }
    update() {
        this.x += this.vx; this.y += this.vy;
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
    for (let i = 0; i < 15; i++) particles.push(new Particle(x, y, color));
}

// --- GAME VARIABLES ---
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 12;

let score = 0, p1Score = 0;
let highScore = localStorage.getItem("pongHighScore") || 0;
highScoreEl.innerText = highScore;

let ballX = canvas.width / 2, ballY = canvas.height / 2;
let xVel = 6, yVel = 6;
let p1Y = (canvas.height - PADDLE_HEIGHT) / 2;
let p2Y = (canvas.height - PADDLE_HEIGHT) / 2;
const keys = {};

window.addEventListener("keydown", (e) => keys[e.code] = true);
window.addEventListener("keyup", (e) => keys[e.code] = false);

function handlePointer(y) {
    const rect = canvas.getBoundingClientRect();
    const targetY = y - rect.top - PADDLE_HEIGHT / 2;
    p2Y = Math.max(0, Math.min(targetY, canvas.height - PADDLE_HEIGHT));
    if (gameMode === "single" && isMobile) {
         p2Y = Math.max(0, Math.min(targetY, canvas.height - PADDLE_HEIGHT));
    }
}
canvas.addEventListener("mousemove", (e) => handlePointer(e.clientY));
canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); 
    handlePointer(e.touches[0].clientY);
}, { passive: false });

// NEW: Click/Touch Canvas to Start Game from "ready" state
function triggerStart() {
    if (gameState === "ready") {
        gameState = "playing";
        messageEl.innerText = ""; // Clear the "Click to Start" message
    }
}
canvas.addEventListener("mousedown", triggerStart);
canvas.addEventListener("touchstart", triggerStart);

// --- MENU LOGIC ---
document.getElementById("btn-start").addEventListener("click", () => {
    initAudio(); 
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
    gameState = "ready"; // Sets to ready, drawing screen but pausing physics
    screens.mode.classList.remove("active");
    screens.hud.classList.add("active");
    gameOverControls.style.display = "none";
    
    score = 0; p1Score = 0;
    scoreEl.innerText = score;
    ballX = canvas.width / 2; ballY = canvas.height / 2;
    xVel = 6; yVel = 6;
    particles = [];
    
    p1ScoreEl.style.display = (mode === "multi") ? "inline" : "none";
    
    // Show instruction
    messageEl.innerText = isMobile ? "TAP TO START" : "CLICK TO START";

    playSound(800, "square", 0.2);
    startBGM();
}

// --- GAME OVER BUTTON LOGIC ---
document.getElementById("btn-restart").addEventListener("click", () => {
    startGame(gameMode);
});

document.getElementById("btn-menu").addEventListener("click", () => {
    gameOverControls.style.display = "none";
    messageEl.innerText = "";
    screens.hud.classList.remove("active");
    screens.mode.classList.add("active");
    gameState = "menu";
    
    // Clear canvas
    ctx.fillStyle = "#05010a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});


// --- GAME LOGIC ---
function update() {
    // Only update physics if the game is actively playing
    if (gameState !== "playing") return;

    if (gameMode === "multi") {
        if (keys['KeyW'] && p1Y > 0) p1Y -= 8;
        if (keys['KeyS'] && p1Y < canvas.height - PADDLE_HEIGHT) p1Y += 8;
        if (keys['ArrowUp'] && p2Y > 0) p2Y -= 8;
        if (keys['ArrowDown'] && p2Y < canvas.height - PADDLE_HEIGHT) p2Y += 8;
    }

    ballX += xVel;
    ballY += yVel;

    if (ballY <= 0 || ballY + BALL_SIZE >= canvas.height) {
        yVel = -yVel;
        playSound(300, "square", 0.1);
        spawnParticles(ballX, yVel > 0 ? 0 : canvas.height, "#fff");
    }

    if (ballX <= PADDLE_WIDTH) {
        if (gameMode === "single") {
            xVel = -xVel;
            playSound(300, "square", 0.1);
            spawnParticles(0, ballY, "#00ffcc");
        } else {
            if (ballY + BALL_SIZE >= p1Y && ballY <= p1Y + PADDLE_HEIGHT) {
                xVel = Math.abs(xVel) * 1.05;
                playSound(600, "square", 0.1);
                spawnParticles(PADDLE_WIDTH, ballY, "#ff0055");
            } else if (ballX < 0) {
                score++;
                scoreEl.innerText = score;
                resetBall(-1);
            }
        }
    }

    if (ballX + BALL_SIZE >= canvas.width - PADDLE_WIDTH) {
        if (ballY + BALL_SIZE >= p2Y && ballY <= p2Y + PADDLE_HEIGHT) {
            xVel = -Math.abs(xVel) * 1.05;
            if (gameMode === "single") score += 6;
            scoreEl.innerText = score;
            playSound(800, "square", 0.1);
            spawnParticles(canvas.width - PADDLE_WIDTH, ballY, "#00ffcc");
        } else if (ballX > canvas.width) {
            if (gameMode === "single") {
                endGame();
            } else {
                p1Score++;
                p1ScoreEl.innerText = p1Score + " | ";
                resetBall(1);
            }
        }
    }

    particles.forEach(p => p.update());
    particles = particles.filter(p => p.life > 0);
}

function resetBall(direction) {
    gameState = "ready"; // Pause the game for a moment when someone scores
    messageEl.innerText = isMobile ? "TAP TO CONTINUE" : "CLICK TO CONTINUE";
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    xVel = 6 * direction;
    yVel = (Math.random() > 0.5 ? 6 : -6);
    playSound(150, "sawtooth", 0.5); 
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
    //messageEl.innerText = `SYSTEM FAILURE\nFinal Score: ${score}`;
    gameOverControls.style.display = "flex";
}

// --- RENDER LOGIC ---
function draw() {
    ctx.fillStyle = "rgba(5, 1, 10, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw objects in ready, playing, and gameover states
    if (gameState === "playing" || gameState === "gameover" || gameState === "ready") {
        ctx.shadowBlur = 15;
        
        if (gameMode === "multi") {
            ctx.shadowColor = "#ff0055";
            ctx.fillStyle = "#ff0055";
            ctx.fillRect(0, p1Y, PADDLE_WIDTH, PADDLE_HEIGHT);
        }

        ctx.shadowColor = "#00ffcc";
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(canvas.width - PADDLE_WIDTH, p2Y, PADDLE_WIDTH, PADDLE_HEIGHT);
        
        ctx.fillStyle = "#fff";
        ctx.fillRect(ballX, ballY, BALL_SIZE, BALL_SIZE);
        
        particles.forEach(p => p.draw(ctx));
        ctx.shadowBlur = 0; 
    }
}

function loop() { 
    update(); 
    draw(); 
    requestAnimationFrame(loop); 
}
loop();
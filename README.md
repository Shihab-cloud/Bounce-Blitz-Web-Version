Bounce Blitz: web version 🏓
A high-performance, browser-native implementation of the classic Pong arcade game, featuring a high-contrast neon aesthetic and dynamic difficulty scaling.

🚀 Overview
Bounce Blitz is a project born from the evolution of desktop software into cloud-native web applications. Originally architected in Python using the Tkinter library, the project was re-engineered into a modern Web stack (Vanilla JavaScript and HTML5 Canvas) to leverage headless server environments and seamless CI/CD via Vercel.

✨ Key Features
Dynamic Difficulty Curve: The ball velocity increases by 5% upon every successful paddle hit, creating a progressively challenging experience.

Signature Scoring Logic: Adheres to a unique scoring system where each successful volley increments the player's score by 6 points.

Neon-Glow UI: Utilizes CSS3 filters and JavaScript shadowBlur APIs to create a "Cyberpunk" visual style without the overhead of heavy image assets.

High Frame-Rate Rendering: Leverages the requestAnimationFrame API to synchronize game logic with the browser's refresh rate, ensuring buttery-smooth 60FPS+ performance.

Responsive Control: Features low-latency mouse-tracking for paddle movement, providing a tactile and responsive gameplay feel.

🛠️ Tech Stack
Logic: Vanilla JavaScript (ES6+)

Rendering: HTML5 Canvas API

Styling: CSS3 (Flexbox, Neon Glow Filters)

Deployment: Vercel

📈 Technical Evolution
During development, the project transitioned from a Python/Tkinter environment to JavaScript. This migration was driven by the need for:

Universal Accessibility: Removing the requirement for a local Python runtime.

Cloud Native Deployment: Moving away from OS-dependent GUI libraries to a "headless-friendly" web architecture compatible with Vercel.

Performance Optimization: Utilizing web-native hardware acceleration for rendering game frames.

📥 Installation:
This project is live at the following link:
https://bounce-blitz-web-version.vercel.app/

To run this project locally:

Clone the repository:

Bash
git clone https://github.com/your-username/bounce-blitz.git
Navigate to the folder:

Bash
cd bounce-blitz
Open the game:
Simply open index.html in any modern web browser or use the Python live server:

Bash
   python -m http.server 8000
🗺️ Roadmap
[ ] Local Storage: Implementation of a "High Score" persistent tracking system.

[ ] Audio Integration: Synthesized "blip" sounds for paddle and wall collisions.

[ ] Multiplayer: Local two-player mode support.

👨‍💻 Author
Shihab Al Rezwan
North South University (NSU), Bangladesh

This project was developed as part of a technical exploration into web graphics and runtime migration.

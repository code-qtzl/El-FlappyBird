// ============================================================
// Game Constants
// ============================================================
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const GRAVITY = 800; // pixels/sec²
const JUMP_VELOCITY = -300; // pixels/sec (negative = upward)
const PIPE_SPEED = 150; // pixels/sec
const PIPE_SPAWN_INTERVAL = 1.8; // seconds
const PIPE_WIDTH = 52;
const GAP_HEIGHT = 130; // pixels
const GROUND_HEIGHT = 80; // pixels
const GHOST_WIDTH = 40;
const GHOST_HEIGHT = 40;
const GHOST_X = 80; // fixed horizontal position
const GHOST_START_Y = 250; // initial vertical position

// ============================================================
// Canvas Setup
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// ============================================================
// Renderer Helper Functions
// ============================================================

/**
 * Fills the entire canvas with a sky-blue background.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 */
function drawBackground(ctx, w, h) {
	ctx.fillStyle = '#87CEEB';
	ctx.fillRect(0, 0, w, h);
}

/**
 * Draws the earth-toned ground strip at the bottom of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 * @param {number} groundHeight - height of the ground strip in pixels
 */
function drawGround(ctx, w, h, groundHeight) {
	const groundY = h - groundHeight;

	// Main ground fill — earth brown
	ctx.fillStyle = '#8B4513';
	ctx.fillRect(0, groundY, w, groundHeight);

	// Grass strip on top of the ground
	ctx.fillStyle = '#4CAF50';
	ctx.fillRect(0, groundY, w, 6);
}

/**
 * Renders the start screen overlay with the ghost sprite and a prompt
 * to begin playing.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 * @param {HTMLImageElement} ghostSprite - the Image object for the ghost
 */
function drawStartScreen(ctx, w, h, ghostSprite) {
	ctx.save();

	// --- Title text: "Flappy Kiro" ---
	ctx.font = '36px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	ctx.lineWidth = 4;
	ctx.strokeStyle = '#000000';
	ctx.strokeText('El Flappy Bird', w / 2, h / 4);

	ctx.fillStyle = '#FFFFFF';
	ctx.fillText('El Flappy Bird', w / 2, h / 4);

	// --- Ghost sprite centered slightly above middle ---
	var spriteSize = 80; // larger size for visual impact
	var spriteX = (w - spriteSize) / 2;
	var spriteY = h / 2 - spriteSize / 2 - 20; // slightly above center

	if (ghostSprite && ghostSprite.naturalWidth > 0) {
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(ghostSprite, spriteX, spriteY, spriteSize, spriteSize);
	}

	// --- Prompt text: "Press Space to Start" ---
	ctx.font = '24px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	var promptY = spriteY + spriteSize + 40;

	ctx.lineWidth = 3;
	ctx.strokeStyle = '#000000';
	ctx.strokeText('Press Space to Start', w / 2, promptY);

	ctx.fillStyle = '#FFFFFF';
	ctx.fillText('Press Space to Start', w / 2, promptY);

	ctx.restore();
}

/**
 * Renders the game-over overlay with a semi-transparent background,
 * "Game Over" title, final score, and a restart prompt.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 * @param {number} score - the player's final score
 */
function drawGameOverScreen(ctx, w, h, score) {
	ctx.save();

	// Semi-transparent dark overlay to dim the background
	ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
	ctx.fillRect(0, 0, w, h);

	// --- "Game Over" title ---
	ctx.font = '40px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	ctx.lineWidth = 4;
	ctx.strokeStyle = '#000000';
	ctx.strokeText('Game Over', w / 2, h / 3);

	ctx.fillStyle = '#FFFFFF';
	ctx.fillText('Game Over', w / 2, h / 3);

	// --- Final score ---
	ctx.font = '28px sans-serif';

	ctx.lineWidth = 3;
	ctx.strokeStyle = '#000000';
	ctx.strokeText('Score: ' + score, w / 2, h / 3 + 50);

	ctx.fillStyle = '#FFFFFF';
	ctx.fillText('Score: ' + score, w / 2, h / 3 + 50);

	// --- Restart prompt ---
	ctx.font = '24px sans-serif';

	ctx.lineWidth = 3;
	ctx.strokeStyle = '#000000';
	ctx.strokeText('Press Space to Restart', w / 2, h / 3 + 100);

	ctx.fillStyle = '#FFFFFF';
	ctx.fillText('Press Space to Restart', w / 2, h / 3 + 100);

	ctx.restore();
}

// ============================================================
// Ghost Entity
// ============================================================

/**
 * Ghost — the player-controlled character.
 * Renders the ghosty.png sprite with rotation; falls back to a
 * colored rectangle if the sprite fails to load.
 */
function Ghost() {
	this.x = GHOST_X;
	this.y = GHOST_START_Y;
	this.width = GHOST_WIDTH;
	this.height = GHOST_HEIGHT;
	this.velocity = 0;
	this.rotation = 0;

	// Sprite loading with fallback
	this.spriteLoaded = false;
	this.spriteFailed = false;
	this.sprite = new Image();
	this.sprite.onload = () => {
		this.spriteLoaded = true;
	};
	this.sprite.onerror = () => {
		this.spriteFailed = true;
	};
	this.sprite.src = 'assets/ghosty.png';
}

/**
 * Applies gravity to velocity, updates y position, and computes
 * rotation from velocity.
 * @param {number} dt — delta time in seconds
 */
Ghost.prototype.update = function (dt) {
	// Apply gravity: velocity increases downward
	this.velocity += GRAVITY * dt;

	// Update vertical position
	this.y += this.velocity * dt;

	// Compute rotation from velocity.
	// Negative velocity (going up) → tilt up (negative angle)
	// Positive velocity (going down) → tilt down (positive angle)
	// Zero velocity → no tilt
	// Map velocity to rotation: use a simple ratio, then clamp.
	// Range: -PI/6 (−30°) to PI/2 (90°)
	var maxUpAngle = -Math.PI / 6; // -30 degrees
	var maxDownAngle = Math.PI / 2; // 90 degrees

	if (this.velocity < 0) {
		// Tilt up: map velocity from [JUMP_VELOCITY, 0] to [maxUpAngle, 0]
		this.rotation = Math.max(
			maxUpAngle,
			(this.velocity / -JUMP_VELOCITY) * maxUpAngle,
		);
	} else if (this.velocity > 0) {
		// Tilt down: map velocity from [0, 600] to [0, maxDownAngle]
		this.rotation = Math.min(
			maxDownAngle,
			(this.velocity / 600) * maxDownAngle,
		);
	} else {
		this.rotation = 0;
	}
};

/**
 * Sets velocity to the upward jump impulse.
 */
Ghost.prototype.jump = function () {
	this.velocity = JUMP_VELOCITY;
};

/**
 * Renders the ghost on the canvas with rotation.
 * Uses nearest-neighbor scaling for pixel-art sharpness.
 * Falls back to a colored rectangle if the sprite failed to load.
 * @param {CanvasRenderingContext2D} ctx
 */
Ghost.prototype.draw = function (ctx) {
	ctx.save();

	// Translate to the center of the ghost for rotation
	var centerX = this.x + this.width / 2;
	var centerY = this.y + this.height / 2;
	ctx.translate(centerX, centerY);
	ctx.rotate(this.rotation);

	if (this.spriteLoaded && !this.spriteFailed) {
		// Pixel-art sharpness: disable image smoothing
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(
			this.sprite,
			-this.width / 2,
			-this.height / 2,
			this.width,
			this.height,
		);
	} else {
		// Fallback: colored rectangle
		ctx.fillStyle = '#FFD700'; // gold color for visibility
		ctx.fillRect(
			-this.width / 2,
			-this.height / 2,
			this.width,
			this.height,
		);
	}

	ctx.restore();
};

/**
 * Restores the ghost to its initial position and zero velocity.
 */
Ghost.prototype.reset = function () {
	this.x = GHOST_X;
	this.y = GHOST_START_Y;
	this.velocity = 0;
	this.rotation = 0;
};

/**
 * Returns the bounding rectangle for collision detection.
 * @returns {{x: number, y: number, width: number, height: number}}
 */
Ghost.prototype.getBounds = function () {
	return {
		x: this.x,
		y: this.y,
		width: this.width,
		height: this.height,
	};
};

// ============================================================
// Pipe Entity
// ============================================================

/**
 * Pipe — a single pipe pair (top and bottom) with a gap.
 * @param {number} x — initial horizontal position
 * @param {number} gapY — vertical center of the gap
 */
function Pipe(x, gapY) {
	this.x = x;
	this.gapY = gapY;
	this.gapHeight = GAP_HEIGHT;
	this.width = PIPE_WIDTH;
	this.scored = false;
}

/**
 * Moves the pipe to the left by speed * dt.
 * @param {number} dt — delta time in seconds
 * @param {number} speed — horizontal scroll speed in pixels/sec
 */
Pipe.prototype.update = function (dt, speed) {
	this.x -= speed * dt;
};

/**
 * Renders the top pipe, bottom pipe, and cap/lip details.
 * Uses a retro green color palette.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasHeight — total canvas height
 */
Pipe.prototype.draw = function (ctx, canvasHeight) {
	var topPipeHeight = this.gapY - this.gapHeight / 2;
	var bottomPipeY = this.gapY + this.gapHeight / 2;
	var bottomPipeHeight = canvasHeight - bottomPipeY;

	var capWidth = this.width + 8;
	var capHeight = 20;
	var capOffsetX = this.x - 4; // center the wider cap on the pipe

	// --- Top pipe body ---
	ctx.fillStyle = '#2E7D32';
	ctx.fillRect(this.x, 0, this.width, topPipeHeight);

	// --- Top pipe cap (at the bottom of the top pipe) ---
	ctx.fillStyle = '#388E3C';
	ctx.fillRect(capOffsetX, topPipeHeight - capHeight, capWidth, capHeight);

	// --- Bottom pipe body ---
	ctx.fillStyle = '#2E7D32';
	ctx.fillRect(this.x, bottomPipeY, this.width, bottomPipeHeight);

	// --- Bottom pipe cap (at the top of the bottom pipe) ---
	ctx.fillStyle = '#388E3C';
	ctx.fillRect(capOffsetX, bottomPipeY, capWidth, capHeight);
};

/**
 * Returns the bounding rectangle for the top pipe (for collision detection).
 * @returns {{x: number, y: number, width: number, height: number}}
 */
Pipe.prototype.getTopBounds = function () {
	return {
		x: this.x,
		y: 0,
		width: this.width,
		height: this.gapY - this.gapHeight / 2,
	};
};

/**
 * Returns the bounding rectangle for the bottom pipe (for collision detection).
 * Note: canvasHeight is not needed here; we use a large default so the
 * hit-box extends well past the visible area. The actual canvasHeight
 * can be passed if precise bounds are required.
 * @returns {{x: number, y: number, width: number, height: number}}
 */
Pipe.prototype.getBottomBounds = function () {
	var topOfBottom = this.gapY + this.gapHeight / 2;
	return {
		x: this.x,
		y: topOfBottom,
		width: this.width,
		height: CANVAS_HEIGHT - topOfBottom,
	};
};

/**
 * Returns true when the pipe has scrolled fully past the left edge.
 * @returns {boolean}
 */
Pipe.prototype.isOffScreen = function () {
	return this.x + this.width < 0;
};

// ============================================================
// PipeManager
// ============================================================

/**
 * PipeManager — handles pipe generation, updating, removal, and drawing.
 * Spawns new pipe pairs at regular intervals with randomized gap positions.
 */
function PipeManager() {
	this.pipes = [];
	this.spawnTimer = 0;
	this.spawnInterval = PIPE_SPAWN_INTERVAL;
	this.speed = PIPE_SPEED;
}

/**
 * Spawns new pipes on interval, updates all pipes, and removes off-screen pipes.
 * Gap vertical position is randomized so the gap stays fully visible on screen,
 * respecting a minimum margin from the top and the ground.
 * @param {number} dt — delta time in seconds
 * @param {number} canvasHeight — total canvas height
 */
PipeManager.prototype.update = function (dt, canvasHeight) {
	// Accumulate time
	this.spawnTimer += dt;

	// Spawn a new pipe when the interval is reached
	if (this.spawnTimer >= this.spawnInterval) {
		var groundY = canvasHeight - GROUND_HEIGHT;

		// Minimum margin from top so the gap is fully visible
		var minGapY = GAP_HEIGHT / 2 + 20;
		// Maximum gapY so the bottom of the gap doesn't go below groundY
		var maxGapY = groundY - GAP_HEIGHT / 2;

		// Randomize gapY within valid bounds
		var gapY = minGapY + Math.random() * (maxGapY - minGapY);

		this.pipes.push(new Pipe(CANVAS_WIDTH, gapY));

		// Subtract spawnInterval to preserve remainder for consistent timing
		this.spawnTimer -= this.spawnInterval;
	}

	// Update all pipes
	for (var i = 0; i < this.pipes.length; i++) {
		this.pipes[i].update(dt, this.speed);
	}

	// Remove off-screen pipes
	this.pipes = this.pipes.filter(function (pipe) {
		return !pipe.isOffScreen();
	});
};

/**
 * Draws all active pipes.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasHeight — total canvas height
 */
PipeManager.prototype.draw = function (ctx, canvasHeight) {
	for (var i = 0; i < this.pipes.length; i++) {
		this.pipes[i].draw(ctx, canvasHeight);
	}
};

/**
 * Clears all pipes and resets the spawn timer.
 */
PipeManager.prototype.reset = function () {
	this.pipes = [];
	this.spawnTimer = 0;
};

/**
 * Returns the array of active pipes for collision/scoring checks.
 * @returns {Pipe[]}
 */
PipeManager.prototype.getPipes = function () {
	return this.pipes;
};

// ============================================================
// Collision Detection
// ============================================================

/**
 * Returns true if two axis-aligned bounding boxes overlap.
 * Each box is an object with {x, y, width, height}.
 * @param {{x: number, y: number, width: number, height: number}} a
 * @param {{x: number, y: number, width: number, height: number}} b
 * @returns {boolean}
 */
function checkAABBOverlap(a, b) {
	return (
		a.x < b.x + b.width &&
		a.x + a.width > b.x &&
		a.y < b.y + b.height &&
		a.y + a.height > b.y
	);
}

/**
 * Checks whether the ghost collides with either the top or bottom
 * section of a pipe pair.
 * @param {Ghost} ghost — ghost entity (must have getBounds())
 * @param {Pipe} pipe — pipe entity (must have getTopBounds() and getBottomBounds())
 * @returns {boolean}
 */
function checkGhostPipeCollision(ghost, pipe) {
	var bounds = ghost.getBounds();
	return (
		checkAABBOverlap(bounds, pipe.getTopBounds()) ||
		checkAABBOverlap(bounds, pipe.getBottomBounds())
	);
}

/**
 * Returns true if the ghost's bottom edge has reached or passed the ground.
 * @param {Ghost} ghost — ghost entity with y and height properties
 * @param {number} groundY — y-coordinate where the ground begins
 * @returns {boolean}
 */
function checkGroundCollision(ghost, groundY) {
	return ghost.y + ghost.height >= groundY;
}

/**
 * Clamps the ghost's y position to 0 if it has moved above the top
 * boundary of the canvas. Mutates the ghost object directly.
 * @param {Ghost} ghost — ghost entity with a y property
 */
function checkCeilingClamp(ghost) {
	if (ghost.y < 0) {
		ghost.y = 0;
	}
}

// ============================================================
// ScoreManager
// ============================================================

/**
 * ScoreManager — tracks and renders the player's score.
 * Score starts at zero and increments by one for each pipe pair cleared.
 */
function ScoreManager() {
	this.score = 0;
}

/**
 * Adds one to the current score.
 */
ScoreManager.prototype.increment = function () {
	this.score++;
};

/**
 * Resets the score to zero.
 */
ScoreManager.prototype.reset = function () {
	this.score = 0;
};

/**
 * Returns the current score.
 * @returns {number}
 */
ScoreManager.prototype.getScore = function () {
	return this.score;
};

/**
 * Renders the score as large centered text near the top of the canvas.
 * Uses a white fill with a dark stroke for readability against the
 * sky-blue background.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} canvasWidth — width of the canvas for centering
 */
ScoreManager.prototype.draw = function (ctx, canvasWidth) {
	ctx.save();

	ctx.font = '48px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'top';

	// Dark stroke/shadow for readability against sky-blue background
	ctx.lineWidth = 4;
	ctx.strokeStyle = '#000000';
	ctx.strokeText(String(this.score), canvasWidth / 2, 20);

	// White fill on top
	ctx.fillStyle = '#FFFFFF';
	ctx.fillText(String(this.score), canvasWidth / 2, 20);

	ctx.restore();
};

// ============================================================
// AudioManager
// ============================================================

/**
 * AudioManager — preloads and plays sound effects.
 * Handles load failures gracefully so the game continues without sound.
 */
function AudioManager() {
	this.jumpSound = null;
	this.gameOverSound = null;
}

/**
 * Creates Audio objects for jump.wav and game_over.wav.
 * Catches load errors silently and sets references to null so
 * playback methods gracefully no-op.
 */
AudioManager.prototype.preload = function () {
	try {
		this.jumpSound = new Audio('assets/jump.wav');
		this.jumpSound.onerror = function () {
			this.jumpSound = null;
		}.bind(this);
	} catch (e) {
		this.jumpSound = null;
	}

	try {
		this.gameOverSound = new Audio('assets/game_over.wav');
		this.gameOverSound.onerror = function () {
			this.gameOverSound = null;
		}.bind(this);
	} catch (e) {
		this.gameOverSound = null;
	}
};

/**
 * Plays the jump sound effect.
 * Checks for null before playing; resets currentTime to 0 for
 * rapid replay; catches play() promise rejections silently.
 */
AudioManager.prototype.playJump = function () {
	if (this.jumpSound === null) {
		return;
	}
	this.jumpSound.currentTime = 0;
	this.jumpSound.play().catch(function () {});
};

/**
 * Plays the game-over sound effect.
 * Checks for null before playing; resets currentTime to 0 for
 * rapid replay; catches play() promise rejections silently.
 */
AudioManager.prototype.playGameOver = function () {
	if (this.gameOverSound === null) {
		return;
	}
	this.gameOverSound.currentTime = 0;
	this.gameOverSound.play().catch(function () {});
};

// ============================================================
// InputHandler
// ============================================================

/**
 * InputHandler — listens for keyboard and pointer events and dispatches
 * actions. Supports space key, click, and touch input. Ignores held-down
 * (repeat) key events to ensure only discrete presses trigger actions.
 */
function InputHandler() {
	this.onAction = null;

	// Bound listener references for later removal
	this._keydownHandler = null;
	this._clickHandler = null;
	this._touchstartHandler = null;
}

/**
 * Attaches keydown (space, filtering out event.repeat), click, and
 * touchstart listeners. Touch events call preventDefault() to suppress
 * scrolling/zooming on mobile.
 * Keydown is attached to document (canvas doesn't receive keyboard
 * events by default). Click and touchstart are attached to the canvas.
 * @param {HTMLCanvasElement} canvas
 */
InputHandler.prototype.bind = function (canvas) {
	var self = this;

	this._keydownHandler = function (event) {
		if (event.repeat) {
			return;
		}
		if (event.key === ' ') {
			if (self.onAction) {
				self.onAction();
			}
		}
	};

	this._clickHandler = function () {
		if (self.onAction) {
			self.onAction();
		}
	};

	this._touchstartHandler = function (event) {
		event.preventDefault();
		if (self.onAction) {
			self.onAction();
		}
	};

	document.addEventListener('keydown', this._keydownHandler);
	canvas.addEventListener('click', this._clickHandler);
	canvas.addEventListener('touchstart', this._touchstartHandler);
};

/**
 * Removes all listeners previously attached by bind().
 * Keydown is removed from document; click and touchstart from the canvas.
 * @param {HTMLCanvasElement} canvas
 */
InputHandler.prototype.unbind = function (canvas) {
	if (this._keydownHandler) {
		document.removeEventListener('keydown', this._keydownHandler);
	}
	if (this._clickHandler) {
		canvas.removeEventListener('click', this._clickHandler);
	}
	if (this._touchstartHandler) {
		canvas.removeEventListener('touchstart', this._touchstartHandler);
	}

	this._keydownHandler = null;
	this._clickHandler = null;
	this._touchstartHandler = null;
};

// ============================================================
// Game State Enum
// ============================================================

var GameState = {
	START: 'START',
	PLAYING: 'PLAYING',
	GAME_OVER: 'GAME_OVER',
};

// ============================================================
// Game Controller
// ============================================================

/**
 * Game — main controller that orchestrates the game loop, state
 * transitions, and all component interactions.
 */
function Game() {
	this.canvas = canvas;
	this.ctx = ctx;
	this.groundY = CANVAS_HEIGHT - GROUND_HEIGHT;
	this.lastTimestamp = 0;
	this.state = GameState.START;

	// Component instances
	this.ghost = new Ghost();
	this.pipeManager = new PipeManager();
	this.scoreManager = new ScoreManager();
	this.audioManager = new AudioManager();
	this.inputHandler = new InputHandler();
}

/**
 * Sets up canvas, preloads assets (sprite + audio), binds input,
 * and shows the start screen.
 */
Game.prototype.init = function () {
	// Preload audio assets
	this.audioManager.preload();

	// Bind input events to the canvas
	this.inputHandler.bind(this.canvas);

	// Route input actions through handleInput
	var self = this;
	this.inputHandler.onAction = function () {
		self.handleInput();
	};

	// Set initial state
	this.state = GameState.START;

	// Start the game loop
	this.lastTimestamp = 0;
	requestAnimationFrame(this.loop.bind(this));
};

/**
 * Routes input based on the current game state.
 * START → startGame()
 * PLAYING → ghost.jump() + audioManager.playJump()
 * GAME_OVER → startGame()
 */
Game.prototype.handleInput = function () {
	if (this.state === GameState.START) {
		this.startGame();
	} else if (this.state === GameState.PLAYING) {
		this.ghost.jump();
		this.audioManager.playJump();
	} else if (this.state === GameState.GAME_OVER) {
		this.startGame();
	}
};

/**
 * Resets all game entities and transitions to the PLAYING state.
 */
Game.prototype.startGame = function () {
	this.ghost.reset();
	this.pipeManager.reset();
	this.scoreManager.reset();
	this.state = GameState.PLAYING;
};

/**
 * Transitions to the GAME_OVER state, plays the game-over sound,
 * and stops updates.
 */
Game.prototype.gameOver = function () {
	this.state = GameState.GAME_OVER;
	this.audioManager.playGameOver();
};

/**
 * Main game loop driven by requestAnimationFrame.
 * Calculates delta-time from the previous timestamp, caps it at 0.05s
 * to prevent physics tunneling, and clamps the first frame dt to 0.
 * Calls update(dt) only when PLAYING, always calls render(), then
 * requests the next frame.
 * @param {number} timestamp — high-resolution timestamp from requestAnimationFrame
 */
Game.prototype.loop = function (timestamp) {
	// Calculate delta-time in seconds
	var dt = (timestamp - this.lastTimestamp) / 1000;

	// First frame: clamp dt to 0 (lastTimestamp was 0)
	if (this.lastTimestamp === 0) {
		dt = 0;
	}

	// Cap dt at 0.05s to prevent physics tunneling (e.g., after tab backgrounding)
	if (dt > 0.05) {
		dt = 0.05;
	}

	// Store timestamp for next frame's delta calculation
	this.lastTimestamp = timestamp;

	// Only update game entities while playing
	if (this.state === GameState.PLAYING) {
		this.update(dt);
	}

	// Always render (so start/game-over screens are drawn)
	this.render();

	// Request next frame
	requestAnimationFrame(this.loop.bind(this));
};

/**
 * Updates all game entities for the current frame.
 * Applies ghost physics, moves pipes, checks scoring, and detects collisions.
 * @param {number} dt — delta time in seconds
 */
Game.prototype.update = function (dt) {
	// Update ghost physics (gravity, position, rotation)
	this.ghost.update(dt);

	// Update pipes (spawn, move, remove off-screen)
	this.pipeManager.update(dt, CANVAS_HEIGHT);

	// Check scoring: increment when ghost passes pipe midpoint
	var pipes = this.pipeManager.getPipes();
	for (var i = 0; i < pipes.length; i++) {
		var pipe = pipes[i];
		if (!pipe.scored && this.ghost.x > pipe.x + pipe.width / 2) {
			this.scoreManager.increment();
			pipe.scored = true;
		}
	}

	// Check collisions: pipe overlap → gameOver
	for (var i = 0; i < pipes.length; i++) {
		if (checkGhostPipeCollision(this.ghost, pipes[i])) {
			this.gameOver();
			return;
		}
	}

	// Check collisions: ground collision → gameOver
	if (checkGroundCollision(this.ghost, this.groundY)) {
		this.gameOver();
		return;
	}

	// Always apply ceiling clamp
	checkCeilingClamp(this.ghost);
};

/**
 * Renders the current frame.
 * Draw order: background → pipes → ground → ghost → score → overlays.
 * Background is drawn first so everything layers on top. Pipes are drawn
 * before ground so the ground strip overlaps pipe bottoms. Score is only
 * shown during PLAYING state. Start and game-over overlays are drawn last.
 */
Game.prototype.render = function () {
	// 1. Background
	drawBackground(this.ctx, CANVAS_WIDTH, CANVAS_HEIGHT);

	// 2. Pipes (before ground so ground overlaps pipe bottoms)
	this.pipeManager.draw(this.ctx, CANVAS_HEIGHT);

	// 3. Ground
	drawGround(this.ctx, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT);

	// 4. Ghost
	this.ghost.draw(this.ctx);

	// 5. Score (only while playing)
	if (this.state === GameState.PLAYING) {
		this.scoreManager.draw(this.ctx, CANVAS_WIDTH);
	}

	// 6. Start screen overlay
	if (
		this.state === GameState.START &&
		typeof drawStartScreen === 'function'
	) {
		drawStartScreen(
			this.ctx,
			CANVAS_WIDTH,
			CANVAS_HEIGHT,
			this.ghost.sprite,
		);
	}

	// 7. Game-over screen overlay
	if (
		this.state === GameState.GAME_OVER &&
		typeof drawGameOverScreen === 'function'
	) {
		drawGameOverScreen(
			this.ctx,
			CANVAS_WIDTH,
			CANVAS_HEIGHT,
			this.scoreManager.getScore(),
		);
	}
};

// ============================================================
// Entry Point
// ============================================================
window.addEventListener('DOMContentLoaded', function () {
	var game = new Game();
	game.init();
});

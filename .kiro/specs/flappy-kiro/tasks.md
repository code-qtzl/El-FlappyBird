# Implementation Plan: Flappy Kiro

## Overview

Build a browser-based Flappy Bird clone using vanilla HTML, CSS, and JavaScript with HTML5 Canvas. The implementation follows an incremental approach: set up the page structure, implement core game entities and physics, wire up input and audio, build the game loop and state machine, and finish with rendering and polish. Each task builds on the previous ones so there is no orphaned code.

## Tasks

- [x]   1. Set up project structure and canvas initialization
    - Create `index.html` with a `<canvas>` element (400×600), link to `style.css` and `game.js`
    - Create `style.css` with page layout, canvas centering, and body background styling
    - Create `game.js` with game constants (CANVAS_WIDTH, CANVAS_HEIGHT, GRAVITY, JUMP_VELOCITY, PIPE_SPEED, PIPE_SPAWN_INTERVAL, PIPE_WIDTH, GAP_HEIGHT, GROUND_HEIGHT, GHOST_WIDTH, GHOST_HEIGHT, GHOST_X, GHOST_START_Y) and canvas/context setup
    - Implement `drawBackground(ctx, w, h)` to fill the canvas with sky-blue
    - Implement `drawGround(ctx, w, h, groundHeight)` to draw the earth-toned ground strip at the bottom
    - _Requirements: 1.1, 1.2, 1.3, 9.3_

- [ ]   2. Implement Ghost entity with physics and rendering
    - [x] 2.1 Create the Ghost object with properties (x, y, width, height, velocity, rotation) and methods (jump, update, draw, reset, getBounds)
        - `update(dt)` applies gravity to velocity (`velocity += GRAVITY * dt`), updates y position, computes rotation from velocity
        - `jump()` sets velocity to JUMP_VELOCITY
        - `draw(ctx)` renders the ghosty.png sprite with rotation and `imageSmoothingEnabled = false` for pixel-art sharpness; falls back to a colored rectangle if sprite fails to load
        - `reset()` restores initial position (GHOST_X, GHOST_START_Y) and zero velocity
        - `getBounds()` returns `{x, y, width, height}` for collision detection
        - _Requirements: 2.1, 2.2, 2.3, 2.5, 9.1_

    - [ ]\* 2.2 Write property test: Gravity updates velocity linearly
        - **Property 1: Gravity updates velocity linearly**
        - For any starting velocity v and positive dt, after update the new velocity equals v + GRAVITY \* dt
        - **Validates: Requirements 2.2**

    - [ ]\* 2.3 Write property test: Rotation reflects velocity direction
        - **Property 2: Rotation reflects velocity direction**
        - For any velocity value, rotation is negative when velocity is negative, positive when positive, zero when zero
        - **Validates: Requirements 2.5**

- [ ]   3. Implement Pipe and PipeManager
    - [x] 3.1 Create the Pipe object with properties (x, gapY, gapHeight, width, scored) and methods (update, draw, getTopBounds, getBottomBounds, isOffScreen)
        - `update(dt, speed)` moves pipe left by `speed * dt`
        - `draw(ctx, canvasHeight)` renders top pipe, bottom pipe, and cap/lip details as green rectangles in retro style
        - `getTopBounds()` and `getBottomBounds()` return hit-box rectangles for collision
        - `isOffScreen()` returns true when pipe has scrolled fully past the left edge
        - _Requirements: 3.2, 3.5, 3.6, 9.2_

    - [x] 3.2 Create the PipeManager with properties (pipes, spawnTimer, spawnInterval, speed) and methods (update, draw, reset, getPipes)
        - `update(dt, canvasHeight)` spawns new pipes at regular intervals with randomized gap positions within valid bounds, updates all pipes, removes off-screen pipes
        - Gap vertical position is randomized so the gap stays fully visible on screen (respecting minimum margin from top and ground)
        - `reset()` clears all pipes and resets spawn timer
        - _Requirements: 3.1, 3.3, 3.4, 3.5_

    - [ ]\* 3.3 Write property test: Pipes move left at constant speed
        - **Property 3: Pipes move left at constant speed**
        - For any pipe at position x and positive dt, after update the new position equals x - PIPE_SPEED \* dt
        - **Validates: Requirements 3.2**

    - [ ]\* 3.4 Write property test: Pipe generation produces valid gaps
        - **Property 4: Pipe generation produces valid gaps**
        - For any generated pipe, gap height equals GAP_HEIGHT, top edge of gap >= minimum margin, bottom edge of gap <= groundY
        - **Validates: Requirements 3.3, 3.4**

- [ ]   4. Implement collision detection module
    - [x] 4.1 Implement pure collision functions: `checkAABBOverlap(a, b)`, `checkGhostPipeCollision(ghost, pipe)`, `checkGroundCollision(ghost, groundY)`, `checkCeilingClamp(ghost)`
        - `checkAABBOverlap` returns true if two {x, y, width, height} rectangles overlap
        - `checkGhostPipeCollision` checks ghost bounds against both top and bottom pipe bounds
        - `checkGroundCollision` returns true if ghost bottom edge >= groundY
        - `checkCeilingClamp` clamps ghost y to 0 if it exceeds the top boundary
        - _Requirements: 4.1, 4.2, 4.3, 4.4_

    - [ ]\* 4.2 Write property test: AABB collision detection is correct
        - **Property 5: AABB collision detection is correct**
        - For any two bounding boxes with positive dimensions, checkAABBOverlap returns true iff the rectangles geometrically overlap
        - **Validates: Requirements 4.2**

    - [ ]\* 4.3 Write property test: Ceiling clamp constrains ghost position
        - **Property 6: Ceiling clamp constrains ghost position**
        - For any ghost y, if y < 0 then result is 0; if y >= 0 then result is unchanged
        - **Validates: Requirements 4.3**

    - [ ]\* 4.4 Write property test: Ground collision detection is correct
        - **Property 7: Ground collision detection is correct**
        - For any ghost y, height h, and groundY, checkGroundCollision returns true iff y + h >= groundY
        - **Validates: Requirements 4.4**

- [ ]   5. Implement ScoreManager
    - [x] 5.1 Create the ScoreManager with properties (score) and methods (increment, reset, getScore, draw)
        - `increment()` adds one to the score
        - `reset()` sets score to zero
        - `draw(ctx, canvasWidth)` renders score as large centered text near the top of the canvas
        - _Requirements: 5.1, 5.2, 5.3_

    - [ ]\* 5.2 Write property test: Scoring increments exactly once per pipe
        - **Property 8: Scoring increments exactly once per pipe**
        - For any pipe position and ghost position, score increments by exactly 1 when ghost first passes pipe midpoint, and does not increment again for the same pipe
        - **Validates: Requirements 5.1, 5.4**

- [x]   6. Checkpoint - Verify core game entities
    - Ensure all tests pass, ask the user if questions arise.

- [ ]   7. Implement AudioManager and InputHandler
    - [x] 7.1 Create the AudioManager with properties (jumpSound, gameOverSound) and methods (preload, playJump, playGameOver)
        - `preload()` creates Audio objects for jump.wav and game_over.wav; catches load errors silently and sets references to null
        - `playJump()` and `playGameOver()` check for null before playing; reset currentTime to 0 for rapid replay; catch play() promise rejections silently
        - _Requirements: 8.1, 8.2, 8.3, 2.4, 6.1_

    - [x] 7.2 Create the InputHandler with properties (onAction) and methods (bind, unbind)
        - `bind(canvas)` attaches keydown (space, filtering out event.repeat), click, and touchstart listeners
        - Touch events call preventDefault() to suppress scrolling/zooming on mobile
        - `unbind(canvas)` removes all listeners
        - _Requirements: 10.1, 10.2, 10.3_

    - [ ]\* 7.3 Write property test: Repeat key events are ignored
        - **Property 10: Repeat key events are ignored**
        - For any keydown event, the action callback is invoked iff event.repeat is false and the key is spacebar; repeat events are discarded
        - **Validates: Requirements 10.3**

- [ ]   8. Implement Game controller and state machine
    - [x] 8.1 Create the Game controller with state machine (START, PLAYING, GAME_OVER), component instances (ghost, pipeManager, scoreManager, audioManager, inputHandler), and canvas/context references
        - `init()` sets up canvas, preloads assets (sprite + audio), binds input, shows start screen
        - `handleInput()` routes input based on current state: START → startGame(), PLAYING → ghost.jump() + playJump(), GAME_OVER → startGame()
        - `startGame()` resets ghost, pipeManager, scoreManager, transitions to PLAYING
        - `gameOver()` transitions to GAME_OVER, plays game-over sound, stops updates
        - _Requirements: 7.1, 7.2, 7.3, 6.2, 6.5_

    - [x] 8.2 Implement the game loop with delta-time
        - `loop(timestamp)` calculates dt from previous timestamp, caps dt at 0.05s to prevent physics tunneling
        - First frame dt is clamped to 0
        - Calls `update(dt)` then `render()`, then requests next frame via requestAnimationFrame
        - `update(dt)` updates ghost, pipes, checks scoring (increment when ghost passes pipe midpoint, mark pipe as scored), checks collisions (pipe overlap → gameOver, ground collision → gameOver, ceiling clamp)
        - _Requirements: 2.2, 3.2, 4.1, 5.1, 5.4_

    - [ ]\* 8.3 Write property test: Game reset restores initial state
        - **Property 9: Game reset restores initial state**
        - For any game state, after reset: ghost position equals (GHOST_X, GHOST_START_Y), ghost velocity is 0, score is 0, pipes array is empty
        - **Validates: Requirements 6.5**

- [ ]   9. Implement rendering and screen overlays
    - [x] 9.1 Implement the `render()` method in the Game controller
        - Draws background, ground, all pipes, ghost, and score on every frame
        - _Requirements: 1.2, 1.3, 9.3_

    - [x] 9.2 Implement `drawStartScreen(ctx, w, h, ghostSprite)` to render the start screen
        - Shows ghost sprite and "Press Space to Start" prompt text
        - _Requirements: 7.1_

    - [x] 9.3 Implement `drawGameOverScreen(ctx, w, h, score)` to render the game-over overlay
        - Shows final score and "Press Space to Restart" prompt text
        - _Requirements: 6.3, 6.4_

- [x]   10. Checkpoint - Full integration verification
    - Ensure all tests pass, ask the user if questions arise.

- [ ]   11. Wire everything together and finalize
    - [x] 11.1 Add the entry point in game.js that creates a Game instance and calls init() on page load
        - Use `window.addEventListener('DOMContentLoaded', ...)` or a script at the bottom of the body
        - Verify the full game flow: start screen → playing (gravity, pipes, scoring, audio) → game over → restart
        - _Requirements: 1.1, 7.1, 7.2, 7.3, 6.5_

    - [ ]\* 11.2 Write unit tests for rendering and screen overlays
        - Use a mocked CanvasRenderingContext2D to verify draw calls (colors, positions, text content)
        - Test start screen renders prompt text and ghost sprite
        - Test game-over screen renders final score and restart prompt
        - Test background is sky-blue, ground is earth-toned
        - _Requirements: 1.2, 1.3, 7.1, 6.3, 6.4, 9.3_

    - [ ]\* 11.3 Write unit tests for audio and error handling
        - Test AudioManager gracefully handles load failures (game continues without sound)
        - Test ghost renders fallback rectangle when sprite fails to load
        - Test dt cap prevents physics tunneling after long pause
        - _Requirements: 8.2, 8.3, 9.1_

- [x]   12. Final checkpoint - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 10 universal correctness properties from the design document using fast-check
- Unit tests validate specific examples, edge cases, and rendering behavior
- All game logic is in `game.js` with clearly separated sections; no build tools or external dependencies beyond the test framework

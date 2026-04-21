# Requirements Document

## Introduction

Flappy Kiro is a retro-styled, browser-based endless side-scroller game built with HTML, CSS, and JavaScript. The player controls a ghost character (Kiro) and navigates it through gaps between pairs of vertical pipes. The game tracks the player's score, plays sound effects for jumps and game-over events, and renders all visuals on an HTML5 Canvas element. The visual style is retro with a sky-blue background, green pipes, and a ground strip at the bottom of the screen.

## Glossary

- **Game_Canvas**: The HTML5 `<canvas>` element used to render all game visuals
- **Ghost**: The player-controlled character rendered from the `ghosty.png` sprite asset
- **Pipe_Pair**: A pair of vertically aligned obstacles (top pipe and bottom pipe) with a gap between them that the Ghost must pass through
- **Gap**: The vertical opening between the top and bottom pipes of a Pipe_Pair that the Ghost flies through
- **Score_Display**: The on-screen text element that shows the player's current score during gameplay
- **Game_Loop**: The continuous update-and-render cycle that drives gameplay at a consistent frame rate
- **Gravity**: The constant downward acceleration applied to the Ghost each frame
- **Jump**: The upward velocity impulse applied to the Ghost when the player provides input
- **Hit_Box**: The bounding rectangle used for collision detection between the Ghost and Pipe_Pairs or boundaries
- **Ground**: The decorative strip rendered at the bottom of the Game_Canvas representing the ground surface
- **Game_Over_Screen**: The overlay displayed when the Ghost collides with a Pipe_Pair or boundary, showing the final score and a prompt to restart
- **Audio_Manager**: The component responsible for loading and playing sound effects (jump.wav, game_over.wav)

## Requirements

### Requirement 1: Game Canvas Initialization

**User Story:** As a player, I want the game to load in my browser with a properly sized canvas, so that I can see and interact with the game.

#### Acceptance Criteria

1. WHEN the web page loads, THE Game_Canvas SHALL render at a fixed resolution suitable for gameplay (e.g., 400×600 pixels)
2. THE Game_Canvas SHALL display a sky-blue background color during all game states
3. THE Ground SHALL render as a horizontal strip at the bottom of the Game_Canvas with a distinct color from the background

### Requirement 2: Ghost Rendering and Physics

**User Story:** As a player, I want to see and control the ghost character, so that I can navigate through obstacles.

#### Acceptance Criteria

1. THE Game_Loop SHALL render the Ghost using the `ghosty.png` sprite asset at a fixed horizontal position on the Game_Canvas
2. WHILE the game is active, THE Game_Loop SHALL apply Gravity to the Ghost by increasing its downward velocity each frame
3. WHEN the player presses the spacebar or clicks/taps the Game_Canvas, THE Ghost SHALL receive an upward velocity impulse (Jump) that counteracts Gravity
4. WHEN a Jump occurs, THE Audio_Manager SHALL play the `jump.wav` sound effect
5. THE Ghost SHALL rotate or tilt visually based on its current vertical velocity to convey movement direction

### Requirement 3: Pipe Generation and Movement

**User Story:** As a player, I want pipes to appear and scroll toward me, so that the game presents a continuous challenge.

#### Acceptance Criteria

1. WHILE the game is active, THE Game_Loop SHALL generate new Pipe_Pairs at regular horizontal intervals off the right edge of the Game_Canvas
2. WHILE the game is active, THE Game_Loop SHALL move all Pipe_Pairs from right to left at a constant horizontal speed
3. THE Game_Loop SHALL randomize the vertical position of the Gap in each Pipe_Pair within a range that keeps the Gap fully visible on screen
4. THE Game_Loop SHALL maintain a consistent Gap size across all Pipe_Pairs to provide fair gameplay
5. WHEN a Pipe_Pair scrolls entirely past the left edge of the Game_Canvas, THE Game_Loop SHALL remove that Pipe_Pair from memory
6. THE Game_Loop SHALL render each pipe in the Pipe_Pair as a green rectangle with a retro visual style consistent with the reference screenshot

### Requirement 4: Collision Detection

**User Story:** As a player, I want the game to detect when my ghost hits an obstacle or boundary, so that the game ends fairly.

#### Acceptance Criteria

1. WHILE the game is active, THE Game_Loop SHALL check for overlap between the Ghost Hit_Box and each Pipe_Pair Hit_Box every frame
2. WHEN the Ghost Hit_Box overlaps with any Pipe_Pair Hit_Box, THE Game_Loop SHALL transition to the game-over state
3. WHEN the Ghost Hit_Box reaches or exceeds the top boundary of the Game_Canvas, THE Game_Loop SHALL constrain the Ghost position to the top boundary
4. WHEN the Ghost Hit_Box reaches or exceeds the Ground boundary, THE Game_Loop SHALL transition to the game-over state

### Requirement 5: Scoring System

**User Story:** As a player, I want to see my score increase as I pass through pipes, so that I can track my progress.

#### Acceptance Criteria

1. WHEN the Ghost passes the horizontal midpoint of a Pipe_Pair, THE Score_Display SHALL increment the score by one
2. THE Score_Display SHALL render the current score as large, clearly visible text centered near the top of the Game_Canvas
3. THE Score_Display SHALL initialize the score to zero at the start of each new game session
4. THE Game_Loop SHALL count each Pipe_Pair exactly once for scoring purposes

### Requirement 6: Game Over Handling

**User Story:** As a player, I want to see my final score and be able to restart when the game ends, so that I can try again.

#### Acceptance Criteria

1. WHEN the game transitions to the game-over state, THE Audio_Manager SHALL play the `game_over.wav` sound effect
2. WHEN the game transitions to the game-over state, THE Game_Loop SHALL stop updating Ghost physics and Pipe_Pair movement
3. THE Game_Over_Screen SHALL display the player's final score
4. THE Game_Over_Screen SHALL display a prompt or button instructing the player to restart (e.g., "Press Space to Restart")
5. WHEN the player presses the spacebar or clicks/taps the Game_Canvas while the Game_Over_Screen is displayed, THE Game_Loop SHALL reset all game state and start a new game session

### Requirement 7: Start Screen

**User Story:** As a player, I want to see a start screen when I first load the game, so that I know how to begin playing.

#### Acceptance Criteria

1. WHEN the web page loads, THE Game_Canvas SHALL display a start screen showing the Ghost sprite and a prompt to begin (e.g., "Press Space to Start")
2. WHILE the start screen is displayed, THE Game_Loop SHALL not apply Gravity to the Ghost and shall not generate Pipe_Pairs
3. WHEN the player presses the spacebar or clicks/taps the Game_Canvas while the start screen is displayed, THE Game_Loop SHALL transition to the active game state

### Requirement 8: Audio Management

**User Story:** As a player, I want sound effects to play during key game events, so that the game feels responsive and engaging.

#### Acceptance Criteria

1. WHEN the web page loads, THE Audio_Manager SHALL preload the `jump.wav` and `game_over.wav` audio files from the `assets/` directory
2. THE Audio_Manager SHALL play sound effects without blocking or delaying the Game_Loop
3. IF an audio file fails to load, THEN THE Audio_Manager SHALL continue game operation without sound rather than preventing gameplay

### Requirement 9: Retro Visual Style

**User Story:** As a player, I want the game to have a retro pixel-art aesthetic, so that the visual experience is nostalgic and cohesive.

#### Acceptance Criteria

1. THE Game_Canvas SHALL render the Ghost sprite with nearest-neighbor image scaling to preserve pixel-art sharpness
2. THE Game_Loop SHALL render pipes with a cap or lip detail at the opening end of each pipe to match the classic retro pipe style shown in the reference screenshot
3. THE Game_Canvas SHALL use a consistent retro color palette: sky-blue background, green pipes, and an earth-toned Ground strip

### Requirement 10: Input Handling

**User Story:** As a player, I want to control the game using simple inputs on both desktop and mobile, so that I can play on any device.

#### Acceptance Criteria

1. WHEN the player presses the spacebar on a keyboard, THE Game_Loop SHALL register the input as a Jump or state-transition action
2. WHEN the player clicks or taps the Game_Canvas, THE Game_Loop SHALL register the input as a Jump or state-transition action
3. THE Game_Loop SHALL ignore held-down keys and only respond to discrete key-press events to prevent continuous jumping

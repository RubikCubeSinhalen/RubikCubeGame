# Cube Solve

A browser-based Rubik's Cube game and solver playground built as a single-page HTML app. It lets you scramble a cube, turn layers by dragging stickers or using keyboard shortcuts, undo/redo moves, request hints, and auto-solve the puzzle.

## Features

- Interactive 3x3 Rubik's Cube rendered in the browser
- Drag a sticker to rotate a layer, or drag the background to change the viewing angle
- Keyboard controls for face turns and undo/redo actions
- Scramble controls with easy, medium, and hard difficulty presets
- Move counter and timer with best-time tracking using browser local storage
- Hint system and auto-solve support
- Reset, replay, and solved-state modal feedback

## How to run

This project is a static frontend and does not require a package manager or build step.

1. Open `index.html` directly in a browser, or
2. Serve the project locally from the repository root:

```bash
cd /workspaces/RubikCubeGame
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

## Controls

### Mouse and touch

- Drag a sticker on the cube to rotate that layer
- Drag empty space on the stage to rotate the cube view
- Click the reset view button to restore the default camera angle

### Keyboard

- `U`, `D`, `L`, `R`, `F`, `B` turn the corresponding face clockwise
- Hold `Shift` to turn counter-clockwise
- `Ctrl + Z` / `Command + Z` to undo
- `Ctrl + Y` / `Command + Shift + Z` to redo
- `H` to show a hint

### On-screen controls

- Scramble: create a fresh random scramble
- Undo: reverse the last move
- Redo: reapply a reverted move
- Hint: highlight the move that would reverse the previous turn
- Auto-solve: reverse the current history to return the cube to its solved state
- Reset: restore the cube to a clean, unsolved starting state

## Project structure

```text
RubikCubeGame/
├── README.md
├── index.html
└── .git/
```

The entire game logic, CSS styling, and rendering are contained in `index.html`, making it easy to modify and run without a framework.

## Notes

- Best time is stored in the browser via `localStorage`.
- The app is optimized for desktop and mobile browsers with pointer-based input.
- No external build tools or dependencies are required.

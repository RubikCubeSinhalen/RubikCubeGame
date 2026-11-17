# Cube Solve

A browser-based Rubik's Cube game and solver playground built as a single-page HTML app. It lets you scramble a cube, turn layers by dragging stickers or using keyboard shortcuts, undo/redo moves, request hints, and auto-solve the puzzle.

## Features

- Interactive 3x3 Rubik's Cube rendered in the browser
- Drag a sticker to rotate a layer, or drag the background to change the viewing angle
- Keyboard controls for face turns and undo/redo actions
- Scramble controls with easy, medium, and hard difficulty presets
- Move counter and timer with best-time tracking using browser local storage
- Hints and auto-solve based on the cube's current sticker positions, using a near-optimal two-phase solver
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
- Hint: highlight the first move in a solver-generated solution for the current cube state
- Auto-solve: solve the current cube state with a near-optimal two-phase solution (not necessarily the globally shortest solution)
- Reset: restore the cube to a clean, unsolved starting state

## Project structure

```text
RubikCubeGame/
├── README.md
├── css/
│   └── styles.css
├── index.html
└── js/
    ├── CUBEJS-LICENSE.txt
    ├── cubejs-cube.js
    ├── cubejs-solve.js
    └── script.js
```

The page markup is in `index.html`, with styling in `css/styles.css` and game logic in `js/script.js`. The app remains a static site and does not require a framework. The solver is bundled locally from [cube.js](https://github.com/ldez/cubejs) 1.3.2 in `js/cubejs-cube.js` and `js/cubejs-solve.js`; its MIT license is included in `js/CUBEJS-LICENSE.txt`. Solving works offline. The Kociemba two-phase algorithm gives a fast, near-optimal solution, not a guaranteed globally shortest one. Solver input supports standard outer-face turns; moving a middle slice is reported as unsupported.

## Notes

- Best time is stored in the browser via `localStorage`.
- The app is optimized for desktop and mobile browsers with pointer-based input.
- No build tools, package installation, or internet connection are required; the solver is bundled locally.

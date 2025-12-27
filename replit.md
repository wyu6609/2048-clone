# 2048 Game

A fully playable 2048 clone built with React and TypeScript.

## Overview

This is a classic 2048 puzzle game where you combine matching numbered tiles to reach the 2048 tile. The game features smooth animations, sound effects, score tracking, and undo functionality.

## How to Play

### Controls
- **Arrow Keys** or **WASD**: Move tiles in the corresponding direction
- **Swipe** (mobile): Swipe in any direction to move tiles

### Gameplay
1. Tiles slide in the direction you choose
2. Matching tiles merge into one with double the value
3. After each move, a new tile (2 or 4) appears
4. Reach the 2048 tile to win!
5. Game ends when no more moves are possible

### Features
- **Score Tracking**: Current score and best score (saved automatically)
- **Undo**: Go back one move (available after each move)
- **New Game**: Start fresh at any time
- **Sound Effects**: Toggle sounds on/off with the mute button
- **Keep Playing**: Continue playing after reaching 2048

## Project Structure

```
client/src/
├── components/
│   └── Game2048.tsx      # Main game component
├── hooks/
│   └── useSound.ts       # Sound effects hook
├── lib/
│   └── game2048.ts       # Game logic (pure functions)
├── App.tsx               # App entry point
└── index.css             # Game styling
```

## Technical Details

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS + custom CSS
- **State Management**: React useState/useCallback
- **Build Tool**: Vite
- **Backend**: Express.js (serves static files)

## Recent Changes

- December 27, 2025: Initial implementation
  - Complete 2048 game mechanics
  - Smooth tile animations using unique IDs
  - Sound effects for moves, merges, win, and game over
  - Mobile swipe support
  - Score persistence in localStorage
  - Undo functionality with proper timeout handling

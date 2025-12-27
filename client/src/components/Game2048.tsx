import { useCallback, useEffect, useState, useRef } from 'react';
import {
  Tile,
  Direction,
  initializeTiles,
  move,
  spawnTile,
  hasWon,
  canMove,
  getTileColor,
  getTileTextColor,
  getTileFontSize,
  cloneTiles,
} from '@/lib/game2048';
import { useSound } from '@/hooks/useSound';
import { Volume2, VolumeX, RotateCcw, Undo2 } from 'lucide-react';

interface GameState {
  tiles: Tile[];
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  keepPlaying: boolean;
  previousState: { tiles: Tile[]; score: number } | null;
}

function loadBestScore(): number {
  const saved = localStorage.getItem('2048_best_score');
  return saved ? parseInt(saved, 10) : 0;
}

function saveBestScore(score: number): void {
  localStorage.setItem('2048_best_score', score.toString());
}

export function Game2048() {
  const [gameState, setGameState] = useState<GameState>(() => ({
    tiles: initializeTiles(),
    score: 0,
    bestScore: loadBestScore(),
    gameOver: false,
    won: false,
    keepPlaying: false,
    previousState: null,
  }));

  const { isMuted, toggleMute, playMove, playMerge, playWin, playGameOver } = useSound();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isAnimatingRef = useRef(false);
  const spawnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const moveVersionRef = useRef(0);

  const clearPendingSpawn = useCallback(() => {
    if (spawnTimeoutRef.current) {
      clearTimeout(spawnTimeoutRef.current);
      spawnTimeoutRef.current = null;
    }
    moveVersionRef.current++;
    isAnimatingRef.current = false;
  }, []);

  const handleMove = useCallback((direction: Direction) => {
    if (isAnimatingRef.current) return;
    
    setGameState(prev => {
      if (prev.gameOver || (prev.won && !prev.keepPlaying)) return prev;

      const result = move(prev.tiles, direction);
      if (!result.moved) return prev;

      isAnimatingRef.current = true;
      const currentVersion = ++moveVersionRef.current;
      
      const newBestScore = Math.max(prev.score + result.score, prev.bestScore);
      if (newBestScore > prev.bestScore) {
        saveBestScore(newBestScore);
      }

      if (result.merged) {
        playMerge();
      } else {
        playMove();
      }

      spawnTimeoutRef.current = setTimeout(() => {
        if (moveVersionRef.current !== currentVersion) return;
        
        setGameState(current => {
          const tilesWithNew = spawnTile(current.tiles);
          const won = !current.won && !current.keepPlaying && hasWon(tilesWithNew);
          const gameOver = !canMove(tilesWithNew);

          if (won) {
            setTimeout(() => playWin(), 50);
          } else if (gameOver) {
            setTimeout(() => playGameOver(), 50);
          }

          isAnimatingRef.current = false;
          spawnTimeoutRef.current = null;

          return {
            ...current,
            tiles: tilesWithNew,
            gameOver,
            won,
          };
        });
      }, 120);

      return {
        tiles: result.tiles,
        score: prev.score + result.score,
        bestScore: newBestScore,
        gameOver: false,
        won: prev.won,
        keepPlaying: prev.keepPlaying,
        previousState: { tiles: cloneTiles(prev.tiles), score: prev.score },
      };
    });
  }, [playMove, playMerge, playWin, playGameOver]);

  const handleNewGame = useCallback(() => {
    clearPendingSpawn();
    setGameState(prev => ({
      tiles: initializeTiles(),
      score: 0,
      bestScore: prev.bestScore,
      gameOver: false,
      won: false,
      keepPlaying: false,
      previousState: null,
    }));
  }, [clearPendingSpawn]);

  const handleUndo = useCallback(() => {
    clearPendingSpawn();
    setGameState(prev => {
      if (!prev.previousState) return prev;
      return {
        ...prev,
        tiles: prev.previousState.tiles,
        score: prev.previousState.score,
        gameOver: false,
        won: false,
        previousState: null,
      };
    });
  }, [clearPendingSpawn]);

  const handleKeepPlaying = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      won: false,
      keepPlaying: true,
    }));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyDirections: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        W: 'up',
        s: 'down',
        S: 'down',
        a: 'left',
        A: 'left',
        d: 'right',
        D: 'right',
      };

      const direction = keyDirections[e.key];
      if (direction) {
        e.preventDefault();
        handleMove(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipeDistance = 30;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > minSwipeDistance) {
        handleMove(dx > 0 ? 'right' : 'left');
      }
    } else {
      if (Math.abs(dy) > minSwipeDistance) {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    }

    touchStartRef.current = null;
  }, [handleMove]);

  return (
    <div 
      className="game-container"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="game-header">
        <h1 className="game-title">2048</h1>
        <div className="scores-container">
          <div className="score-box">
            <div className="score-label">SCORE</div>
            <div className="score-value">{gameState.score}</div>
          </div>
          <div className="score-box">
            <div className="score-label">BEST</div>
            <div className="score-value">{gameState.bestScore}</div>
          </div>
        </div>
      </header>

      <div className="controls-row">
        <button className="control-btn" onClick={handleNewGame} title="New Game">
          <RotateCcw size={20} />
          <span>New Game</span>
        </button>
        <button 
          className="control-btn" 
          onClick={handleUndo} 
          disabled={!gameState.previousState}
          title="Undo"
        >
          <Undo2 size={20} />
          <span>Undo</span>
        </button>
        <button className="control-btn mute-btn" onClick={toggleMute} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      <div className="game-board">
        <div className="grid-background">
          {Array(16).fill(null).map((_, i) => (
            <div key={i} className="grid-cell" />
          ))}
        </div>
        <div className="tiles-container">
          {gameState.tiles.map((tile) => (
            <div
              key={tile.id}
              className={`tile ${tile.isNew ? 'tile-new' : ''} ${tile.isMerged ? 'tile-merged' : ''} ${tile.value >= 2048 ? 'tile-super' : ''}`}
              style={{
                '--row': tile.row,
                '--col': tile.col,
                backgroundColor: getTileColor(tile.value),
                color: getTileTextColor(tile.value),
                fontSize: getTileFontSize(tile.value),
              } as React.CSSProperties}
            >
              {tile.value}
            </div>
          ))}
        </div>

        {gameState.won && !gameState.keepPlaying && (
          <div className="game-overlay win-overlay">
            <div className="overlay-content">
              <h2>You Win!</h2>
              <div className="overlay-buttons">
                <button onClick={handleKeepPlaying}>Keep Playing</button>
                <button onClick={handleNewGame}>New Game</button>
              </div>
            </div>
          </div>
        )}

        {gameState.gameOver && (
          <div className="game-overlay game-over-overlay">
            <div className="overlay-content">
              <h2>Game Over!</h2>
              <p>Final Score: {gameState.score}</p>
              <div className="overlay-buttons">
                <button onClick={handleUndo} disabled={!gameState.previousState}>Undo</button>
                <button onClick={handleNewGame}>Try Again</button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="game-instructions">
        <p><strong>How to play:</strong> Use arrow keys or WASD to move tiles. Swipe on mobile.</p>
        <p>Combine matching numbers to reach <strong>2048</strong>!</p>
      </div>
    </div>
  );
}

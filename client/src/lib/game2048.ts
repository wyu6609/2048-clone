export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

export interface GameState {
  tiles: Tile[];
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  keepPlaying: boolean;
  previousState: { tiles: Tile[]; score: number } | null;
}

let nextTileId = 1;

export function createTile(value: number, row: number, col: number, isNew = false): Tile {
  return { id: nextTileId++, value, row, col, isNew };
}

export function getEmptyCells(tiles: Tile[]): { row: number; col: number }[] {
  const occupied = new Set(tiles.map(t => `${t.row},${t.col}`));
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (!occupied.has(`${row},${col}`)) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

export function spawnTile(tiles: Tile[]): Tile[] {
  const emptyCells = getEmptyCells(tiles);
  if (emptyCells.length === 0) return tiles;

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  
  return [...tiles.map(t => ({ ...t, isNew: false, isMerged: false })), createTile(value, row, col, true)];
}

export function initializeTiles(): Tile[] {
  nextTileId = 1;
  let tiles: Tile[] = [];
  tiles = spawnTile(tiles);
  tiles = spawnTile(tiles);
  return tiles;
}

interface MoveResult {
  tiles: Tile[];
  score: number;
  moved: boolean;
  merged: boolean;
}

function getVector(direction: Direction): { row: number; col: number } {
  const vectors: Record<Direction, { row: number; col: number }> = {
    up: { row: -1, col: 0 },
    down: { row: 1, col: 0 },
    left: { row: 0, col: -1 },
    right: { row: 0, col: 1 },
  };
  return vectors[direction];
}

function getTraversalOrder(direction: Direction): { rows: number[]; cols: number[] } {
  const rows = [0, 1, 2, 3];
  const cols = [0, 1, 2, 3];
  
  if (direction === 'down') rows.reverse();
  if (direction === 'right') cols.reverse();
  
  return { rows, cols };
}

export function move(tiles: Tile[], direction: Direction): MoveResult {
  const vector = getVector(direction);
  const { rows, cols } = getTraversalOrder(direction);
  
  const grid: (Tile | null)[][] = Array(4).fill(null).map(() => Array(4).fill(null));
  tiles.forEach(t => {
    grid[t.row][t.col] = { ...t, isNew: false, isMerged: false };
  });
  
  const merged: boolean[][] = Array(4).fill(null).map(() => Array(4).fill(false));
  let totalScore = 0;
  let anyMoved = false;
  let anyMerged = false;
  
  for (const row of rows) {
    for (const col of cols) {
      const tile = grid[row][col];
      if (!tile) continue;
      
      let newRow = row;
      let newCol = col;
      
      while (true) {
        const nextRow = newRow + vector.row;
        const nextCol = newCol + vector.col;
        
        if (nextRow < 0 || nextRow > 3 || nextCol < 0 || nextCol > 3) break;
        
        const nextTile = grid[nextRow][nextCol];
        
        if (!nextTile) {
          newRow = nextRow;
          newCol = nextCol;
        } else if (nextTile.value === tile.value && !merged[nextRow][nextCol]) {
          newRow = nextRow;
          newCol = nextCol;
          break;
        } else {
          break;
        }
      }
      
      if (newRow !== row || newCol !== col) {
        anyMoved = true;
        grid[row][col] = null;
        
        const targetTile = grid[newRow][newCol];
        if (targetTile && targetTile.value === tile.value) {
          const newValue = tile.value * 2;
          grid[newRow][newCol] = createTile(newValue, newRow, newCol);
          grid[newRow][newCol]!.isMerged = true;
          merged[newRow][newCol] = true;
          totalScore += newValue;
          anyMerged = true;
        } else {
          tile.row = newRow;
          tile.col = newCol;
          grid[newRow][newCol] = tile;
        }
      }
    }
  }
  
  const newTiles = grid.flat().filter((t): t is Tile => t !== null);
  
  return {
    tiles: newTiles,
    score: totalScore,
    moved: anyMoved,
    merged: anyMerged,
  };
}

export function hasWon(tiles: Tile[]): boolean {
  return tiles.some(t => t.value === 2048);
}

export function canMove(tiles: Tile[]): boolean {
  if (getEmptyCells(tiles).length > 0) return true;
  
  const grid: (number | null)[][] = Array(4).fill(null).map(() => Array(4).fill(null));
  tiles.forEach(t => { grid[t.row][t.col] = t.value; });
  
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const current = grid[row][col];
      if (col < 3 && current === grid[row][col + 1]) return true;
      if (row < 3 && current === grid[row + 1][col]) return true;
    }
  }
  return false;
}

export function getTileColor(value: number): string {
  const colors: Record<number, string> = {
    2: '#eee4da',
    4: '#ede0c8',
    8: '#f2b179',
    16: '#f59563',
    32: '#f67c5f',
    64: '#f65e3b',
    128: '#edcf72',
    256: '#edcc61',
    512: '#edc850',
    1024: '#edc53f',
    2048: '#edc22e',
  };
  return colors[value] || '#3c3a32';
}

export function getTileTextColor(value: number): string {
  return value <= 4 ? '#776e65' : '#f9f6f2';
}

export function getTileFontSize(value: number): string {
  if (value < 100) return '55px';
  if (value < 1000) return '45px';
  return '35px';
}

export function cloneTiles(tiles: Tile[]): Tile[] {
  return tiles.map(t => ({ ...t }));
}

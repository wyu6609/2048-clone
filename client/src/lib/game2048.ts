export type Grid = (number | null)[][];
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  keepPlaying: boolean;
  previousState: { grid: Grid; score: number } | null;
}

export function createEmptyGrid(): Grid {
  return Array(4).fill(null).map(() => Array(4).fill(null));
}

export function getEmptyCells(grid: Grid): { row: number; col: number }[] {
  const empty: { row: number; col: number }[] = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] === null) {
        empty.push({ row, col });
      }
    }
  }
  return empty;
}

export function spawnTile(grid: Grid): Grid {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return grid;

  const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;

  const newGrid = grid.map(r => [...r]);
  newGrid[row][col] = value;
  return newGrid;
}

export function initializeGrid(): Grid {
  let grid = createEmptyGrid();
  grid = spawnTile(grid);
  grid = spawnTile(grid);
  return grid;
}

function slideRow(row: (number | null)[]): { newRow: (number | null)[]; score: number; merged: boolean } {
  const filtered = row.filter(cell => cell !== null) as number[];
  const newRow: (number | null)[] = [];
  let score = 0;
  let merged = false;

  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const mergedValue = filtered[i] * 2;
      newRow.push(mergedValue);
      score += mergedValue;
      merged = true;
      i += 2;
    } else {
      newRow.push(filtered[i]);
      i++;
    }
  }

  while (newRow.length < 4) {
    newRow.push(null);
  }

  return { newRow, score, merged };
}

function rotateGrid90(grid: Grid): Grid {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      newGrid[col][3 - row] = grid[row][col];
    }
  }
  return newGrid;
}

function rotateGrid270(grid: Grid): Grid {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      newGrid[3 - col][row] = grid[row][col];
    }
  }
  return newGrid;
}

function rotateGrid180(grid: Grid): Grid {
  const newGrid = createEmptyGrid();
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      newGrid[3 - row][3 - col] = grid[row][col];
    }
  }
  return newGrid;
}

export function move(grid: Grid, direction: Direction): { grid: Grid; score: number; moved: boolean; merged: boolean } {
  let workGrid = grid.map(r => [...r]);
  let totalScore = 0;
  let anyMerged = false;

  if (direction === 'up') {
    workGrid = rotateGrid270(workGrid);
  } else if (direction === 'down') {
    workGrid = rotateGrid90(workGrid);
  } else if (direction === 'right') {
    workGrid = rotateGrid180(workGrid);
  }

  for (let row = 0; row < 4; row++) {
    const { newRow, score, merged } = slideRow(workGrid[row]);
    workGrid[row] = newRow;
    totalScore += score;
    if (merged) anyMerged = true;
  }

  if (direction === 'up') {
    workGrid = rotateGrid90(workGrid);
  } else if (direction === 'down') {
    workGrid = rotateGrid270(workGrid);
  } else if (direction === 'right') {
    workGrid = rotateGrid180(workGrid);
  }

  const moved = !gridsEqual(grid, workGrid);
  return { grid: workGrid, score: totalScore, moved, merged: anyMerged };
}

function gridsEqual(a: Grid, b: Grid): boolean {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (a[row][col] !== b[row][col]) return false;
    }
  }
  return true;
}

export function hasWon(grid: Grid): boolean {
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (grid[row][col] === 2048) return true;
    }
  }
  return false;
}

export function canMove(grid: Grid): boolean {
  if (getEmptyCells(grid).length > 0) return true;

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const current = grid[row][col];
      if (col < 3 && current === grid[row][col + 1]) return true;
      if (row < 3 && current === grid[row + 1][col]) return true;
    }
  }
  return false;
}

export function getTileColor(value: number | null): string {
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
  return value ? colors[value] || '#3c3a32' : '#cdc1b4';
}

export function getTileTextColor(value: number | null): string {
  if (!value) return 'transparent';
  return value <= 4 ? '#776e65' : '#f9f6f2';
}

export function getTileFontSize(value: number | null): string {
  if (!value) return '55px';
  if (value < 100) return '55px';
  if (value < 1000) return '45px';
  return '35px';
}

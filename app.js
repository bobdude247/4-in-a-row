const ROWS = 6;
const COLS = 7;

const boardEl = document.getElementById('board');
const columnButtonsEl = document.getElementById('columnButtons');
const statusEl = document.getElementById('status');
const player1ColorEl = document.getElementById('player1Color');
const player2ColorEl = document.getElementById('player2Color');
const newGameBtn = document.getElementById('newGameBtn');

const state = {
  board: createEmptyBoard(),
  currentPlayer: 1,
  gameOver: false,
  winningCells: [],
  colors: {
    1: player1ColorEl.value,
    2: player2ColorEl.value
  }
};

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function initializeBoardUI() {
  columnButtonsEl.innerHTML = '';
  for (let col = 0; col < COLS; col += 1) {
    const btn = document.createElement('button');
    btn.className = 'drop-btn';
    btn.type = 'button';
    btn.textContent = `↓ ${col + 1}`;
    btn.dataset.col = String(col);
    btn.addEventListener('click', () => onDrop(col));
    columnButtonsEl.appendChild(btn);
  }

  boardEl.innerHTML = '';
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      cell.role = 'gridcell';
      boardEl.appendChild(cell);
    }
  }
}

function resetGame() {
  const color1 = player1ColorEl.value;
  const color2 = player2ColorEl.value;

  if (color1.toLowerCase() === color2.toLowerCase()) {
    statusEl.textContent = 'Pick two different colors to start a game.';
    return;
  }

  state.board = createEmptyBoard();
  state.currentPlayer = 1;
  state.gameOver = false;
  state.winningCells = [];
  state.colors[1] = color1;
  state.colors[2] = color2;

  setStatusForTurn();
  updateDropButtons();
  render();
}

function setStatusForTurn() {
  statusEl.textContent = `Player ${state.currentPlayer}'s turn`;
  statusEl.style.color = state.colors[state.currentPlayer];
}

function onDrop(col) {
  if (state.gameOver) return;

  const row = getLowestOpenRow(col);
  if (row === -1) return;

  const player = state.currentPlayer;
  state.board[row][col] = player;

  const winLine = getWinningLine(row, col, player);
  if (winLine) {
    state.gameOver = true;
    state.winningCells = winLine;
    statusEl.textContent = `Player ${player} wins!`;
    statusEl.style.color = state.colors[player];
    updateDropButtons();
    render();
    return;
  }

  if (isDraw()) {
    state.gameOver = true;
    statusEl.textContent = 'Draw game: board is full.';
    statusEl.style.color = '#f3f4f6';
    updateDropButtons();
    render();
    return;
  }

  state.currentPlayer = player === 1 ? 2 : 1;
  setStatusForTurn();
  updateDropButtons();
  render();
}

function getLowestOpenRow(col) {
  for (let row = ROWS - 1; row >= 0; row -= 1) {
    if (state.board[row][col] === 0) {
      return row;
    }
  }
  return -1;
}

function getWinningLine(startRow, startCol, player) {
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1]
  ];

  for (const [dRow, dCol] of directions) {
    const line = [{ row: startRow, col: startCol }];

    collectDirection(line, startRow, startCol, dRow, dCol, player);
    collectDirection(line, startRow, startCol, -dRow, -dCol, player);

    if (line.length >= 4) {
      return line.slice(0, 4);
    }
  }

  return null;
}

function collectDirection(line, startRow, startCol, dRow, dCol, player) {
  let row = startRow + dRow;
  let col = startCol + dCol;

  while (isOnBoard(row, col) && state.board[row][col] === player) {
    line.push({ row, col });
    row += dRow;
    col += dCol;
  }
}

function isOnBoard(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function isDraw() {
  return state.board[0].every((slot) => slot !== 0);
}

function updateDropButtons() {
  const buttons = columnButtonsEl.querySelectorAll('.drop-btn');
  buttons.forEach((btn, col) => {
    const topFilled = state.board[0][col] !== 0;
    btn.disabled = state.gameOver || topFilled;
  });
}

function render() {
  const winningSet = new Set(state.winningCells.map((c) => `${c.row},${c.col}`));

  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const slot = state.board[row][col];

    cell.classList.remove('win');
    if (slot === 0) {
      cell.style.background = 'var(--hole)';
      return;
    }

    cell.style.background = state.colors[slot];
    if (winningSet.has(`${row},${col}`)) {
      cell.classList.add('win');
    }
  });
}

newGameBtn.addEventListener('click', resetGame);
player1ColorEl.addEventListener('change', () => {
  if (!state.gameOver) {
    state.colors[1] = player1ColorEl.value;
    render();
    setStatusForTurn();
  }
});
player2ColorEl.addEventListener('change', () => {
  if (!state.gameOver) {
    state.colors[2] = player2ColorEl.value;
    render();
    setStatusForTurn();
  }
});

initializeBoardUI();
resetGame();

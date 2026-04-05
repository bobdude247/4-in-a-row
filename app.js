const ROWS = 6;
const COLS = 7;

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const player1ColorEl = document.getElementById('player1Color');
const player2ColorEl = document.getElementById('player2Color');
const newGameBtn = document.getElementById('newGameBtn');
const dragChip1El = document.getElementById('dragChip1');
const dragChip2El = document.getElementById('dragChip2');
const player1StackEl = document.getElementById('player1Stack');
const player2StackEl = document.getElementById('player2Stack');

const state = {
  board: createEmptyBoard(),
  currentPlayer: 1,
  gameOver: false,
  winningCells: [],
  currentHoverCol: null,
  draggingPlayer: null,
  colors: {
    1: player1ColorEl.value,
    2: player2ColorEl.value
  }
};

function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function initializeBoardUI() {
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

  setupDragAndDrop();
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
  state.currentHoverCol = null;
  state.draggingPlayer = null;
  state.colors[1] = color1;
  state.colors[2] = color2;

  setStatusForTurn();
  updateInteractionState();
  render();
}

function setStatusForTurn() {
  statusEl.textContent = `Player ${state.currentPlayer}'s turn. Drag your chip to a column.`;
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
    updateInteractionState();
    render();
    return;
  }

  if (isDraw()) {
    state.gameOver = true;
    statusEl.textContent = 'Draw game: board is full.';
    statusEl.style.color = '#f3f4f6';
    updateInteractionState();
    render();
    return;
  }

  state.currentPlayer = player === 1 ? 2 : 1;
  setStatusForTurn();
  updateInteractionState();
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

function updateInteractionState() {
  const p1Active = !state.gameOver && state.currentPlayer === 1;
  const p2Active = !state.gameOver && state.currentPlayer === 2;

  dragChip1El.draggable = p1Active;
  dragChip2El.draggable = p2Active;

  dragChip1El.classList.toggle('disabled', !p1Active);
  dragChip2El.classList.toggle('disabled', !p2Active);
}

function render() {
  const winningSet = new Set(state.winningCells.map((c) => `${c.row},${c.col}`));
  const hoverCol = state.currentHoverCol;

  player1StackEl.querySelectorAll('.stack-chip').forEach((chip) => {
    chip.style.background = state.colors[1];
  });
  player2StackEl.querySelectorAll('.stack-chip').forEach((chip) => {
    chip.style.background = state.colors[2];
  });

  const cells = boardEl.querySelectorAll('.cell');
  cells.forEach((cell) => {
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    const slot = state.board[row][col];

    cell.classList.remove('win');
    cell.classList.remove('drop-target');

    if (!state.gameOver && hoverCol === col && state.board[0][col] === 0) {
      cell.classList.add('drop-target');
    }

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

function setupDragAndDrop() {
  dragChip1El.addEventListener('dragstart', (event) => onDragStart(event, 1));
  dragChip2El.addEventListener('dragstart', (event) => onDragStart(event, 2));

  dragChip1El.addEventListener('dragend', onDragEnd);
  dragChip2El.addEventListener('dragend', onDragEnd);

  boardEl.addEventListener('dragover', onBoardDragOver);
  boardEl.addEventListener('dragleave', onBoardDragLeave);
  boardEl.addEventListener('drop', onBoardDrop);
}

function onDragStart(event, player) {
  if (state.gameOver || player !== state.currentPlayer) {
    event.preventDefault();
    return;
  }

  state.draggingPlayer = player;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(player));
  }
}

function onDragEnd() {
  state.draggingPlayer = null;
  state.currentHoverCol = null;
  render();
}

function onBoardDragOver(event) {
  if (state.gameOver || state.draggingPlayer !== state.currentPlayer) return;

  event.preventDefault();
  const col = getDropColumnFromEvent(event);
  state.currentHoverCol = col;
  render();
}

function onBoardDragLeave(event) {
  if (!boardEl.contains(event.relatedTarget)) {
    state.currentHoverCol = null;
    render();
  }
}

function onBoardDrop(event) {
  if (state.gameOver || state.draggingPlayer !== state.currentPlayer) return;

  event.preventDefault();
  const col = getDropColumnFromEvent(event);
  state.currentHoverCol = null;

  if (col === null || col < 0 || col >= COLS || getLowestOpenRow(col) === -1) {
    render();
    return;
  }

  onDrop(col);
}

function getDropColumnFromEvent(event) {
  const cell = event.target.closest('.cell');
  if (cell) {
    return Number(cell.dataset.col);
  }

  const rect = boardEl.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right) {
    return null;
  }

  const colWidth = rect.width / COLS;
  const col = Math.floor((event.clientX - rect.left) / colWidth);
  return Math.min(COLS - 1, Math.max(0, col));
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

const ROWS = 6;
const COLS = 7;

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const gameModeEl = document.getElementById('gameMode');
const player1ColorEl = document.getElementById('player1Color');
const player2ColorEl = document.getElementById('player2Color');
const player2LabelEl = document.getElementById('player2Label');
const newGameBtn = document.getElementById('newGameBtn');
const dragChip1El = document.getElementById('dragChip1');
const dragChip2El = document.getElementById('dragChip2');
const player1StackEl = document.getElementById('player1Stack');
const player2StackEl = document.getElementById('player2Stack');

const state = {
  board: createEmptyBoard(),
  mode: gameModeEl.value,
  currentPlayer: 1,
  gameOver: false,
  cpuThinking: false,
  cpuTimerId: null,
  sessionId: 0,
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
  state.mode = gameModeEl.value;
  state.currentPlayer = 1;
  state.gameOver = false;
  state.cpuThinking = false;
  state.sessionId += 1;
  state.winningCells = [];
  state.currentHoverCol = null;
  state.draggingPlayer = null;
  state.colors[1] = color1;
  state.colors[2] = color2;

  clearCpuTimer();
  removeCpuGhostChip();
  syncModeUI();

  setStatusForTurn();
  updateInteractionState();
  render();
}

function isCpuMode() {
  return state.mode === 'cpu';
}

function isCpuTurn() {
  return !state.gameOver && isCpuMode() && state.currentPlayer === 2;
}

function clearCpuTimer() {
  if (state.cpuTimerId !== null) {
    window.clearTimeout(state.cpuTimerId);
    state.cpuTimerId = null;
  }
}

function syncModeUI() {
  player2LabelEl.textContent = isCpuMode() ? 'CPU' : 'Player 2';
  dragChip2El.title = isCpuMode() ? 'CPU takes turns automatically' : 'Drag to board';
}

function setStatusForTurn() {
  if (isCpuMode()) {
    statusEl.textContent =
      state.currentPlayer === 1
        ? 'Your turn. Drag a chip or tap your stack, then choose a column.'
        : "CPU's turn.";
  } else {
    statusEl.textContent = `Player ${state.currentPlayer}'s turn. Drag a chip or tap your stack, then choose a column.`;
  }

  statusEl.style.color = state.colors[state.currentPlayer];
}

function onDrop(col) {
  if (state.gameOver || state.cpuThinking) return;

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

  if (isCpuTurn()) {
    startCpuTurn();
  }
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
  const p1Active = !state.gameOver && !state.cpuThinking && state.currentPlayer === 1;
  const p2Active =
    !state.gameOver && !state.cpuThinking && state.currentPlayer === 2 && !isCpuMode();

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
      cell.dataset.label = '';
      return;
    }

    cell.style.background = state.colors[slot];
    cell.dataset.label = 'bd';
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
  if (state.gameOver || state.cpuThinking || player !== state.currentPlayer) {
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
  if (state.gameOver || state.cpuThinking || state.draggingPlayer !== state.currentPlayer) return;

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
  if (state.gameOver || state.cpuThinking || state.draggingPlayer !== state.currentPlayer) return;

  event.preventDefault();
  const col = getDropColumnFromEvent(event);
  state.currentHoverCol = null;

  if (col === null || col < 0 || col >= COLS || getLowestOpenRow(col) === -1) {
    render();
    return;
  }

  onDrop(col);
}

function onStackTap(player) {
  if (state.gameOver || state.cpuThinking) return;
  if (player !== state.currentPlayer) return;
  if (isCpuMode() && player === 2) return;

  state.draggingPlayer = player;
  statusEl.textContent =
    player === 1 || !isCpuMode()
      ? `Player ${player}, tap a board column to drop.`
      : 'Tap a board column to drop.';
  statusEl.style.color = state.colors[player];
}

function onBoardTap(event) {
  if (state.gameOver || state.cpuThinking) return;
  if (isCpuMode() && state.currentPlayer === 2) return;

  const col = getDropColumnFromEvent(event);
  if (col === null || col < 0 || col >= COLS || getLowestOpenRow(col) === -1) {
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

function getAvailableColumns() {
  const columns = [];

  for (let col = 0; col < COLS; col += 1) {
    if (getLowestOpenRow(col) !== -1) {
      columns.push(col);
    }
  }

  return columns;
}

function isWinningMove(col, player) {
  const row = getLowestOpenRow(col);
  if (row === -1) return false;

  state.board[row][col] = player;
  const wins = Boolean(getWinningLine(row, col, player));
  state.board[row][col] = 0;

  return wins;
}

function chooseCpuColumn() {
  const available = getAvailableColumns();
  if (available.length === 0) return null;

  const winningMove = available.find((col) => isWinningMove(col, 2));
  if (winningMove !== undefined) return winningMove;

  const blockingMove = available.find((col) => isWinningMove(col, 1));
  if (blockingMove !== undefined) return blockingMove;

  const center = Math.floor(COLS / 2);
  const scored = available
    .map((col) => ({
      col,
      score: -Math.abs(center - col) + Math.random() * 0.35
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0].col;
}

function removeCpuGhostChip() {
  document.querySelectorAll('.cpu-chip-ghost').forEach((el) => el.remove());
}

function animateCpuDrop(col, sessionId) {
  return new Promise((resolve) => {
    const startRect = dragChip2El.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();
    const targetCell = boardEl.querySelector(`.cell[data-row="0"][data-col="${col}"]`);
    const landingRow = getLowestOpenRow(col);
    const landingCell =
      landingRow >= 0
        ? boardEl.querySelector(`.cell[data-row="${landingRow}"][data-col="${col}"]`)
        : null;

    if (!targetCell || !landingCell) {
      resolve(false);
      return;
    }

    removeCpuGhostChip();
    const ghost = document.createElement('div');
    ghost.className = 'cpu-chip-ghost';
    ghost.style.background = state.colors[2];
    document.body.appendChild(ghost);

    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;
    const targetRect = targetCell.getBoundingClientRect();
    const landingRect = landingCell.getBoundingClientRect();

    const topY = boardRect.top - 24;
    const moveX = targetRect.left + targetRect.width / 2;
    const dropY = landingRect.top + landingRect.height / 2;

    const moveDuration = 280 + Math.random() * 120;
    const dropDuration = 320 + Math.random() * 140;

    state.currentHoverCol = col;
    render();

    let startTs = null;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function stepMove(ts) {
      if (state.sessionId !== sessionId || state.gameOver) {
        ghost.remove();
        state.currentHoverCol = null;
        render();
        resolve(false);
        return;
      }

      if (!startTs) startTs = ts;
      const progress = Math.min(1, (ts - startTs) / moveDuration);
      const eased = easeOutCubic(progress);
      const x = startX + (moveX - startX) * eased;
      const y = startY + (topY - startY) * eased;
      ghost.style.left = `${x}px`;
      ghost.style.top = `${y}px`;

      if (progress < 1) {
        window.requestAnimationFrame(stepMove);
        return;
      }

      startTs = null;
      window.requestAnimationFrame(stepDrop);
    }

    function stepDrop(ts) {
      if (state.sessionId !== sessionId || state.gameOver) {
        ghost.remove();
        state.currentHoverCol = null;
        render();
        resolve(false);
        return;
      }

      if (!startTs) startTs = ts;
      const progress = Math.min(1, (ts - startTs) / dropDuration);
      const eased = easeOutCubic(progress);
      const y = topY + (dropY - topY) * eased;

      ghost.style.left = `${moveX}px`;
      ghost.style.top = `${y}px`;

      if (progress < 1) {
        window.requestAnimationFrame(stepDrop);
        return;
      }

      ghost.remove();
      state.currentHoverCol = null;
      render();
      resolve(true);
    }

    window.requestAnimationFrame(stepMove);
  });
}

function startCpuTurn() {
  if (!isCpuTurn()) return;

  state.cpuThinking = true;
  clearCpuTimer();
  updateInteractionState();

  statusEl.textContent = 'CPU is thinking...';
  statusEl.style.color = state.colors[2];

  const sessionId = state.sessionId;
  const thinkDelayMs = 450 + Math.random() * 700;

  state.cpuTimerId = window.setTimeout(async () => {
    state.cpuTimerId = null;

    if (!isCpuTurn() || state.sessionId !== sessionId) {
      state.cpuThinking = false;
      updateInteractionState();
      return;
    }

    const col = chooseCpuColumn();
    if (col === null) {
      state.cpuThinking = false;
      updateInteractionState();
      return;
    }

    statusEl.textContent = 'CPU is making its move...';
    statusEl.style.color = state.colors[2];

    const completed = await animateCpuDrop(col, sessionId);
    if (!completed || !isCpuTurn() || state.sessionId !== sessionId) {
      state.cpuThinking = false;
      updateInteractionState();
      return;
    }

    state.cpuThinking = false;
    onDrop(col);
  }, thinkDelayMs);
}

newGameBtn.addEventListener('click', resetGame);
gameModeEl.addEventListener('change', resetGame);
player1StackEl.addEventListener('click', () => onStackTap(1));
player2StackEl.addEventListener('click', () => onStackTap(2));
boardEl.addEventListener('click', onBoardTap);
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

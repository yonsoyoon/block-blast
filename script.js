const SIZE = 8;
const BASE_COLORS = [
  { hue: 4, sat: 78, light: 62 }, // coral red
  { hue: 350, sat: 75, light: 66 }, // rose
  { hue: 18, sat: 75, light: 68 }, // peach
  { hue: 26, sat: 85, light: 60 }, // tangerine
  { hue: 40, sat: 88, light: 58 }, // golden amber
  { hue: 50, sat: 70, light: 66 }, // warm yellow
  { hue: 78, sat: 55, light: 62 }, // lime sorbet
  { hue: 100, sat: 40, light: 50 }, // grass green
  { hue: 122, sat: 45, light: 46 }, // forest green
  { hue: 148, sat: 45, light: 46 }, // emerald
  { hue: 168, sat: 50, light: 46 }, // jade
  { hue: 186, sat: 55, light: 50 }, // turquoise
  { hue: 200, sat: 70, light: 56 }, // sky blue
  { hue: 217, sat: 68, light: 60 }, // blue
  { hue: 230, sat: 60, light: 65 }, // periwinkle
  { hue: 250, sat: 55, light: 66 }, // indigo
  { hue: 262, sat: 55, light: 64 }, // violet
  { hue: 280, sat: 50, light: 65 }, // purple
  { hue: 300, sat: 55, light: 63 }, // orchid
  { hue: 315, sat: 62, light: 68 }, // magenta pink
];
const BG_TONES = Array.from({ length: 12 }, (_, i) => ({
  hue: i * 30,
  sat: 42,
  light: i % 2 === 0 ? 90 : 89,
}));
let paletteHue = 0;
let bgIndex = 0;

function pieceColor(index) {
  const base = BASE_COLORS[index];
  const hue = (base.hue + paletteHue + 360) % 360;
  return `hsl(${hue}, ${base.sat}%, ${base.light}%)`;
}

const SHAPE_POOL = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  [[0, 0], [1, 0], [2, 0], [3, 0]],
  [[0, 0], [1, 0], [2, 0], [2, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 0]],
  [[0, 0], [0, 1], [1, 1], [2, 1]],
  [[1, 0], [1, 1], [1, 2], [0, 2]],
  [[0, 1], [1, 1], [2, 0], [2, 1]],
  [[0, 0], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 1], [1, 0], [1, 1], [2, 1]],
  [[1, 0], [1, 1], [1, 2], [0, 1]],
  [[0, 0], [1, 0], [2, 0], [1, 1]],
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  [[0, 0], [1, 0], [1, 1], [2, 1]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 1], [1, 0], [1, 1], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]],
  [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]],
  [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]],
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
];

const boardEl = document.getElementById('board');
const trayEl = document.getElementById('tray');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlayEl = document.getElementById('gameover-overlay');
const finalScoreEl = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');
const hintBtn = document.getElementById('hint-btn');

let board = [];
let boardCells = [];
let tray = [null, null, null];
let score = 0;
let best = Number(localStorage.getItem('blockblast-best') || 0);
let dragState = null;
let ghostEl = null;
let displayedScore = 0;
let scoreAnimId = null;

bestEl.textContent = best;

function animateScoreTo(target) {
  if (scoreAnimId !== null) cancelAnimationFrame(scoreAnimId);
  const start = displayedScore;
  const diff = target - start;
  if (diff === 0) return;
  const duration = Math.min(700, 250 + Math.abs(diff) * 3);
  let startTime = null;
  function step(now) {
    if (startTime === null) startTime = now;
    const t = Math.min(1, (now - startTime) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    displayedScore = Math.round(start + diff * eased);
    scoreEl.textContent = displayedScore;
    if (t < 1) {
      scoreAnimId = requestAnimationFrame(step);
    } else {
      displayedScore = target;
      scoreEl.textContent = displayedScore;
      scoreAnimId = null;
    }
  }
  scoreAnimId = requestAnimationFrame(step);
}

function resetScoreDisplay() {
  if (scoreAnimId !== null) {
    cancelAnimationFrame(scoreAnimId);
    scoreAnimId = null;
  }
  displayedScore = 0;
  scoreEl.textContent = '0';
}

function buildBoard() {
  boardEl.innerHTML = '';
  boardCells = [];
  for (let r = 0; r < SIZE; r++) {
    const row = [];
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      boardEl.appendChild(cell);
      row.push(cell);
    }
    boardCells.push(row);
  }
}

function shapeDims(cells) {
  const rows = Math.max(...cells.map((p) => p[0])) + 1;
  const cols = Math.max(...cells.map((p) => p[1])) + 1;
  return { rows, cols };
}

function randomPiece() {
  const cells = SHAPE_POOL[Math.floor(Math.random() * SHAPE_POOL.length)];
  const color = pieceColor(Math.floor(Math.random() * BASE_COLORS.length));
  return { cells, color };
}

function refillTrayIfEmpty() {
  if (tray.every((p) => p === null)) {
    tray = [randomPiece(), randomPiece(), randomPiece()];
    renderTray();
  }
}

function renderBoard() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const cell = boardCells[r][c];
      const color = board[r][c];
      cell.classList.toggle('filled', !!color);
      cell.style.backgroundColor = color || '';
    }
  }
  updateDangerState();
}

let dangerActive = false;

function updateDangerState() {
  let filled = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c]) filled++;
    }
  }
  const ratio = filled / (SIZE * SIZE);
  if (!dangerActive && ratio >= 0.48) {
    dangerActive = true;
  } else if (dangerActive && ratio < 0.36) {
    dangerActive = false;
  }
  boardEl.classList.toggle('board-danger', dangerActive);
}

function renderTray() {
  const slots = trayEl.querySelectorAll('.tray-slot');
  slots.forEach((slot, i) => {
    slot.innerHTML = '';
    const piece = tray[i];
    if (!piece) return;
    const { rows, cols } = shapeDims(piece.cells);
    const pieceEl = document.createElement('div');
    pieceEl.className = 'tray-piece';
    pieceEl.dataset.slot = String(i);
    const blockSize = Math.min(26, 96 / Math.max(rows, cols));
    pieceEl.style.gridTemplateColumns = `repeat(${cols}, ${blockSize}px)`;
    pieceEl.style.gridTemplateRows = `repeat(${rows}, ${blockSize}px)`;
    pieceEl.style.gap = '4px';
    for (const [r, c] of piece.cells) {
      const block = document.createElement('div');
      block.className = 'tray-block';
      block.style.backgroundColor = piece.color;
      block.style.gridRow = String(r + 1);
      block.style.gridColumn = String(c + 1);
      pieceEl.appendChild(block);
    }
    slot.appendChild(pieceEl);
    slot.onpointerdown = (e) => onPieceGrab(e, i, pieceEl);
  });
}

function canPlace(row, col, cells) {
  for (const [dr, dc] of cells) {
    const rr = row + dr;
    const cc = col + dc;
    if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE || board[rr][cc]) return false;
  }
  return true;
}

function anyValidSpotFor(cells) {
  const { rows, cols } = shapeDims(cells);
  for (let r = 0; r <= SIZE - rows; r++) {
    for (let c = 0; c <= SIZE - cols; c++) {
      if (canPlace(r, c, cells)) return true;
    }
  }
  return false;
}

function checkGameOver() {
  const active = tray.filter(Boolean);
  const stuck = active.every((p) => !anyValidSpotFor(p.cells));
  if (stuck && active.length > 0) {
    finalScoreEl.textContent = score;
    overlayEl.classList.remove('hidden');
  }
}

function findHint() {
  for (let slotIndex = 0; slotIndex < tray.length; slotIndex++) {
    const piece = tray[slotIndex];
    if (!piece) continue;
    const { rows, cols } = shapeDims(piece.cells);
    for (let r = 0; r <= SIZE - rows; r++) {
      for (let c = 0; c <= SIZE - cols; c++) {
        if (canPlace(r, c, piece.cells)) {
          return { slotIndex, row: r, col: c, piece };
        }
      }
    }
  }
  return null;
}

function showHint() {
  const hint = findHint();
  if (!hint) return;
  const { row, col, piece, slotIndex } = hint;

  hintBtn.disabled = true;
  for (const [dr, dc] of piece.cells) {
    boardCells[row + dr][col + dc].classList.add('hint');
  }
  const slotEls = trayEl.querySelectorAll('.tray-slot');
  const slotEl = slotEls[slotIndex];
  if (slotEl) slotEl.classList.add('hint-slot');

  setTimeout(() => {
    for (const [dr, dc] of piece.cells) {
      boardCells[row + dr][col + dc].classList.remove('hint');
    }
    if (slotEl) slotEl.classList.remove('hint-slot');
    hintBtn.disabled = false;
  }, 1400);
}

function updateScore(delta) {
  score += delta;
  animateScoreTo(score);
  if (score > best) {
    best = score;
    bestEl.textContent = best;
    localStorage.setItem('blockblast-best', String(best));
  }
}

function clearFullLines(onDone) {
  const fullRows = [];
  const fullCols = [];
  for (let r = 0; r < SIZE; r++) {
    if (board[r].every((v) => v)) fullRows.push(r);
  }
  for (let c = 0; c < SIZE; c++) {
    if (board.every((row) => row[c])) fullCols.push(c);
  }
  if (fullRows.length === 0 && fullCols.length === 0) {
    onDone();
    return;
  }

  const toClear = [];
  const seen = new Set();
  const addCell = (r, c) => {
    const key = `${r},${c}`;
    if (seen.has(key)) return;
    seen.add(key);
    toClear.push({ cell: boardCells[r][c], color: board[r][c] });
  };
  fullRows.forEach((r) => {
    for (let c = 0; c < SIZE; c++) addCell(r, c);
  });
  fullCols.forEach((c) => {
    for (let r = 0; r < SIZE; r++) addCell(r, c);
  });
  const maxDelay = Math.min((toClear.length - 1) * 10, 150);
  toClear.forEach(({ cell, color }, idx) => {
    const delay = Math.min(idx * 10, 150);
    cell.style.animationDelay = `${delay}ms`;
    cell.classList.add('clearing');
    setTimeout(() => spawnBurstParticles(cell, color), delay);
  });

  const lines = fullRows.length + fullCols.length;
  updateScore(lines * 100 + (lines > 1 ? (lines - 1) * 50 : 0));
  maybeShiftPalette(lines);

  setTimeout(() => {
    fullRows.forEach((r) => board[r].fill(null));
    fullCols.forEach((c) => {
      for (let r = 0; r < SIZE; r++) board[r][c] = null;
    });
    toClear.forEach(({ cell }) => {
      cell.classList.remove('clearing');
      cell.style.animationDelay = '';
    });
    renderBoard();
    onDone();
  }, 460 + maxDelay);

  if (navigator.vibrate) {
    navigator.vibrate(lines >= 3 ? [25, 40, 25, 40, 40] : lines === 2 ? [25, 40, 25] : 25);
  }
}

function spawnBurstParticles(cell, color) {
  const rect = cell.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'burst-particle';
    particle.style.left = `${cx}px`;
    particle.style.top = `${cy}px`;
    particle.style.background = color;
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const dist = 24 + Math.random() * 20;
    particle.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
    document.body.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove());
  }
}

function maybeShiftPalette(lines) {
  const shouldShift = lines >= 2 || Math.random() < 0.35;
  if (!shouldShift) return;
  paletteHue = Math.floor(Math.random() * 61) - 30;
  bgIndex = (bgIndex + 1) % BG_TONES.length;
  applyThemeHue();
}

function applyThemeHue() {
  const tone = BG_TONES[bgIndex];
  document.body.style.backgroundColor = `hsl(${tone.hue}, ${tone.sat}%, ${tone.light}%)`;
  boardEl.style.setProperty('--tile-hue', `${paletteHue}deg`);
}

function placePiece(row, col, piece, slotIndex) {
  for (const [dr, dc] of piece.cells) {
    board[row + dr][col + dc] = piece.color;
  }
  updateScore(piece.cells.length);
  tray[slotIndex] = null;
  renderBoard();
  renderTray();
  refillTrayIfEmpty();
  clearFullLines(() => checkGameOver());
  if (navigator.vibrate) navigator.vibrate(15);
}

function getCellMetrics() {
  const r00 = boardCells[0][0].getBoundingClientRect();
  const r01 = boardCells[0][1].getBoundingClientRect();
  const r10 = boardCells[1][0].getBoundingClientRect();
  return {
    originX: r00.left,
    originY: r00.top,
    stepX: r01.left - r00.left,
    stepY: r10.top - r00.top,
    cellW: r00.width,
    cellH: r00.height,
  };
}

function clearPreview() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      boardCells[r][c].classList.remove('preview-valid', 'preview-invalid');
    }
  }
}

function showPreview(row, col, cells, valid) {
  clearPreview();
  for (const [dr, dc] of cells) {
    const cell = boardCells[row + dr][col + dc];
    if (cell) cell.classList.add(valid ? 'preview-valid' : 'preview-invalid');
  }
}

const DRAG_LIFT = 90;
let rafId = null;
let pendingPoint = null;

function onPieceGrab(e, slotIndex, pieceEl) {
  if (dragState) return;
  const piece = tray[slotIndex];
  if (!piece) return;
  e.preventDefault();

  pieceEl.classList.add('hidden-piece');

  const metrics = getCellMetrics();
  const { rows, cols } = shapeDims(piece.cells);
  const blockSize = metrics.cellW;
  const gap = metrics.stepX - metrics.cellW;
  const ghostW = cols * blockSize + (cols - 1) * gap;
  const ghostH = rows * blockSize + (rows - 1) * gap;

  ghostEl = document.createElement('div');
  ghostEl.id = 'drag-ghost';
  ghostEl.style.gridTemplateColumns = `repeat(${cols}, ${blockSize}px)`;
  ghostEl.style.gridTemplateRows = `repeat(${rows}, ${blockSize}px)`;
  ghostEl.style.gap = `${gap}px`;
  for (const [r, c] of piece.cells) {
    const block = document.createElement('div');
    block.className = 'tray-block';
    block.style.backgroundColor = piece.color;
    block.style.width = `${blockSize}px`;
    block.style.height = `${blockSize}px`;
    block.style.gridRow = String(r + 1);
    block.style.gridColumn = String(c + 1);
    ghostEl.appendChild(block);
  }
  document.body.appendChild(ghostEl);

  dragState = {
    slotIndex,
    piece,
    pieceEl,
    metrics,
    rows,
    cols,
    ghostHalfW: ghostW / 2,
    ghostHalfH: ghostH / 2,
    startX: e.clientX,
    startY: e.clientY,
    moved: false,
  };
  updateDrag(e.clientX, e.clientY);

  document.addEventListener('pointermove', onDragMove);
  document.addEventListener('pointerup', onDragEnd);
  document.addEventListener('pointercancel', onDragEnd);
}

function computeDropCell(clientX, clientY) {
  const { originX, originY, stepX, stepY } = dragState.metrics;
  const { rows, cols } = dragState;
  const vx = clientX - originX;
  const vy = clientY - DRAG_LIFT - originY;
  let col = Math.round(vx / stepX - cols / 2);
  let row = Math.round(vy / stepY - rows / 2);
  row = Math.max(0, Math.min(SIZE - rows, row));
  col = Math.max(0, Math.min(SIZE - cols, col));
  return { row, col };
}

const DRAG_MOVE_THRESHOLD = 10;

function updateDrag(clientX, clientY) {
  const x = clientX - dragState.ghostHalfW;
  const y = clientY - DRAG_LIFT - dragState.ghostHalfH;
  ghostEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;

  if (!dragState.moved) {
    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;
    if (Math.hypot(dx, dy) >= DRAG_MOVE_THRESHOLD) dragState.moved = true;
  }

  const { row, col } = computeDropCell(clientX, clientY);
  if (row === dragState.lastRow && col === dragState.lastCol) return;

  const valid = canPlace(row, col, dragState.piece.cells);
  showPreview(row, col, dragState.piece.cells, valid);
  dragState.lastRow = row;
  dragState.lastCol = col;
  dragState.lastValid = valid;
}

function onDragMove(e) {
  if (!dragState) return;
  pendingPoint = { x: e.clientX, y: e.clientY };
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    if (dragState && pendingPoint) updateDrag(pendingPoint.x, pendingPoint.y);
  });
}

function onDragEnd() {
  if (!dragState) return;
  document.removeEventListener('pointermove', onDragMove);
  document.removeEventListener('pointerup', onDragEnd);
  document.removeEventListener('pointercancel', onDragEnd);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  pendingPoint = null;

  clearPreview();
  ghostEl.remove();
  ghostEl = null;

  const { lastRow, lastValid, lastCol, piece, slotIndex, pieceEl, moved } = dragState;
  if (moved && lastValid) {
    placePiece(lastRow, lastCol, piece, slotIndex);
  } else {
    pieceEl.classList.remove('hidden-piece');
  }
  dragState = null;
}

function startNewGame() {
  board = Array.from({ length: SIZE }, () => Array(SIZE).fill(null));
  score = 0;
  resetScoreDisplay();
  paletteHue = 0;
  bgIndex = 0;
  document.body.style.backgroundColor = '';
  boardEl.style.setProperty('--tile-hue', '0deg');
  tray = [randomPiece(), randomPiece(), randomPiece()];
  overlayEl.classList.add('hidden');
  buildBoard();
  renderBoard();
  renderTray();
}

restartBtn.addEventListener('click', startNewGame);
hintBtn.addEventListener('click', showHint);

startNewGame();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

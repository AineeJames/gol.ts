import { exit } from 'process';
import * as readline from 'readline';

enum CellState {
  Dead,
  Alive
}

type Cells = CellState[][];

const init2DArray = <T>(rows: number, cols: number, create_val: () => T): T[][] =>
  Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => create_val())
  );

const showCells = (cells: Cells): void => {
  process.stdout.write('\x1Bc');
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      if (row === cursorRow && col === cursorCol) {
        process.stdout.write(cells[row][col] === CellState.Alive ? "▓▓" : "░░");
      } else {
        process.stdout.write(cells[row][col] === CellState.Alive ? "██" : "  ");
      }
    }
    process.stdout.write("\n");
  }
}

const countNeighbors = (cells: Cells, row: number, col: number): number => {
  let n = 0;
  for (let drow = -1; drow <= 1; drow++) {
    for (let dcol = -1; dcol <= 1; dcol++) {
      if (drow === 0 && dcol === 0) continue;
      const nrow = row + drow;
      const ncol = col + dcol;
      if (nrow < 0 || nrow >= cells.length) continue;
      if (ncol < 0 || ncol >= cells[0].length) continue;
      if (cells[row + drow][col + dcol] === CellState.Alive) n++;
    }
  }
  return n;
}

const updateCells = (cells: Cells): Cells => {
  let new_cells: Cells = init2DArray<CellState>(cells.length, cells[0].length, () => CellState.Dead);
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[0].length; col++) {
      const n = countNeighbors(cells, row, col);
      if (cells[row][col] === CellState.Alive && n < 2) new_cells[row][col] = CellState.Dead;
      if (cells[row][col] === CellState.Alive && (n === 2 || n === 3)) new_cells[row][col] = CellState.Alive;
      if (cells[row][col] === CellState.Alive && n > 3) new_cells[row][col] = CellState.Dead;
      if (cells[row][col] === CellState.Dead && n === 3) new_cells[row][col] = CellState.Alive;
    }
  }
  return new_cells;
}

const randomizeCells = (cells: Cells): void => {
  for (let row = 0; row < cells.length; row++) {
    for (let col = 0; col < cells[row].length; col++) {
      cells[row][col] = Math.random() < 0.5 ? CellState.Alive : CellState.Dead;
    }
  }
}

const setupInputHandler = () => {

  process.stdout.write('\x1b[?1000h'); // Enable mouse tracking

  process.on('exit', () => {
    process.stdout.write('\x1b[?1000l'); // Disable mouse tracking
  });

  readline.emitKeypressEvents(process.stdin);

  if (process.stdin.isTTY) process.stdin.setRawMode(true);

  process.stdin.on('data', (data) => {
    // Mouse event
    if (data[0] === 0x1b && data[1] === 0x5b && data[2] === 0x4d) {
      const button = data[3] - 32;
      const column = data[4] - 32;
      const row = data[5] - 32;

      if (button === 0) { // Left click
        const cellColumn = Math.floor((column - 1) / 2);
        const cellRow = row - 1;

        if (cellRow >= 0 && cellRow < cells.length && cellColumn >= 0 && cellColumn < cells[0].length) {
          cells[cellRow][cellColumn] = cells[cellRow][cellColumn] === CellState.Alive ? CellState.Dead : CellState.Alive;
        }
      }
    }
  });

  process.stdin.on("keypress", (_, key: readline.Key) => {
    if (key && (key.name === 'c' && key.ctrl) || key.name === "escape") {
      console.log("\nExiting...");
      process.exit(0);
    } else if (key) {
      switch (key.sequence) {
        case "+":
          if (speed_mult + 0.25 <= 5) speed_mult += 0.25;
          break;
        case "-":
          if (speed_mult - 0.25 >= 0.25) speed_mult -= 0.25;
          break;
      }
      switch (key.name) {
        case "c":
          clear = true;
          break;
        case "r":
          randomize = true;
          break;
        case "p":
          paused = !paused;
          break;
        case "left":
          if (cursorCol >= 1) cursorCol -= 1;
          break;
        case "right":
          if (cursorCol < cells[0].length - 1) cursorCol += 1;
          break;
        case "up":
          if (cursorRow >= 1) cursorRow -= 1;
          break;
        case "down":
          if (cursorRow < cells.length - 1) cursorRow += 1;
          break;
        case "space":
          cells[cursorRow][cursorCol] = cells[cursorRow][cursorCol] === CellState.Alive ? CellState.Dead : CellState.Alive;
          break;
      }
    }
  });
}

let cells: Cells = init2DArray<CellState>(process.stdout.rows - 2, process.stdout.columns / 2, () => CellState.Dead);
let randomize = false;
let clear = false;
let paused = false;
let speed_mult = 1;
let cursorRow = 0;
let cursorCol = 0;

const main = () => {
  setupInputHandler();

  // Link: https://conwaylife.com/wiki/Achim%27s_p16
  const shape = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ]
  let middleRow = Math.floor((process.stdout.rows - 2) / 2) - Math.floor(shape.length / 2);
  let middleCol = Math.floor((process.stdout.columns / 2) / 2) - Math.floor(shape[0].length / 2);
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[0].length; col++) {
      if (shape[row][col] === 1) {
        cells[middleRow + row][middleCol + col] = CellState.Alive;
      }
    }
  }

  let frameCount = 0;
  const gameLoop = () => {
    if (clear) {
      cells = init2DArray<CellState>(Math.floor(process.stdout.rows - 2), Math.floor(process.stdout.columns / 2), () => CellState.Dead);
      clear = false;
    }

    if (randomize) {
      randomizeCells(cells);
      randomize = false;
    }

    if (!paused && frameCount % Math.floor(5 / speed_mult) === 0) {
      cells = updateCells(cells);
    }

    process.stdout.write('\x1Bc'); // Clear screen
    showCells(cells);
    process.stdout.write(`Status: ${paused ? "PAUSED" : "PLAYING"} @ ${speed_mult}x | Cursor: (${cursorCol}, ${cursorRow}) = ${cells[cursorRow][cursorCol] === CellState.Alive ? "alive" : "dead"}\n`)
    let controls = [
      ["↑↓←→", "Move"],
      ["SPACE", "Toggle"],
      ["R", "Randomize"],
      ["C", "Clear"],
      ["P", paused ? "Play " : "Pause"],
      ["+/-", "Speed"],
      ["ESC", "Exit"]
    ];
    const formattedControls = controls.map(([key, action]) => `${key}:${action}`).join(" | ");
    process.stdout.write("Controls: " + formattedControls);

    frameCount += 1;

    setTimeout(gameLoop, 25);
  }
  gameLoop();

}

main();

/**
 * @author Abrorjon Asralov
 */

import {DFS, BFS, Astar} from "./PathFinder.js"

function generateMaze(rows, cols) {
    // make grid full of walls
    let maze = Array.from({ length: rows }, () => Array(cols).fill(1));
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    function carve(r, c) {
        maze[r][c] = 0;
        let directions = shuffle([
            [0, 2],   // right
            [0, -2],  // left
            [2, 0],   // down
            [-2, 0]   // up
        ]);
        for (let [dr, dc] of directions) {

            let nr = r + dr;
            let nc = c + dc;
            if (
                nr > 0 && nr < rows - 1 &&
                nc > 0 && nc < cols - 1 &&
                maze[nr][nc] === 1
            ) {
                maze[r + dr / 2][c + dc / 2] = 0;
                carve(nr, nc);
            }
        }
    }
    carve(1, 1);
    // add a 5% chance to tear down a wall and create a loop
    for (let r = 1; r < rows - 1; r++) {
        for (let c = 1; c < cols - 1; c++) {
            if (maze[r][c] === 1 && Math.random() < 0.05) {
                maze[r][c] = 0;
            }
        }
    }
    return maze;
}



function renderGrid() {
    gridElement.innerHTML = "";
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            if (maze[r][c] === 1) {
                cell.classList.add("wall");
            }
            cell.dataset.row = r;
            cell.dataset.col = c;
            gridElement.appendChild(cell);
        }
    }
}



function buildDrawGrid() {
    drawGrid.innerHTML = "";
    drawGrid.style.gridTemplateColumns = `repeat(${cols}, 20px)`;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement("div");
            cell.classList.add("draw-cell");
            cell.dataset.row = r;
            cell.dataset.col = c;
            // borders forced walls
            if (r === 0 || c === 0 || r === rows-1 || c === cols-1) {
                cell.classList.add("draw-wall");
            }
            cell.addEventListener("click", () => {
                if (r === 0 || c === 0 || r === rows-1 || c === cols-1) return;
                cell.classList.toggle("draw-wall");
            });
            drawGrid.appendChild(cell);
        }
    }
}


function clearPath() {
    document.querySelectorAll(".visited, .path").forEach(cell => {
        cell.classList.remove("visited", "path");
    });

}

function clearMaze() {
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => {
        cell.classList.remove("visited", "path", "start", "goal");
    });
    start = null;
    goal = null;
}


function setButtonsDisabled(state) {
    document.getElementById("runBFS").disabled = state;
    document.getElementById("runDFS").disabled = state;
    document.getElementById("runAstar").disabled = state;
    document.getElementById("clear").disabled = state;
    document.getElementById("newMaze").disabled = state;
    document.getElementById("mazeSize").disabled = state;
    document.getElementById("drawMaze").disabled = state;
}


function visualize(result) {
    isRunning = true;
    setButtonsDisabled(true);
    const { visitedOrder, path } = result;
    visitedOrder.forEach((node, i) => {
        setTimeout(() => {
            const selector = `[data-row='${node.row}'][data-col='${node.col}']`;
            const cell = document.querySelector(selector);
            if (!cell.classList.contains("start") &&
                !cell.classList.contains("goal")) {
                cell.classList.add("visited");
            }
        }, i * 20);
    });
    path.forEach((node, i) => {
        setTimeout(() => {
            const selector = `[data-row='${node.row}'][data-col='${node.col}']`;
            const cell = document.querySelector(selector);
            if (!cell.classList.contains("start") &&
                !cell.classList.contains("goal")) {
                cell.classList.add("path");
            }
        }, visitedOrder.length * 20 + i * 40);
    });
    const totalTime =
    result.visitedOrder.length * 20 +
    result.path.length * 40;
    setTimeout(() => {
        isRunning = false;
        setButtonsDisabled(false);
    }, totalTime);
}


let isRunning = false;
// by default
let rows = 23;
let cols = 23;
let start = null;
let goal = null;

let maze = generateMaze(rows, cols);
document.getElementById("mazeSize").addEventListener("change", (e) => {
    if (isRunning) return;
    const size = e.target.value;
    if (size === "small") {
        rows = 15;
        cols = 15;
    }
    if (size === "medium") {
        rows = 23;
        cols = 23;
    }
    if (size === "large") {
        rows = 31;
        cols = 31;
    }
    maze = generateMaze(rows, cols);
    start = null;
    goal = null;
    gridElement.style.gridTemplateColumns = `repeat(${cols}, 25px)`;
    renderGrid();
});

const gridElement = document.getElementById("grid");
gridElement.style.gridTemplateColumns = `repeat(${cols}, 25px)`;

// always generate by default medium random maze
renderGrid();

// get start and goal cells
gridElement.addEventListener("click", (e) => {
    const cell = e.target;
    if (!cell.classList.contains("cell")) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (maze[row][col] === 1) return; // wall
    if (start && start.row === row && start.col === col) {
        cell.classList.remove("start");
        start = null;
    } else if (goal && goal.row === row && goal.col === col) {
        cell.classList.remove("goal");
        goal = null;
    } else if (!start) {
        start = {row, col};
        cell.classList.add("start");
    } else if (!goal) {
        goal = {row, col};
        cell.classList.add("goal");
    }
});

// BFS algorithm
document.getElementById("runBFS").addEventListener("click", () => {
    if (isRunning) return;
    if (!start || !goal) {
        alert("Select start and goal");
        return;
    }
    clearPath();
    const result = BFS(maze, start, goal);
    if (result.path.length === 0) {
        clearMaze();
        alert("No path was found!");
        return;
    }
    visualize(result);
});

// DFS algorithm
document.getElementById("runDFS").addEventListener("click", () => {
    if (isRunning) return;
    if (!start || !goal) {
        alert("Select start and goal first");
        return;
    }
    clearPath();
    const result = DFS(maze, start, goal);
    if (result.path.length === 0) {
        clearMaze();
        alert("No path was found!");
        return;
    }
    visualize(result);
});

// A* algorithm
document.getElementById("runAstar").addEventListener("click", () => {
    if (isRunning) return;
    if (!start || !goal) {
        alert("Selected start and goal first");
        return;
    }
    clearPath();
    const result = Astar(maze, start, goal);
    if (result.path.length === 0) {
        clearMaze();
        alert("No path was found!");
        return;
    }
    visualize(result);
})

// little pop up window for drawing
const drawModal = document.getElementById("drawModal");
const drawGrid = document.getElementById("drawGrid");

// build your own maze
document.getElementById("drawMaze").addEventListener("click", () => {
    if (isRunning) return;
    drawModal.classList.remove("hidden");
    buildDrawGrid();
});

// apply a drawn maze
document.getElementById("applyMaze").addEventListener("click", () => {
    const cells = document.querySelectorAll(".draw-cell");
    maze = Array.from({ length: rows }, () => Array(cols).fill(0));
    cells.forEach(cell => {
        const r = Number(cell.dataset.row);
        const c = Number(cell.dataset.col);
        if (cell.classList.contains("draw-wall")) {
            maze[r][c] = 1;
        }

    });
    start = null;
    goal = null;
    renderGrid();
    drawModal.classList.add("hidden");
});

// cancel the draw
document.getElementById("cancelDraw").addEventListener("click", () => {
    drawModal.classList.add("hidden");
});

// clear maze
document.getElementById("clear").addEventListener("click", () => {
    clearMaze();
    resetStats();
});

// generate maze
document.getElementById("newMaze").addEventListener("click", () => {
    if (isRunning) return;
    maze = generateMaze(rows, cols);
    start = null;
    goal = null;
    renderGrid();
});
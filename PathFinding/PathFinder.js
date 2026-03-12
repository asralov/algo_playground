
function key(node) {
    return `${node.row},${node.col}`;
}

function reconstructPath(parent, start, goal) {

    const path = [];
    let current = goal;

    while (current) {

        path.push(current);

        const p = parent.get(key(current));
        current = p;
    }

    return path.reverse();
}


function getNeighbors(maze, row, col) {

    const directions = [
        [1,0],   // down
        [-1,0],  // up
        [0,1],   // right
        [0,-1]   // left
    ];

    const neighbors = [];

    for (let [dr, dc] of directions) {

        const nr = row + dr;
        const nc = col + dc;

        if (
            nr >= 0 &&
            nr < maze.length &&
            nc >= 0 &&
            nc < maze[0].length &&
            maze[nr][nc] === 0
        ) {
            neighbors.push({row: nr, col: nc});
        }
    }

    return neighbors;
}


function DFS(maze, start, goal) {
    const stack = [];
    const visited = new Set();
    const parent = new Map();
    const visitedOrder = [];
    stack.push(start);

    while (stack.length > 0) {
        const current = stack.pop();
        visitedOrder.push(current);
        if (visited.has(key(current))) {
            continue;
        }

        visited.add(key(current));

        if (current.row === goal.row && current.col === goal.col) {
            break;
        }

        const neighbors = getNeighbors(maze, current.row, current.col);

        for (let neighbor of neighbors) {
            if (!visited.has(key(neighbor))) {
                parent.set(key(neighbor), current);
                stack.push(neighbor);
            }
        }
    }

    if (!parent.has(key(goal))) {
        return {visitedOrder, path: []};
    }
    const path = reconstructPath(parent, start, goal);
    return {visitedOrder, path};
}


function BFS(maze, start, goal) {
    const queue = [];
    const visited = new Set();
    const parent = new Map();
    const visitedOrder = [];

    queue.push(start);
    visited.add(key(start));

    while (queue.length > 0) {
        const current = queue.shift();
        visitedOrder.push(current);
        if (current.row === goal.row && current.col === goal.col) {
            break;
        }

        const neighbors = getNeighbors(maze, current.row, current.col);

        for (let neighbor of neighbors) {
            if (!visited.has(key(neighbor))) {
                visited.add(key(neighbor));
                parent.set(key(neighbor), current);
                queue.push(neighbor);
            }
        }
    }
    if (!parent.has(key(goal))) {
        return { visitedOrder, path: [] };
    }
    const path = reconstructPath(parent, start, goal);
    return {visitedOrder, path};

}
function manhattan(a, b) {
    return Math.abs(a.row - b.row) + Math.abs(a.col - b.col);
}

function Astar(maze, start, goal) {

    const openSet = [];                   // priority queue (we'll sort by fScore)
    const cameFrom = new Map();           // to reconstruct path
    const gScore = new Map();             // cost from start
    const fScore = new Map();             // g + heuristic
    const visitedOrder = [];              // for visualization

    // initialize
    gScore.set(key(start), 0);
    fScore.set(key(start), manhattan(start, goal));
    openSet.push({...start, f: fScore.get(key(start))});

    while (openSet.length > 0) {

        // sort by fScore and pick the lowest
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        visitedOrder.push(current);

        // reached goal
        if (current.row === goal.row && current.col === goal.col) {
            const path = reconstructPath(cameFrom, start, goal);
            return {visitedOrder, path};
        }

        const neighbors = getNeighbors(maze, current.row, current.col);

        for (let neighbor of neighbors) {

            const tentative_gScore = gScore.get(key(current)) + 1;

            if (tentative_gScore < (gScore.get(key(neighbor)) ?? Infinity)) {

                cameFrom.set(key(neighbor), current);
                gScore.set(key(neighbor), tentative_gScore);
                fScore.set(key(neighbor), tentative_gScore + manhattan(neighbor, goal));

                // check if neighbor is already in openSet
                if (!openSet.some(n => n.row === neighbor.row && n.col === neighbor.col)) {
                    openSet.push({...neighbor, f: fScore.get(key(neighbor))});
                }

            }

        }

    }

    // no path found
    return {visitedOrder, path: []};
}

export {DFS, BFS, Astar};
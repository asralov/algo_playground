import { BST, Node } from "./BST.js";

const tree = new BST();
const display = document.getElementById('tree-display');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let isWorking = false;
const insertBtn = document.getElementById('insertBtn');
const deleteBtn = document.getElementById('deleteBtn');
const bstInput = document.getElementById('bstInput');

// --- INSERT LOGIC ---
async function handleInsert() {
    if (isWorking) return;
    
    const val = parseInt(bstInput.value);
    if (isNaN(val)) {
        alert("Please enter a valid number");
        return;
    }

    toggleControls(true);
    
    if (!tree.root) {
        tree.root = new Node(val);
        drawTree();
    } else {
        await animateInsertion(tree.root, val);
    }
    
    bstInput.value = '';
    bstInput.focus();
    toggleControls(false);
}

async function animateInsertion(root, val) {
    let current = root;
    while (current) {
        const visualNode = document.getElementById(`node-${current.value}`);
        if (visualNode) {
            visualNode.classList.add('traversing');
            await sleep(800);
            visualNode.classList.remove('traversing');
        }

        if (val < current.value) {
            if (!current.left) {
                current.left = new Node(val);
                break;
            }
            current = current.left;
        } else if (val > current.value) {
            if (!current.right) {
                current.right = new Node(val);
                break;
            }
            current = current.right;
        } else {
            alert("Value already exists!");
            break;
        }
    }
    drawTree();
}

// --- DELETE LOGIC ---
async function handleDelete() {
    if (isWorking) return;
    
    const val = parseInt(bstInput.value);
    if (isNaN(val)) return;

    if (!tree.root) {
        alert("The tree is already empty!");
        return;
    }

    toggleControls(true);
    
    const result = await deleteNodeAnimated(tree.root, val);
    
    if (result === "not_found") {
        alert(`Node ${val} does not exist in the tree!`);
    } else {
        tree.root = result;
        drawTree();
    }

    bstInput.value = '';
    bstInput.focus();
    toggleControls(false);
}

async function deleteNodeAnimated(node, val) {
    if (!node) return "not_found";

    const visualNode = document.getElementById(`node-${node.value}`);
    if (visualNode) {
        visualNode.classList.add('traversing');
        await sleep(600);
        visualNode.classList.remove('traversing');
    }

    if (val < node.value) {
        const result = await deleteNodeAnimated(node.left, val);
        if (result === "not_found") return "not_found"; 
        node.left = result;
        return node;
    } else if (val > node.value) {
        const result = await deleteNodeAnimated(node.right, val);
        if (result === "not_found") return "not_found";
        node.right = result;
        return node;
    } else {
        if (!node.left) return node.right;
        if (!node.right) return node.left;

        let successor = node.right;
        while (successor.left) {
            successor = successor.left;
        }
        
        node.value = successor.value;
        node.right = await deleteNodeAnimated(node.right, successor.value);
        return node;
    }
}

// --- VISUALS & UTILS ---
function toggleControls(state) {
    isWorking = state;
    insertBtn.disabled = state;
    deleteBtn.disabled = state;
}

function getDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getDepth(node.left), getDepth(node.right));
}

function drawTree() {
    display.innerHTML = '';
    if (!tree.root) return;
    
    // Fixed: calling the correct function name (getDepth)
    const depth = getDepth(tree.root);
    display.style.minHeight = `${depth * 100 + 200}px`; 
    
    render(tree.root, display.offsetWidth / 2, 50, display.offsetWidth / 4);
    
    display.scrollTo({ top: display.scrollHeight, behavior: 'smooth' });
}

function render(node, x, y, horizontalSpacing) {
    if (!node) return;

    const div = document.createElement('div');
    div.className = 'node';
    div.id = `node-${node.value}`;
    div.innerText = node.value;
    div.style.left = `${x - 20}px`;
    div.style.top = `${y}px`;
    display.appendChild(div);

    const verticalGap = 80;

    if (node.left) {
        const nextX = x - horizontalSpacing;
        const nextY = y + verticalGap;
        drawLine(x, y + 20, nextX, nextY + 20);
        render(node.left, nextX, nextY, horizontalSpacing / 2);
    }

    if (node.right) {
        const nextX = x + horizontalSpacing;
        const nextY = y + verticalGap;
        drawLine(x, y + 20, nextX, nextY + 20);
        render(node.right, nextX, nextY, horizontalSpacing / 2);
    }
}

function drawLine(x1, y1, x2, y2) {
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

    const line = document.createElement('div');
    line.className = 'edge';
    line.style.width = `${length}px`;
    line.style.left = `${x1}px`;
    line.style.top = `${y1}px`;
    line.style.transform = `rotate(${angle}deg)`;
    
    display.appendChild(line);
}

// --- EVENT LISTENERS ---
insertBtn.addEventListener('click', handleInsert);
deleteBtn.addEventListener('click', handleDelete);

bstInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleInsert();
});
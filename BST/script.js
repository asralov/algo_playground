import { BST, Node } from "./BST.js";

const tree = new BST();
const display = document.getElementById('tree-display');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function insertNode() {
    const val = parseInt(document.getElementById('bstInput').value);
    if (isNaN(val)) return;

    if (!tree.root) {
        tree.root = new Node(val);
        drawTree();
    } else {
        await animateInsertion(tree.root, val);
    }
}

async function animateInsertion(root, val) {
    let current = root;
    let parent = null;

    while (current) {
        // 1. Highlight the current node being compared
        const visualNode = document.getElementById(`node-${current.value}`);
        visualNode.classList.add('traversing');
        await sleep(800); // Wait 0.8s for the user to see
        visualNode.classList.remove('traversing');

        parent = current;
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
            return;
        }
    }
    drawTree();
}

let isWorking = false;

const insertBtn = document.getElementById('insertBtn');
const deleteBtn = document.getElementById('deleteBtn');

async function handleInsert() {
    if (isWorking) return;
    
    const val = parseInt(document.getElementById('bstInput').value);
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
    
    // Clear and focus for the next entry
    document.getElementById('bstInput').value = '';
    document.getElementById('bstInput').focus();
    
    toggleControls(false);
}

async function handleDelete() {
    if (isWorking) return;
    
    const val = parseInt(document.getElementById('bstInput').value);
    if (isNaN(val)) return;

    if (!tree.root) {
        alert("The tree is already empty!");
        return;
    }

    toggleControls(true);
    
    // Attempt the deletion
    const result = await deleteNodeAnimated(tree.root, val);
    
    if (result === "not_found") {
        alert(`Node ${val} does not exist in the tree!`);
    } else {
        tree.root = result;
        drawTree();
    }

    // Clear and focus
    document.getElementById('bstInput').value = '';
    document.getElementById('bstInput').focus();
    
    toggleControls(false);
}


async function deleteNodeAnimated(node, val) {
    if (!node) return "not_found";

    // Traversal Animation
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
        // FOUND IT - Handling the 3 Deletion Cases
        // Case 1 & 2: No child or 1 child
        if (!node.left) return node.right;
        if (!node.right) return node.left;

        // Case 3: Two children
        let successor = node.right;
        while (successor.left) {
            successor = successor.left;
        }
        
        node.value = successor.value;
        // We delete the successor node from the right subtree
        node.right = await deleteNodeAnimated(node.right, successor.value);
        return node;
    }
}

// Connect the buttons to the handler functions
document.getElementById('insertBtn').addEventListener('click', handleInsert);
document.getElementById('deleteBtn').addEventListener('click', handleDelete);

// Bonus: Allow pressing "Enter" in the input box to trigger insertion
document.getElementById('bstInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleInsert();
    }
});

function toggleControls(state) {
    isWorking = state;
    insertBtn.disabled = state;
    deleteBtn.disabled = state;
}

// Update drawTree to handle height
function drawTree() {
    display.innerHTML = '';
    if (!tree.root) return;
    
    const depth = getTreeHeight(tree.root);
    display.style.minHeight = `${depth * 100 + 200}px`; 
    
    render(tree.root, display.offsetWidth / 2, 50, display.offsetWidth / 4);
    
    // Optional: Smooth scroll the container to the bottom if it overflows
    display.scrollTo({
        top: display.scrollHeight,
        behavior: 'smooth'
    });
}

function getDepth(node) {
    if (!node) return 0;
    return 1 + Math.max(getDepth(node.left), getDepth(node.right));
}

function render(node, x, y, horizontalSpacing) {
    if (!node) return;

    // 1. Create and position the Node circle
    const div = document.createElement('div');
    div.className = 'node';
    div.id = `node-${node.value}`;
    div.innerText = node.value;
    div.style.left = `${x - 20}px`; // Center the 40px circle
    div.style.top = `${y}px`;
    display.appendChild(div);

    const verticalGap = 80;

    // 2. Handle Left Child
    if (node.left) {
        const nextX = x - horizontalSpacing;
        const nextY = y + verticalGap;
        drawLine(x, y + 20, nextX, nextY + 20); // Connect centers
        render(node.left, nextX, nextY, horizontalSpacing / 2);
    }

    // 3. Handle Right Child
    if (node.right) {
        const nextX = x + horizontalSpacing;
        const nextY = y + verticalGap;
        drawLine(x, y + 20, nextX, nextY + 20); // Connect centers
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
document.getElementById('insertBtn').addEventListener('click', insertNode);
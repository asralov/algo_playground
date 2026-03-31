const treeContainer = document.getElementById('tree-container');
const startBtn = document.getElementById('startBtn');
const arrayInput = document.getElementById('arrayInput');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');

let history = []; 
let isPlaying = false;

async function startVisualization() {
    const input = arrayInput.value.split(',')
        .map(n => parseInt(n.trim()))
        .filter(n => !isNaN(n) && n >= 10 && n <= 100);
    
    if (input.length < 2) {
        alert("Please enter at least 2 numbers (10-100) separated by commas.");
        return;
    }
    
    startBtn.disabled = true;
    treeContainer.innerHTML = "";
    history = [];
    isPlaying = true;

    let currentState = []; 
    const record = () => history.push(JSON.parse(JSON.stringify(currentState)));

    async function mergeSort(arr, level) {
        if (!currentState[level]) currentState[level] = [];
        
        const node = { data: [...arr], status: 'splitting', activeIdx: -1 };
        currentState[level].push(node);

        if (arr.length <= 1) {
            node.status = 'sorted';
            return arr;
        }

        const mid = Math.floor(arr.length / 2);
        record(); // Record the split happening

        const leftPromise = mergeSort(arr.slice(0, mid), level + 1);
        const rightPromise = mergeSort(arr.slice(mid), level + 1);

        const [left, right] = await Promise.all([leftPromise, rightPromise]);

        node.status = 'merging';
        record();

        let result = [];
        let i = 0, j = 0;
        while (i < left.length && j < right.length) {
            node.activeIdx = result.length; 
            if (left[i] < right[j]) result.push(left[i++]);
            else result.push(right[j++]);
            
            node.data = [...result, ...left.slice(i), ...right.slice(j)];
            record();
        }

        node.data = [...result, ...left.slice(i), ...right.slice(j)];
        node.activeIdx = -1;
        node.status = 'sorted';
        record();
        return node.data;
    }

    await mergeSort(input, 0);

    for (let i = 0; i < history.length; i++) {
        if (!isPlaying) break;
        render(history[i]);
        // Speed slider logic: higher value = lower delay
        const delay = 2100 - parseInt(speedSlider.value);
        await new Promise(r => setTimeout(r, delay));
    }
    
    if (isPlaying) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#2e7d32', '#4caf50', '#ffffff'] });
    }
    
    startBtn.disabled = false;
    isPlaying = false;
}

function render(state) {
    treeContainer.innerHTML = "";
    state.forEach(level => {
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level';
        
        level.forEach(node => {
            const block = document.createElement('div');
            block.className = `array-block ${node.status}`;
            
            node.data.forEach((val, idx) => {
                const cell = document.createElement('div');
                cell.className = 'num-cell';
                if (idx === node.activeIdx) cell.classList.add('active-cell');
                cell.innerText = val;
                block.appendChild(cell);
            });
            levelDiv.appendChild(block);
        });
        treeContainer.appendChild(levelDiv);
    });
}

resetBtn.addEventListener('click', () => {
    isPlaying = false;
    treeContainer.innerHTML = "";
    startBtn.disabled = false;
    history = [];
});

startBtn.addEventListener('click', startVisualization);
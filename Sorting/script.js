const chartContainer = document.getElementById('chart-container');
const sortInput = document.getElementById('sortInput');
const actionGroup = document.getElementById('sortActions');
const algoSelect = document.getElementById('algoSelect');
const cancelBtn = document.getElementById('cancelBtn');
const speedRange = document.getElementById('speedRange');

let bars = []; 
let barElements = []; 
let sortingGenerator = null; 
let isSorting = false;
let isCancelled = false;

// Stats trackers
let comparisons = 0;
let swaps = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- 1. Adding & Randomizing ---
document.getElementById('addBtn').addEventListener('click', () => {
    const val = parseInt(sortInput.value);
    if (isNaN(val) || val < 10 || val > 100) {
        alert("Please enter a value between 10 and 100.");
        return;
    }
    addBar(val);
    sortInput.value = '';
    sortInput.focus();
});

document.getElementById('randomBtn').addEventListener('click', () => {
    if (isSorting) return;
    resetAll();
    const count = Math.floor(Math.random() * 6) + 10; 
    for (let i = 0; i < count; i++) {
        addBar(Math.floor(Math.random() * 90) + 10);
    }
});

function addBar(val) {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = `${val * 3}px`;
    bar.innerText = val;
    chartContainer.appendChild(bar);
    bars.push(val);
    barElements.push(bar);
    if (bars.length >= 3) actionGroup.classList.add('show');
}

// --- 2. The Generators (Bubble, Selection, Insertion, Quick) ---

function* bubbleSortGenerator() {
    let n = bars.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            updateStyles(j, j + 1, 'comparing');
            updateStats(true, false);
            yield;
            if (bars[j] > bars[j + 1]) {
                [bars[j], bars[j + 1]] = [bars[j + 1], bars[j]];
                updateStyles(j, j + 1, 'swapping');
                swapVisuals(j, j + 1);
                updateStats(false, true);
                yield;
            }
            resetStyles(j, j + 1);
        }
        barElements[n - i - 1].classList.add('sorted');
    }
}

function* selectionSortGenerator() {
    let n = bars.length;
    for (let i = 0; i < n; i++) {
        let minIdx = i;
        updateStyles(minIdx, minIdx, 'comparing');
        for (let j = i + 1; j < n; j++) {
            updateStyles(j, j, 'comparing');
            updateStats(true, false);
            yield;
            if (bars[j] < bars[minIdx]) {
                resetStyles(minIdx, minIdx);
                minIdx = j;
                updateStyles(minIdx, minIdx, 'swapping');
                yield;
            } else {
                resetStyles(j, j);
            }
        }
        if (minIdx !== i) {
            [bars[i], bars[minIdx]] = [bars[minIdx], bars[i]];
            swapVisuals(i, minIdx);
            updateStats(false, true);
            yield;
        }
        resetStyles(i, minIdx);
        barElements[i].classList.add('sorted');
    }
}

function* insertionSortGenerator() {
    let n = bars.length;
    barElements[0].classList.add('sorted');
    for (let i = 1; i < n; i++) {
        let key = bars[i];
        let j = i - 1;
        updateStyles(i, i, 'swapping');
        yield;
        while (j >= 0 && bars[j] > key) {
            updateStyles(j, j + 1, 'comparing');
            updateStats(true, false);
            yield;
            bars[j + 1] = bars[j];
            swapVisuals(j, j + 1);
            updateStats(false, true);
            resetStyles(j, j + 1);
            j = j - 1;
            yield;
        }
        bars[j + 1] = key;
        for(let k = 0; k <= i; k++) barElements[k].classList.add('sorted');
    }
}

// Quick Sort (Recursive Generator)
function* quickSortGenerator(low, high) {
    if (low < high) {
        let pivotIdx;
        const partitionGen = partition(low, high);
        let result = partitionGen.next();
        while (!result.done) {
            yield result.value;
            result = partitionGen.next();
        }
        pivotIdx = result.value;

        yield* quickSortGenerator(low, pivotIdx - 1);
        yield* quickSortGenerator(pivotIdx + 1, high);
    } else if (low >= 0 && low < bars.length) {
        barElements[low].classList.add('sorted');
    }
}

function* partition(low, high) {
    let pivot = bars[high];
    barElements[high].style.backgroundColor = "#9c27b0"; // Pivot Color
    let i = low - 1;

    for (let j = low; j < high; j++) {
        updateStyles(j, high, 'comparing');
        updateStats(true, false);
        yield;
        if (bars[j] < pivot) {
            i++;
            [bars[i], bars[j]] = [bars[j], bars[i]];
            swapVisuals(i, j);
            updateStats(false, true);
            updateStyles(i, j, 'swapping');
            yield;
        }
        resetStyles(j, high);
        if (i >= 0) resetStyles(i, i);
    }
    [bars[i + 1], bars[high]] = [bars[high], bars[i + 1]];
    swapVisuals(i + 1, high);
    updateStats(false, true);
    barElements[high].style.backgroundColor = ""; 
    barElements[i + 1].classList.add('sorted');
    return i + 1;
}


// --- Celebration Function ---
function celebrate() {
    // 1. Mark all bars as sorted just in case
    barElements.forEach(bar => bar.classList.add('sorted'));

    // 2. Fire confetti!
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4CAF50', '#2e7d32', '#ffffff'] // Matching your green theme
    });
}
// --- 3. Controls ---

document.getElementById('stepBtn').addEventListener('click', () => {
    if (isSorting) return;
    if (!sortingGenerator) initGenerator();
    const result = sortingGenerator.next();
    if (result.done) {
        celebrate();
        sortingGenerator = null;
    }
});

document.getElementById('playBtn').addEventListener('click', async () => {
    if (isSorting) return;
    isSorting = true;
    isCancelled = false;
    toggleAllControls(true);
    cancelBtn.style.display = "inline-block";
    
    if (!sortingGenerator) initGenerator();

    let result = sortingGenerator.next();
    while (!result.done && !isCancelled) {
        // Speed calculation: Right is faster
        const currentSpeed = 1050 - parseInt(speedRange.value);
        await sleep(currentSpeed);
        result = sortingGenerator.next();
    }

    if (isCancelled) {
        clearActiveColors();
    } else if (result.done) {
        celebrate();
        sortingGenerator = null; 
    }

    isSorting = false;
    cancelBtn.style.display = "none";
    toggleAllControls(false);
});

cancelBtn.addEventListener('click', () => {
    isCancelled = true;
});

function initGenerator() {
    const algo = algoSelect.value;
    comparisons = 0;
    swaps = 0;
    updateStats(false, false);
    if (algo === 'bubble') sortingGenerator = bubbleSortGenerator();
    if (algo === 'selection') sortingGenerator = selectionSortGenerator();
    if (algo === 'insertion') sortingGenerator = insertionSortGenerator();
    if (algo === 'quick') sortingGenerator = quickSortGenerator(0, bars.length - 1);
}

// --- 4. Helpers ---

function updateStats(isComp, isSwap) {
    if (isComp) comparisons++;
    if (isSwap) swaps++;
    document.getElementById('compCount').innerText = comparisons;
    document.getElementById('swapCount').innerText = swaps;
}

function updateStyles(idx1, idx2, status) {
    if (barElements[idx1]) barElements[idx1].classList.add(status);
    if (barElements[idx2]) barElements[idx2].classList.add(status);
}

function resetStyles(idx1, idx2) {
    if (barElements[idx1]) barElements[idx1].classList.remove('comparing', 'swapping');
    if (barElements[idx2]) barElements[idx2].classList.remove('comparing', 'swapping');
}

function swapVisuals(idx1, idx2) {
    const tempHeight = barElements[idx1].style.height;
    const tempText = barElements[idx1].innerText;
    barElements[idx1].style.height = barElements[idx2].style.height;
    barElements[idx1].innerText = barElements[idx2].innerText;
    barElements[idx2].style.height = tempHeight;
    barElements[idx2].innerText = tempText;
}

function toggleAllControls(disabled) {
    const btns = document.querySelectorAll('button:not(#cancelBtn)');
    const inputs = document.querySelectorAll('input, select');
    btns.forEach(btn => btn.disabled = disabled);
    inputs.forEach(input => input.disabled = disabled);
}

function clearActiveColors() {
    barElements.forEach(bar => {
        bar.classList.remove('comparing', 'swapping');
        if (bar.style.backgroundColor === "rgb(156, 39, 176)") bar.style.backgroundColor = "";
    });
}

function resetAll() {
    bars = [];
    barElements = [];
    chartContainer.innerHTML = '';
    sortingGenerator = null;
    isSorting = false;
    isCancelled = false;
    comparisons = 0;
    swaps = 0;
    updateStats(false, false);
    actionGroup.classList.remove('show');
}

algoSelect.addEventListener('change', () => {
    sortingGenerator = null;
    barElements.forEach(bar => {
        bar.className = 'bar';
        bar.style.backgroundColor = "";
    });
});

document.getElementById('resetBtn').addEventListener('click', resetAll);
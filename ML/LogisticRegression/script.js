const canvas = document.getElementById('plotCanvas');
const ctx = canvas.getContext('2d');
const trainBtn = document.getElementById('trainBtn');
const addRandomBtn = document.getElementById('addRandomBtn');
const resetBtn = document.getElementById('resetBtn');
const lrInput = document.getElementById('lrInput');
const epochsInput = document.getElementById('epochsInput');
const speedSlider = document.getElementById('speedSlider');
const epochCount = document.getElementById('epochCount');
const lossVal = document.getElementById('lossVal');
const timeVal = document.getElementById('timeVal');

let points = [];
// Stabilized Initial weights: ensures the line starts visible and horizontal on-screen
let w1 = 0.01;
let w2 = -1.0;
let bias = 0.5;
let isPlaying = false;

// Sigmoid Activation Function
function sigmoid(z) {
    return 1 / (1 + Math.exp(-z));
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Clean Grid Lines
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 50; i < canvas.width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // 2. Draw Smooth Decision Boundary Line (w1*x_norm + w2*y_norm + bias = 0)
    // Upgraded calculation: protects against dividing by zero (vertical line errors)
    ctx.beginPath();
    let x1, y1, x2, y2;

    if (Math.abs(w2) > Math.abs(w1)) {
        // Line is closer to horizontal: calculate Y based on X edges
        x1 = 0;
        y1 = ((-w1 * (x1 / canvas.width) - bias) / w2) * canvas.height;
        x2 = canvas.width;
        y2 = ((-w1 * (x2 / canvas.width) - bias) / w2) * canvas.height;
    } else {
        // Line is closer to vertical: calculate X based on Y edges to prevent infinite jumps
        y1 = 0;
        x1 = ((-w2 * (y1 / canvas.height) - bias) / w1) * canvas.width;
        y2 = canvas.height;
        x2 = ((-w2 * (y2 / canvas.height) - bias) / w1) * canvas.width;
    }

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#5c6bc0'; // Sleek purple line
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // 3. Draw Elements (Class 0 = Red, Class 1 = Green)
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        if (p.label === 1) {
            ctx.fillStyle = '#4caf50';
            ctx.strokeStyle = '#2e7d32';
        } else {
            ctx.fillStyle = '#e57373';
            ctx.strokeStyle = '#c62828';
        }
        ctx.fill();
        ctx.stroke();
    });
}

function toggleControls(disable) {
    trainBtn.disabled = disable;
    addRandomBtn.disabled = disable;
    lrInput.disabled = disable;
    epochsInput.disabled = disable;
    speedSlider.disabled = disable;
    document.querySelectorAll('input[name="classType"]').forEach(r => r.disabled = disable);
}

canvas.addEventListener('click', (event) => {
    if (isPlaying) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const selectedLabel = parseInt(document.querySelector('input[name="classType"]:checked').value);
    
    points.push({ x, y, label: selectedLabel });
    draw();
});

addRandomBtn.addEventListener('click', () => {
    if (isPlaying) return;
    
    // Cluster 0 (Red) - Top Left
    for (let i = 0; i < 6; i++) {
        points.push({
            x: Math.random() * 200 + 60,
            y: Math.random() * 150 + 40,
            label: 0
        });
    }

    // Cluster 1 (Green) - Bottom Right
    for (let i = 0; i < 6; i++) {
        points.push({
            x: Math.random() * 200 + 340,
            y: Math.random() * 150 + 210,
            label: 1
        });
    }
    draw();
});

resetBtn.addEventListener('click', () => {
    points = [];
    w1 = 0.01;
    w2 = -1.0;
    bias = 0.5;
    epochCount.innerText = "0";
    lossVal.innerText = "0.0000";
    timeVal.innerText = "0.00s";
    isPlaying = false;
    toggleControls(false);
    draw();
});

trainBtn.addEventListener('click', async () => {
    const hasClass0 = points.some(p => p.label === 0);
    const hasClass1 = points.some(p => p.label === 1);

    if (!hasClass0 || !hasClass1) {
        alert("Please add at least one Class 0 (Red) and one Class 1 (Green) point!");
        return;
    }

    // --- RESET WEIGHTS HERE SO THE SIMULATION STARTS OVER WITH THE SAME POINTS ---
    w1 = 0.01;
    w2 = -1.0;
    bias = 0.5;
    // ----------------------------------------------------------------------------

    isPlaying = true;
    toggleControls(true);

    const learningRate = parseFloat(lrInput.value);
    const epochs = parseInt(epochsInput.value);
    const startTime = performance.now();

    for (let epoch = 1; epoch <= epochs; epoch++) {
        if (!isPlaying) break;

        let totalLoss = 0;
        let gradW1 = 0;
        let gradW2 = 0;
        let gradBias = 0;

        for (let p of points) {
            const x_norm = p.x / canvas.width;
            const y_norm = p.y / canvas.height;

            const z = w1 * x_norm + w2 * y_norm + bias;
            const prediction = sigmoid(z);

            // Compute Binary Cross-Entropy Loss
            const predClipped = Math.max(1e-15, Math.min(1 - 1e-15, prediction));
            totalLoss += -(p.label * Math.log(predClipped) + (1 - p.label) * Math.log(1 - predClipped));

            // Accumulate Gradients
            const error = prediction - p.label;
            gradW1 += error * x_norm;
            gradW2 += error * y_norm;
            gradBias += error;
        }

        totalLoss /= points.length;
        gradW1 /= points.length;
        gradW2 /= points.length;
        gradBias /= points.length;

        // Apply gradient descent changes
        w1 -= learningRate * gradW1;
        w2 -= learningRate * gradW2;
        bias -= learningRate * gradBias;

        // UI Updates
        epochCount.innerText = epoch;
        lossVal.innerText = totalLoss.toFixed(4);
        
        let timeElapsed = (performance.now() - startTime) / 1000;
        timeVal.innerText = timeElapsed.toFixed(2) + "s";

        draw();

        const delay = parseInt(speedSlider.value);
        await new Promise(r => setTimeout(r, delay));
    }

    isPlaying = false;
    toggleControls(false);
});
// Run Initial View
draw();
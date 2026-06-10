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
let m = 0.2; // Initial visible slope
let b = 0.3; // Initial visible intercept
let isPlaying = false; 

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;
    for (let i = 50; i < canvas.width; i += 50) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    // Draw Points
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#4caf50';
        ctx.fill();
        ctx.strokeStyle = '#2e7d32';
        ctx.stroke();
    });

    // Draw Optimal Line
    ctx.beginPath();
    const x1 = 0;
    const y1_norm = m * (x1 / canvas.width) + b;
    const y1 = y1_norm * canvas.height;

    const x2 = canvas.width;
    const y2_norm = m * (x2 / canvas.width) + b;
    const y2 = y2_norm * canvas.height;

    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#e57373';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Disable/Enable control elements during processing
function toggleControls(disable) {
    trainBtn.disabled = disable;
    addRandomBtn.disabled = disable;
    lrInput.disabled = disable;
    epochsInput.disabled = disable;
    speedSlider.disabled = disable;
}

// Add point on canvas click
canvas.addEventListener('click', (event) => {
    if (isPlaying) return; // Prevent adding points while learning is running
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    points.push({ x, y });
    draw();
});

// Generate Random Data points
addRandomBtn.addEventListener('click', () => {
    for (let i = 0; i < 8; i++) {
        points.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50
        });
    }
    draw();
});

// Clear canvas and states
resetBtn.addEventListener('click', () => {
    points = [];
    m = 0.2;
    b = 0.3;
    epochCount.innerText = "0";
    lossVal.innerText = "0.000";
    timeVal.innerText = "0.00s";
    isPlaying = false;
    toggleControls(false);
    trainBtn.disabled = false;
    draw();
});
// Run Machine Learning Algorithm (Gradient Descent)
trainBtn.addEventListener('click', async () => {
    if (points.length < 2) {
        alert("Plot at least 2 points to draw a line of best fit!");
        return;
    }
    
    // --- RESET WEIGHTS HERE SO THE SIMULATION STARTS OVER WITH THE SAME POINTS ---
    m = 0.2; // Reset to initial visible slope
    b = 0.3; // Reset to initial visible intercept
    // ----------------------------------------------------------------------------

    isPlaying = true;
    toggleControls(true);
    
    const learningRate = parseFloat(lrInput.value);
    const epochs = parseInt(epochsInput.value);
    
    const startTime = performance.now();

    for (let epoch = 1; epoch <= epochs; epoch++) {
        if (!isPlaying) break;

        // Calculate Loss Function (Mean Squared Error)
        let totalLoss = 0;
        for (let p of points) {
            const x_norm = p.x / canvas.width;
            const y_norm = p.y / canvas.height;
            let prediction = m * x_norm + b;
            totalLoss += (y_norm - prediction) ** 2;
        }
        totalLoss /= points.length;

        // Compute Gradients
        let gradM = 0;
        let gradB = 0;
        for (let p of points) {
            const x_norm = p.x / canvas.width;
            const y_norm = p.y / canvas.height;
            let prediction = m * x_norm + b;
            let error = y_norm - prediction;
            
            gradM += -2 * x_norm * error;
            gradB += -2 * error;
        }
        gradM /= points.length;
        gradB /= points.length;

        // 3. Update Weights
        m -= learningRate * gradM;
        b -= learningRate * gradB;

        // 4. Update UI
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
// Initial Render
draw();
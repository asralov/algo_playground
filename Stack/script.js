import { Stack } from "./Stack.js";

const myStack = new Stack();
const visualStack = document.getElementById('visualStack');
const input = document.getElementById('stackInput');
let isAnimating = false; // Prevent rapid-fire pop issues

document.getElementById('pushButton').addEventListener('click', () => {
    const val = input.value;
    if (!val) return;

    myStack.push(val);

    const itemDiv = document.createElement('div');
    itemDiv.className = 'stack-item';
    itemDiv.innerText = val;
    visualStack.appendChild(itemDiv);

    input.value = '';
});

document.getElementById('popButton').addEventListener('click', () => {
    // 1. Check if we are already in the middle of a visual pop
    if (isAnimating) return; 

    const [success, poppedValue] = myStack.pop();
    
    if (success) {
        isAnimating = true; // Lock the button
        const lastItem = visualStack.lastElementChild;
        
        lastItem.classList.add('popAnim');
        
        setTimeout(() => {
            lastItem.remove();
            isAnimating = false; // Unlock after item is gone
        }, 300); // Matches the 0.3s in your CSS
    } else {
        alert("Stack is empty!");
    }
});
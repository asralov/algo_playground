import { Stack } from "./Stack.js";

const myStack = new Stack();
const visualStack = document.getElementById("visualStack");
const input = document.getElementById("stackInput");
let isAnimating = false; // prevent rapid-fire pop issues

document.getElementById("pushButton").addEventListener("click", () => {
  const val = input.value;
  if (!val) return;

  myStack.push(val);

  const itemDiv = document.createElement("div");
  itemDiv.className = "stack-item";
  itemDiv.innerText = val;
  visualStack.appendChild(itemDiv);

  input.value = "";
});

document.getElementById("popButton").addEventListener("click", () => {
  // check if we are already in the middle of a visual pop
  if (isAnimating) return;

  const [success, poppedValue] = myStack.pop();

  if (success) {
    isAnimating = true; // lock the button
    const lastItem = visualStack.lastElementChild;

    lastItem.classList.add("popAnim");

    setTimeout(() => {
      lastItem.remove();
      isAnimating = false; // unlock after item is gone
    }, 300); // matches the 0.3s
  } else {
    alert("Stack is empty!");
  }
});

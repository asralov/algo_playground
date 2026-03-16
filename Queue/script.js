import { Queue } from "./Queue.js";

const myQueue = new Queue();
const visualQueue = document.getElementById("visualQueue");
const input = document.getElementById("queueInput");
let isAnimating = false;

document.getElementById("enqueueButton").addEventListener("click", () => {
  const val = input.value;
  if (!val) return;

  myQueue.enqueue(val);

  const itemDiv = document.createElement("div");
  itemDiv.className = "queue-item";
  itemDiv.innerText = val;

  /* To make the logic work with flex-end:
       New people join the LEFT side of the line.
       In the DOM, this means we "prepend" them.
    */
  visualQueue.prepend(itemDiv);

  input.value = "";
  input.focus();
});

document.getElementById("dequeueButton").addEventListener("click", () => {
  if (isAnimating) return;

  const [success, dequeuedValue] = myQueue.dequeue();

  if (success) {
    isAnimating = true;

    // the person at the register (front) is the last child in the DOM
    const frontItem = visualQueue.lastElementChild;

    frontItem.classList.add("dequeueAnim");

    setTimeout(() => {
      frontItem.remove();
      isAnimating = false;
    }, 400);
  } else {
    alert("The line is empty!");
  }
});

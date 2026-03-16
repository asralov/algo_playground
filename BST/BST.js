class Node {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BST {
  constructor() {
    this.root = null;
  }

  // we will handle the actual "step-by-step" animation in the script.js
  // to keep the UI logic separate from the data logic.
}

export { BST, Node };

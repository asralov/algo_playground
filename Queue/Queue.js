/**
 * @author Abrorjon Asralov
 * @file Queue.js
 * A linear data structure called Queue. In real world, the line in the
 * shop is a good analogy. First person comes, and he gets processed first.
 * It has all operations enqueue, dequeue, and isEmpty.
 */

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(item) {
    this.items.push(item);
  }

  dequeue() {
    if (this.isEmpty()) return [false, null];
    return [true, this.items.shift()]; // shift() removes the first element
  }

  isEmpty() {
    return this.items.length === 0;
  }
}

export { Queue };

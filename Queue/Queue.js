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
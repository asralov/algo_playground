
class Stack {
    constructor() {
        this.stack = [];
    }

    push(item) {
        this.stack.push(item);
    }

    pop() {
        if (this.empty()) {
            return [false, null]
        }
        return [true, this.stack.pop()];
    }

    empty() {
        return this.stack.length === 0;
    }
}

export {Stack};
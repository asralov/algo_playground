/* Sparse, unbounded world: untouched cells are implicitly light. */
class AntSimulation {
  constructor(mode = 'square') { this.mode = mode; this.x = 0; this.y = 0; this.direction = 0; this.steps = 0; this.dark = new Set(); }
  step() {
    const key = `${this.x},${this.y}`;
    const dark = this.dark.has(key);
    const directions = this.mode === 'hex' ? [[1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1]] : [[0,-1],[1,0],[0,1],[-1,0]];
    this.direction = (this.direction + (dark ? -1 : 1) + directions.length) % directions.length;
    if (dark) this.dark.delete(key); else this.dark.add(key);
    this.x += directions[this.direction][0]; this.y += directions[this.direction][1]; this.steps++;
  }
}
if (typeof module !== 'undefined') module.exports = AntSimulation;

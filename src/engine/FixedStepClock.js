/** Simulation uses legacy pixel/tick constants at a fixed 60 Hz, never display Hz. */
export class FixedStepClock {
  constructor(hz = 60) { this.step = 1 / hz; this.accumulator = 0; }
  reset() { this.accumulator = 0; }
  advance(dt, update) {
    this.accumulator += Math.max(0, Math.min(Number.isFinite(dt) ? dt : 0, 0.25));
    let ticks = 0;
    while (this.accumulator + 1e-10 >= this.step) {
      this.accumulator -= this.step;
      ticks++;
      if (update(this.step) === false) { this.reset(); break; }
    }
    return ticks;
  }
}

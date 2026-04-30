export class Prng {
  private state: number;

  constructor(seed?: number) {
    this.state = (seed ?? Date.now()) >>> 0;
  }

  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  nextInt(min: number, max: number): number {
    const span = max - min + 1;
    return min + Math.floor(this.next() * span);
  }

  pick<T>(values: T[]): T {
    if (values.length === 0) {
      throw new Error("Cannot pick from empty array");
    }

    return values[this.nextInt(0, values.length - 1)] as T;
  }
}

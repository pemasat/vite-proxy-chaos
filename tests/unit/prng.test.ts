import { describe, expect, it } from "vitest";
import { Prng } from "../../src/chaos/prng";

describe("Prng", () => {
  it("produces deterministic sequence for same seed", () => {
    const a = new Prng(123);
    const b = new Prng(123);

    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());

    expect(seqA).toEqual(seqB);
  });

  it("generates bounded integers", () => {
    const prng = new Prng(99);

    for (let i = 0; i < 100; i += 1) {
      const value = prng.nextInt(10, 20);
      expect(value).toBeGreaterThanOrEqual(10);
      expect(value).toBeLessThanOrEqual(20);
    }
  });
});

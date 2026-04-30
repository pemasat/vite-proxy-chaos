import { describe, expect, it } from "vitest";
import { normalizeOptions } from "../../src/config/normalize";

describe("normalizeOptions", () => {
  it("merges presets and custom codes", () => {
    const normalized = normalizeOptions({
      errors: {
        presets: ["throttling", "gateway"],
        customCodes: [501, 429],
      },
    });

    expect(normalized.errors.codes).toEqual([429, 502, 504, 501]);
  });

  it("rejects invalid probability", () => {
    expect(() => normalizeOptions({ delay: { probability: 1.5 } })).toThrow(
      "delay.probability must be between 0 and 1",
    );
  });

  it("rejects invalid delay range", () => {
    expect(() =>
      normalizeOptions({
        delay: {
          duration: {
            minMs: 100,
            maxMs: 50,
          },
        },
      }),
    ).toThrow(
      "delay.duration.minMs cannot be greater than delay.duration.maxMs",
    );
  });
});

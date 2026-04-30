import { describe, expect, it } from "vitest";
import { createChaosEngine } from "../../src/chaos/engine";
import type { NormalizedChaosProxyOptions } from "../../src/types";

const baseOptions: NormalizedChaosProxyOptions = {
  include: ["/api/**"],
  exclude: [],
  seed: 7,
  debug: false,
  errors: {
    enabled: true,
    probability: 0,
    codes: [500],
    responseBody: {},
    responseHeaders: {},
  },
  delay: {
    enabled: true,
    probability: 0,
    duration: {
      minMs: 50,
      maxMs: 50,
    },
  },
};

describe("createChaosEngine", () => {
  it("returns none when both probabilities are zero", () => {
    const engine = createChaosEngine(baseOptions);
    expect(engine.decide().type).toBe("none");
  });

  it("returns error when error probability is one", () => {
    const engine = createChaosEngine({
      ...baseOptions,
      errors: {
        ...baseOptions.errors,
        probability: 1,
      },
    });

    const decision = engine.decide();
    expect(decision.type).toBe("error");
    expect(decision.statusCode).toBe(500);
  });

  it("returns delay when delay probability is one and error disabled", () => {
    const engine = createChaosEngine({
      ...baseOptions,
      errors: {
        ...baseOptions.errors,
        enabled: false,
      },
      delay: {
        ...baseOptions.delay,
        probability: 1,
      },
    });

    const decision = engine.decide();
    expect(decision.type).toBe("delay");
    expect(decision.delayMs).toBe(50);
  });
});

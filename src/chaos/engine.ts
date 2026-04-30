import type { NormalizedChaosProxyOptions } from "../types";
import { Prng } from "./prng";

export interface ChaosDecision {
  type: "none" | "error" | "delay";
  statusCode?: number;
  delayMs?: number;
}

export function createChaosEngine(options: NormalizedChaosProxyOptions): {
  decide: () => ChaosDecision;
} {
  const prng = new Prng(options.seed);

  return {
    decide: (): ChaosDecision => {
      const errorRoll = prng.next();
      if (options.errors.enabled && errorRoll < options.errors.probability) {
        return {
          type: "error",
          statusCode: prng.pick(options.errors.codes),
        };
      }

      const delayRoll = prng.next();
      if (options.delay.enabled && delayRoll < options.delay.probability) {
        return {
          type: "delay",
          delayMs: prng.nextInt(
            options.delay.duration.minMs,
            options.delay.duration.maxMs,
          ),
        };
      }

      return { type: "none" };
    },
  };
}

import type { ErrorPreset, NormalizedChaosProxyOptions } from "../types";

const PRESET_CODES: Record<ErrorPreset, number[]> = {
  serverErrors: [500, 503],
  throttling: [429],
  gateway: [502, 504],
};

export const DEFAULT_INCLUDE: Array<string | RegExp> = ["/api/**"];

export const DEFAULT_EXCLUDE: Array<string | RegExp> = [
  "/@vite/**",
  "/@id/**",
  "/__vite_ping",
  "/node_modules/**",
];

export const DEFAULT_OPTIONS: Omit<NormalizedChaosProxyOptions, "seed"> = {
  include: DEFAULT_INCLUDE,
  exclude: DEFAULT_EXCLUDE,
  debug: false,
  errors: {
    enabled: true,
    probability: 0.1,
    codes: [...PRESET_CODES.serverErrors],
    responseBody: { error: "chaos error" },
    responseHeaders: {
      "content-type": "application/json",
    },
  },
  delay: {
    enabled: true,
    probability: 0.15,
    duration: {
      minMs: 150,
      maxMs: 900,
    },
  },
};

export function resolvePresetCodes(presets: ErrorPreset[]): number[] {
  return presets.flatMap((preset) => PRESET_CODES[preset]);
}

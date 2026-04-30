import { DEFAULT_OPTIONS, resolvePresetCodes } from "./defaults";
import type {
  ChaosProxyOptions,
  ErrorPreset,
  NormalizedChaosProxyOptions,
} from "../types";

function assertProbability(value: number, field: string): void {
  if (value < 0 || value > 1) {
    throw new Error(`${field} must be between 0 and 1`);
  }
}

function assertStatusCode(code: number): void {
  if (!Number.isInteger(code) || code < 400 || code > 599) {
    throw new Error(`Invalid HTTP error code: ${code}`);
  }
}

export function normalizeOptions(
  options: ChaosProxyOptions = {},
): NormalizedChaosProxyOptions {
  const presets: ErrorPreset[] = [...(options.errors?.presets ?? [])];
  const presetCodes = resolvePresetCodes(presets);
  const customCodes = [...(options.errors?.customCodes ?? [])];
  const codes = Array.from(new Set([...presetCodes, ...customCodes]));

  const normalized: NormalizedChaosProxyOptions = {
    include: [...(options.include ?? DEFAULT_OPTIONS.include)],
    exclude: [...DEFAULT_OPTIONS.exclude, ...(options.exclude ?? [])],
    seed: options.seed,
    debug: options.debug ?? DEFAULT_OPTIONS.debug,
    errors: {
      enabled: options.errors?.enabled ?? DEFAULT_OPTIONS.errors.enabled,
      probability:
        options.errors?.probability ?? DEFAULT_OPTIONS.errors.probability,
      codes: codes.length > 0 ? codes : DEFAULT_OPTIONS.errors.codes,
      responseBody:
        options.errors?.responseBody ?? DEFAULT_OPTIONS.errors.responseBody,
      responseHeaders: {
        ...DEFAULT_OPTIONS.errors.responseHeaders,
        ...(options.errors?.responseHeaders ?? {}),
      },
    },
    delay: {
      enabled: options.delay?.enabled ?? DEFAULT_OPTIONS.delay.enabled,
      probability:
        options.delay?.probability ?? DEFAULT_OPTIONS.delay.probability,
      duration: {
        minMs:
          options.delay?.duration?.minMs ??
          DEFAULT_OPTIONS.delay.duration.minMs,
        maxMs:
          options.delay?.duration?.maxMs ??
          DEFAULT_OPTIONS.delay.duration.maxMs,
      },
    },
  };

  assertProbability(normalized.errors.probability, "errors.probability");
  assertProbability(normalized.delay.probability, "delay.probability");

  if (
    normalized.delay.duration.minMs < 0 ||
    normalized.delay.duration.maxMs < 0
  ) {
    throw new Error("delay.duration values must be >= 0");
  }

  if (normalized.delay.duration.minMs > normalized.delay.duration.maxMs) {
    throw new Error(
      "delay.duration.minMs cannot be greater than delay.duration.maxMs",
    );
  }

  normalized.errors.codes.forEach(assertStatusCode);

  return normalized;
}

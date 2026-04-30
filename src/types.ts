export type ErrorPreset = "serverErrors" | "throttling" | "gateway";

export type UrlPattern = string | RegExp;

export interface DelayRange {
  minMs: number;
  maxMs: number;
}

export interface ErrorChaosConfig {
  enabled?: boolean;
  probability?: number;
  presets?: readonly ErrorPreset[];
  customCodes?: readonly number[];
  responseBody?: unknown;
  responseHeaders?: Record<string, string>;
}

export interface DelayChaosConfig {
  enabled?: boolean;
  probability?: number;
  duration?: DelayRange;
}

export interface ChaosProxyOptions {
  include?: readonly UrlPattern[];
  exclude?: readonly UrlPattern[];
  seed?: number;
  debug?: boolean;
  errors?: ErrorChaosConfig;
  delay?: DelayChaosConfig;
}

export interface NormalizedChaosProxyOptions {
  include: UrlPattern[];
  exclude: UrlPattern[];
  seed?: number;
  debug: boolean;
  errors: {
    enabled: boolean;
    probability: number;
    codes: number[];
    responseBody: unknown;
    responseHeaders: Record<string, string>;
  };
  delay: {
    enabled: boolean;
    probability: number;
    duration: DelayRange;
  };
}

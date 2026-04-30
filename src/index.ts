import type { Plugin } from "vite";
import { normalizeOptions } from "./config/normalize";
import { createProxyChaosMiddleware } from "./server/proxyHooks";
import type { ChaosProxyOptions } from "./types";

export default function chaosProxy(options: ChaosProxyOptions = {}): Plugin {
  const normalized = normalizeOptions(options);

  return {
    name: "vite-plugin-chaos-proxy",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(createProxyChaosMiddleware(server, normalized));
    },
  };
}

export type { ChaosProxyOptions, ErrorPreset, UrlPattern } from "./types";

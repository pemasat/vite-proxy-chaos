import type { Connect, ViteDevServer } from "vite";
import { createChaosEngine } from "../chaos/engine";
import { matchesUrlRules } from "../match/urlMatcher";
import { isPathProxied } from "../match/proxyMatcher";
import { applyResponseDelay } from "./responseDelay";
import type { NormalizedChaosProxyOptions } from "../types";

export function createProxyChaosMiddleware(
  server: ViteDevServer,
  options: NormalizedChaosProxyOptions,
): Connect.NextHandleFunction {
  const engine = createChaosEngine(options);

  return (req, res, next) => {
    const requestUrl = req.url ?? "/";
    const pathname = new URL(requestUrl, "http://localhost").pathname;

    const proxyConfig = server.config.server.proxy ?? {};
    const proxyKeys = Object.keys(proxyConfig);

    if (!isPathProxied(pathname, proxyKeys)) {
      return next();
    }

    if (!matchesUrlRules(pathname, options.include, options.exclude)) {
      return next();
    }

    const decision = engine.decide();

    if (options.debug) {
      // Keep logs compact so they are usable during local development.
      server.config.logger.info(
        `[vite-plugin-chaos-proxy] ${pathname} => ${decision.type}${
          decision.type === "error" ? `:${decision.statusCode}` : ""
        }${decision.type === "delay" ? `:${decision.delayMs}ms` : ""}`,
      );
    }

    if (decision.type === "error") {
      res.statusCode = decision.statusCode ?? 500;
      for (const [header, value] of Object.entries(
        options.errors.responseHeaders,
      )) {
        res.setHeader(header, value);
      }
      res.end(JSON.stringify(options.errors.responseBody));
      return;
    }

    if (decision.type === "delay") {
      applyResponseDelay(res, decision.delayMs ?? 0);
    }

    next();
  };
}

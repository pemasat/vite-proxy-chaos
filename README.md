# vite-plugin-chaos-proxy

Vite development plugin that injects chaos only for proxied routes.

Features:

- Random error injection with preset groups and custom HTTP status codes
- Random response delay injection
- URL targeting using glob patterns and RegExp
- Seeded deterministic behavior for test reproducibility
- Designed for Vite dev server proxy workflows

## Install

```bash
npm install -D vite-plugin-chaos-proxy
```

Alternative registry install (GitHub Packages example):

```bash
npm install -D @your-scope/vite-plugin-chaos-proxy --registry=https://npm.pkg.github.com
```

## Usage

```ts
import { defineConfig } from "vite";
import chaosProxy from "vite-plugin-chaos-proxy";

export default defineConfig({
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    chaosProxy({
      include: ["/api/**", /^\/internal\/v\d+/],
      exclude: ["/api/health"],
      seed: 42,
      errors: {
        enabled: true,
        probability: 0.2,
        presets: ["serverErrors", "gateway"],
        customCodes: [429],
        responseBody: { error: "simulated chaos" },
      },
      delay: {
        enabled: true,
        probability: 0.15,
        duration: {
          minMs: 150,
          maxMs: 1000,
        },
      },
    }),
  ],
});
```

## Error Presets

- serverErrors: 500, 503
- throttling: 429
- gateway: 502, 504

## Options

- include: URL patterns that can receive chaos. Default is /api/\*\*.
- exclude: URL patterns that never receive chaos. Vite internals are excluded by default.
- seed: deterministic random seed.
- debug: log chaos decisions to Vite logger.
- errors.enabled, errors.probability, errors.presets, errors.customCodes.
- delay.enabled, delay.probability, delay.duration.minMs, delay.duration.maxMs.

## Scripts

```bash
npm run typecheck
npm run test
npm run build
```

## Publish

1. Ensure npm token exists in CI as NPM_TOKEN.
2. Run tests and build.
3. Publish:

```bash
npm publish --access public
```

CI release workflow is included at .github/workflows/release.yml.

import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { createServer, type ViteDevServer } from "vite";
import chaosProxy from "../../src";

async function createFixtureRoot(): Promise<string> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "chaos-proxy-fixture-"));
  await fs.writeFile(
    path.join(root, "index.html"),
    "<html><body>fixture</body></html>",
    "utf8",
  );
  return root;
}

function startTargetServer(): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if ((req.url ?? "").startsWith("/api/health")) {
        res.statusCode = 200;
        res.end("healthy");
        return;
      }

      if ((req.url ?? "").startsWith("/api/")) {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: true, path: req.url }));
        return;
      }

      res.statusCode = 404;
      res.end("not-found");
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (typeof address === "object" && address && address.port) {
        resolve({ server, port: address.port });
      }
    });
  });
}

async function startViteWithPlugin(
  root: string,
  targetPort: number,
  pluginConfig: Parameters<typeof chaosProxy>[0],
) {
  const server = await createServer({
    root,
    configFile: false,
    plugins: [chaosProxy(pluginConfig)],
    server: {
      host: "127.0.0.1",
      port: 0,
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${targetPort}`,
          changeOrigin: true,
        },
      },
    },
  });

  await server.listen();
  return server;
}

function devOrigin(server: ViteDevServer): string {
  const addr = server.httpServer?.address();
  if (!addr || typeof addr === "string") {
    throw new Error("Could not resolve Vite server address");
  }

  return `http://127.0.0.1:${addr.port}`;
}

describe("proxy chaos integration", () => {
  const activeServers: Array<() => Promise<void>> = [];

  afterAll(async () => {
    for (const close of activeServers.reverse()) {
      await close();
    }
  });

  it("injects configured error only on proxied and matched route", async () => {
    const root = await createFixtureRoot();
    const target = await startTargetServer();
    activeServers.push(
      () =>
        new Promise((resolve, reject) =>
          target.server.close((err) => (err ? reject(err) : resolve())),
        ),
    );

    const vite = await startViteWithPlugin(root, target.port, {
      include: ["/api/**"],
      errors: {
        enabled: true,
        probability: 1,
        customCodes: [599],
      },
      delay: {
        enabled: false,
      },
      seed: 11,
    });
    activeServers.push(() => vite.close());

    const res = await fetch(`${devOrigin(vite)}/api/orders`);
    expect(res.status).toBe(599);
  });

  it("does not apply chaos on non-proxied route", async () => {
    const root = await createFixtureRoot();
    const target = await startTargetServer();
    activeServers.push(
      () =>
        new Promise((resolve, reject) =>
          target.server.close((err) => (err ? reject(err) : resolve())),
        ),
    );

    const vite = await startViteWithPlugin(root, target.port, {
      include: ["/**"],
      errors: {
        enabled: true,
        probability: 1,
        customCodes: [500],
      },
      delay: {
        enabled: false,
      },
    });
    activeServers.push(() => vite.close());

    const res = await fetch(`${devOrigin(vite)}/not-proxied`);
    expect(res.status).not.toBe(500);
  });

  it("applies response delay within configured bounds", async () => {
    const root = await createFixtureRoot();
    const target = await startTargetServer();
    activeServers.push(
      () =>
        new Promise((resolve, reject) =>
          target.server.close((err) => (err ? reject(err) : resolve())),
        ),
    );

    const vite = await startViteWithPlugin(root, target.port, {
      include: ["/api/**"],
      errors: {
        enabled: false,
      },
      delay: {
        enabled: true,
        probability: 1,
        duration: {
          minMs: 120,
          maxMs: 120,
        },
      },
      seed: 10,
    });
    activeServers.push(() => vite.close());

    const start = Date.now();
    const res = await fetch(`${devOrigin(vite)}/api/orders`);
    await res.text();
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(110);
  });

  it("is deterministic with the same seed", async () => {
    const rootA = await createFixtureRoot();
    const rootB = await createFixtureRoot();
    const target = await startTargetServer();
    activeServers.push(
      () =>
        new Promise((resolve, reject) =>
          target.server.close((err) => (err ? reject(err) : resolve())),
        ),
    );

    const config = {
      include: ["/api/**"],
      errors: {
        enabled: true,
        probability: 0.5,
        customCodes: [500, 503],
      },
      delay: {
        enabled: false,
      },
      seed: 1234,
    } as const;

    const viteA = await startViteWithPlugin(rootA, target.port, config);
    const viteB = await startViteWithPlugin(rootB, target.port, config);
    activeServers.push(() => viteA.close());
    activeServers.push(() => viteB.close());

    const statusesA: number[] = [];
    const statusesB: number[] = [];

    for (let i = 0; i < 6; i += 1) {
      const [a, b] = await Promise.all([
        fetch(`${devOrigin(viteA)}/api/orders?i=${i}`),
        fetch(`${devOrigin(viteB)}/api/orders?i=${i}`),
      ]);
      statusesA.push(a.status);
      statusesB.push(b.status);
    }

    expect(statusesA).toEqual(statusesB);
  });
});

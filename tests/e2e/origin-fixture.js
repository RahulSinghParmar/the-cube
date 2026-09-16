import { test as base, expect } from "@playwright/test";
import { createPreviewServer } from "../../scripts/preview-server.mjs";
import { randomInt } from "node:crypto";

// A real origin outage exercises CacheStorage on every engine. On Windows,
// WebKit's context.setOffline(true) produces an internal error on reload even
// when the same navigation succeeds with the server shut down.
export const test = base.extend({
  originServer: async ({}, use) => {
    const server = createPreviewServer();
    // Some Windows port-0 allocations land on browser-blocked ports (1719,
    // 1720, etc.). Pick a high unprivileged port; retry collisions and Windows
    // reserved-port ranges rather than weakening browser or OS protections.
    for (let attempt = 0; ; attempt++) {
      try {
        await new Promise((resolve, reject) => {
          const ready = () => {
            server.removeListener("error", failed);
            resolve();
          };
          const failed = (error) => {
            server.removeListener("listening", ready);
            reject(error);
          };
          server.once("error", failed);
          server.listen(randomInt(20000, 60000), "127.0.0.1", ready);
        });
        break;
      } catch (error) {
        if (!["EADDRINUSE", "EACCES"].includes(error.code) || attempt >= 19)
          throw error;
      }
    }
    const url = `http://127.0.0.1:${server.address().port}`;
    const stop = async () => {
      if (!server.listening) return;
      server.closeAllConnections();
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    };
    try {
      await use({ url, stop });
    } finally {
      await stop();
    }
  },
  baseURL: async ({ originServer }, use) => use(originServer.url),
  stopOrigin: async ({ originServer }, use) => use(originServer.stop),
});
export { expect };

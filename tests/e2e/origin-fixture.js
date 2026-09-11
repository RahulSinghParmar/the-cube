import { test as base, expect } from "@playwright/test";
import { createPreviewServer } from "../../scripts/preview-server.mjs";

// A real origin outage exercises CacheStorage on every engine. On Windows,
// WebKit's context.setOffline(true) produces an internal error on reload even
// when the same navigation succeeds with the server shut down.
export const test = base.extend({
  originServer: async ({}, use) => {
    const server = createPreviewServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
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

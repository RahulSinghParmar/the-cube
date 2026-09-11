import { createPreviewServer } from "./preview-server.mjs";

createPreviewServer().listen(4173, "127.0.0.1", () =>
  console.log("Preview: http://127.0.0.1:4173/the-cube/"),
);

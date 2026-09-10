import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const files = ['index.html', 'timer.html', 'manifest.json', 'service-worker.js'];
await mkdir('export', { recursive: true });
for (const file of files) await cp(file, `export/${file}`);
await cp('assets', 'export/assets', { recursive: true });
// A release fingerprint updates the worker whenever the offline shell changes.
const hash = createHash('sha256');
for (const file of [...files, 'assets/js/cube.js', 'assets/js/practice.js', 'assets/js/three.js', 'assets/css/styles.css', 'assets/css/keyboard.css', 'assets/css/practice.css']) {
  hash.update(await readFile(file));
}
const worker = await readFile('service-worker.js', 'utf8');
await writeFile('export/service-worker.js', worker.replace('__BUILD_VERSION__', hash.digest('hex').slice(0, 16)));
console.log('Built static site in export/');

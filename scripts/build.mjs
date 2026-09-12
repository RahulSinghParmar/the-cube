import { cp, mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const files = ['index.html', 'legacy.html', 'timer.html', 'manifest.json', 'service-worker.js'];
await mkdir('export', { recursive: true });
for (const file of files) await cp(file, `export/${file}`);
await cp('assets', 'export/assets', { recursive: true });
await cp('.web-build', 'export', { recursive: true });
await writeFile('export/menu.html', (await readFile('export/menu.html', 'utf8')).replace('</head>', '<link rel="manifest" href="./manifest.json"></head>'));
// A release fingerprint updates the worker whenever the offline shell changes.
const hash = createHash('sha256');
for (const file of [...files, 'assets/js/cube.js', 'assets/js/practice.js', 'assets/js/three.js', 'assets/css/app-theme.css', 'assets/css/app-font.css', 'assets/css/styles.css', 'assets/css/keyboard.css', 'assets/css/practice.css']) {
  hash.update(await readFile(file));
}
const worker = await readFile('service-worker.js', 'utf8');
const webFiles = (await readdir('.web-build/assets/web')).map(file => `./assets/web/${file}`);
hash.update(await readFile('export/menu.html'));
for (const file of webFiles) hash.update(await readFile(`export/${file}`));
await writeFile('export/service-worker.js', worker.replace('__BUILD_VERSION__', hash.digest('hex').slice(0, 16)).replace('/* WEB_ASSETS */', webFiles.map(file => JSON.stringify(file)).join(',') + ','));
console.log('Built static site in export/');

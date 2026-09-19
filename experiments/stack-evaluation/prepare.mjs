import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('static/assets', { recursive: true });
for (const file of ['css/app-theme.css', 'css/app-font.css', 'js/three.js'])
  await copyFile(`../../assets/${file}`, `static/assets/${file.split('/').at(-1)}`);

// One worker owns the offline application shell at either / or /the-cube/.
const PREFIX = `the-cube-${self.registration.scope}-`;
const CACHE = PREFIX + '__BUILD_VERSION__';
const SHELL = [
  './', './index.html', './legacy.html', './menu.html', './timer.html', './manifest.json',
  /* WEB_ASSETS */
  './assets/css/app-theme.css', './assets/css/app-font.css', './assets/css/styles.css', './assets/css/keyboard.css', './assets/css/practice.css',
  './assets/js/three.js', './assets/js/cube.js', './assets/js/practice.js',
  './assets/icons/android-chrome-192x192.png',
  './assets/icons/android-chrome-512x512.png',
  './assets/icons/favicon-32x32.png', './assets/icons/favicon-16x16.png',
  './assets/icons/apple-touch-icon.png', './assets/icons/favicon.ico',
];
const SHELL_URLS = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  // A new release must revalidate HTTP-cached HTML/assets before precaching.
  // Otherwise an old, still-fresh response can enter the new offline cache.
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    SHELL.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' }))
  )));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.href.startsWith(self.registration.scope)) return;
  const navigation = event.request.mode === 'navigate';
  if (!navigation && !SHELL_URLS.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    // Keep HTML and JS from the same release while the next worker installs.
    const page = ['./timer.html', './legacy.html', './menu.html'].find(path => url.pathname === new URL(path, self.registration.scope).pathname) || './index.html';
    const cached = await cache.match(navigation ? new URL(page, self.registration.scope).href : event.request);
    return cached || fetch(event.request);
  })());
});

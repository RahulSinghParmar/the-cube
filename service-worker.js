// One worker owns the offline application shell at either / or /the-cube/.
const PREFIX = `the-cube-${self.registration.scope}-`;
const CACHE = PREFIX + '__BUILD_VERSION__';
const SHELL = [
  './', './index.html', './timer.html', './manifest.json',
  './assets/css/styles.css', './assets/css/keyboard.css', './assets/css/practice.css',
  './assets/js/three.js', './assets/js/cube.js', './assets/js/practice.js',
  './assets/icons/android-chrome-192x192.png',
  './assets/icons/android-chrome-512x512.png',
  './assets/icons/favicon-32x32.png', './assets/icons/favicon-16x16.png',
  './assets/icons/apple-touch-icon.png', './assets/icons/favicon.ico',
];
const SHELL_URLS = new Set(SHELL.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
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
    const page = url.pathname === new URL('./timer.html', self.registration.scope).pathname ? './timer.html' : './index.html';
    const cached = await cache.match(navigation ? new URL(page, self.registration.scope).href : event.request);
    return cached || fetch(event.request);
  })());
});

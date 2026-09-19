import adapter from '@sveltejs/adapter-static';
export default {
  kit: {
    adapter: adapter(),
    paths: { base: '/the-cube/evaluation' },
    prerender: { crawl: false, entries: ['*'] },
    serviceWorker: { register: false }
  }
};

export default {
  base: '/the-cube/evaluation/react/',
  publicDir: false,
  build: { outDir: 'react-build', target: 'es2022', rollupOptions: { input: 'react/index.html' } }
};

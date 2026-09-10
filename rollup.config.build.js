import terser from '@rollup/plugin-terser';

export default [{
  input: './src/js/Game.js',
  plugins: [terser()],
  output: {
      format: 'iife',
      file: './assets/js/cube.js',
      indent: '\t',
      sourcemap: false,
  },
}, {
  input: './packages/practice/dist/app.js',
  plugins: [terser()],
  output: { format: 'es', file: './assets/js/practice.js', sourcemap: false },
}];

import terser from '@rollup/plugin-terser';

export default {
  input: './src/js/Game.js',
  plugins: [terser()],
  output: {
      format: 'iife',
      file: './assets/js/cube.js',
      indent: '\t',
      sourcemap: false,
  },
};

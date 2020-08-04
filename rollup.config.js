import { uglify } from "rollup-plugin-uglify";
import babel from '@rollup/plugin-babel';

export default {
  input: 'index.js',
  output: {
    file: 'dist/main.js',
    format: 'umd',
    name: 'duckAnimation',
  },
  plugins: [babel({
    babelHelpers: 'bundled',
    presets: ['@babel/preset-env']
  }), uglify()],
};
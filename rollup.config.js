import flow from 'rollup-plugin-flow';
import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
const pkg = require('./package.json');
let version = pkg.version;
const banner = `/* @OpenAyame/ayame-web-sdk@${version} */`;
const plugins = [
  resolve(),
  flow({ all: true }),
  babel({
    exclude: 'node_modules/**'
  })
]
module.exports = [
  {
    input: 'src/ayame.js',
    output: {
      banner: banner,
      name: 'Ayame',
      entry: 'src/',
      compact: true,
      file: 'dist/ayame.min.js',
      format: 'umd',
      sourceMap: true
    },
    plugins: [...plugins, terser()]
  },
  {
    input: 'src/ayame.js',
    output: {
      banner: banner,
      name: 'Ayame',
      entry: 'src/',
      file: 'dist/ayame.js',
      format: 'umd',
      sourceMap: true
    },
    plugins: plugins
  }
];

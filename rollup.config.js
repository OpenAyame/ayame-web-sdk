import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json'

let version = pkg.version;
const banner = `/* @OpenAyame/ayame-web-sdk@${version} */`;
const plugins = [
 	typescript({ tsconfig: './tsconfig.json' }),
  nodeResolve({ browser: true })
];
module.exports = [
  {
    input: 'src/ayame.ts',
    output: {
      banner: banner,
      name: 'Ayame',
      compact: true,
      file: 'dist/ayame.min.js',
      format: 'umd',
      sourcemap: true
    },
    plugins: [...plugins, terser()]
  },
  {
    input: 'src/ayame.ts',
    output: {
      banner: banner,
      name: 'Ayame',
      file: 'dist/ayame.js',
      format: 'umd',
      sourcemap: true
    },
    plugins: plugins
  },
  {
    input: 'src/ayame.ts',
    output: {
      banner: banner,
      name: 'Ayame',
      file: 'dist/ayame.mjs',
      format: 'module',
    },
    plugins: plugins,
  }
];

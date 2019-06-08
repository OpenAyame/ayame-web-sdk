/* @noflow */
/* global __dirname */
const webpack = require('webpack');
const path = require('path');
const pkg = require('./package.json');

let version = pkg.version;

const config = {
  context: path.resolve(__dirname, './src'),
  entry: {
    ayame: './ayame.js',
    'ayame.min': './ayame.js'
  },
  output: {
    library: 'Ayame',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js'
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.version': JSON.stringify(version)
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: [/node_modules/],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-flow'],
              plugins: ['@babel/transform-flow-strip-types']
            }
          }
        ]
      }
    ]
  }
};

module.exports = config;

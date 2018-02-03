const path = require('path')
const webpack = require('webpack')

const PKG = require('./package.json')
const HEADER = require('./header')

const ENTRY = path.resolve(PKG.main)

module.exports = {
  entry: ENTRY,
  output: {
    filename: 'exh-reader.user.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: new RegExp(ENTRY + '$'),
      use: [ 'webpack-rollup-loader' ]
    }, {
      test: /\.css$/,
      use: [ 'to-string-loader', 'css-loader' ]
    }, {
      test: /\.(png|jpg|gif)$/,
      use: [ 'url-loader' ]
    }]
  },
  plugins: [
    new webpack.BannerPlugin({ banner: HEADER, raw: true, entryOnly: true }),
    new webpack.IgnorePlugin(/^colors(\/safe)?/) // colors.js is used in node console only
  ]
}

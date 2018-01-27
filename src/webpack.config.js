const path = require('path')
const webpack = require('webpack')

const HEADER = require('./header')

module.exports = {
  entry: path.resolve('./src/index.js'),
  output: {
    filename: 'exh-reader.user.js',
    path: path.resolve(__dirname, 'dist')
  },
  plugins: [
    new webpack.BannerPlugin({ banner: HEADER, raw: true, entryOnly: true })
  ]
}

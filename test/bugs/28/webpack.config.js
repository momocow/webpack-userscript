const path = require('path')
const WebpackUserscript = require('../../..')

const DIST_DIR = path.resolve(__dirname, 'dist')

module.exports = {
  context: __dirname,
  mode: 'production',
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: DIST_DIR,
    filename: 'index.user.js'
  },
  devtool: 'source-map',
  plugins: [
    new WebpackUserscript({ metajs: false })
  ]
}

const path = require('path')
const WebpackUserscript = require('../../..')

module.exports = {
  mode: 'production',
  entry: {
    index1: path.join(__dirname, 'index1.js'),
    index2: path.join(__dirname, 'index2.js'),
    index3: path.join(__dirname, 'index3.js')
  },
  output: {
    path: path.resolve(__dirname, 'output'),
    filename: '[name].js'
  },
  plugins: [
    new WebpackUserscript()
  ]
}

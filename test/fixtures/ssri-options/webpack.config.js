const path = require('path')
const WebpackUserscript = require('../../../lib')

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, 'output'),
    filename: 'index.js'
  },
  plugins: [
    new WebpackUserscript({
      // see test/ssri.test.js
    })
  ]
}

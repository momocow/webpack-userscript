const path = require('path')
const WebpackTampermonkey = require('../../..')

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, 'output'),
    filename: 'index.js'
  },
  plugins: [
    new WebpackTampermonkey({
      headers: path.join(__dirname, 'headers.json'),
      pretty: false
    })
  ]
}

const path = require('path')
const WebpackUserscript = require('../../..')

module.exports = {
  mode: 'production',
  entry: {
    'teplate-strings': path.join(__dirname, 'index.js')
  },
  output: {
    path: path.resolve(__dirname, 'output'),
    filename: 'index.js'
  },
  plugins: [
    new WebpackUserscript({
      headers: {
        name: 'WPUS: [name]',
        version: '[version]-build.[hash]'
      }
    })
  ]
}

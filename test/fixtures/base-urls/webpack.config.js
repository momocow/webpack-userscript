const path = require('path')
const WebpackUserscript = require('../../..')

module.exports = {
  mode: 'production',
  entry: path.join(__dirname, 'index.js'),
  output: {
    path: path.resolve(__dirname, 'output'),
    filename: 'index.js'
  },
  plugins: [
    new WebpackUserscript({
      headers: {
        name: 'Base URLs Test',
        version: '2.0.0',
        match: 'https://google.com/*',
        grant: [
          'GM_setValue',
          'GM_getValue'
        ]
      },
      pretty: false,
      downloadBaseUrl: 'http://127.0.0.1:8080/download',
      updateBaseUrl: 'http://127.0.0.1:8080/update'
    })
  ]
}

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
      headers ({ name, version }) {
        return {
          name: name.split('/')[1],
          version: version + '.alpha',
          match: 'https://google.com/*',
          grant: [
            'GM_setValue',
            'GM_getValue'
          ]
        }
      },
      pretty: false
    })
  ]
}

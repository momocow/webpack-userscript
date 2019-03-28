const test = require('tape')
const path = require('path')
const ValidationError = require('schema-utils/src/ValidationError')

function getWebpackConfig (context) {
  return Object.assign(
    {},
    require(path.resolve(context, 'webpack.config.js')),
    { context }
  )
}

test('invalid-options', function (t) {
  const context = path.resolve(__dirname, '..', 'fixtures', 'invalid-options')
  t.throws(() => getWebpackConfig(context), ValidationError)
  t.end()
})

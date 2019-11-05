const test = require('tape')
const webpack = require('webpack')
const path = require('path')
const MemoryFileSystem = require('memory-fs')

const WebpackUserscript = require('../..')

test('template variables', function (t) {
  t.plan(2)

  const expectedVariables = [
    'name',
    'version',
    'description',
    'author',
    'homepage',
    'bugs',
    'hash',
    'chunkHash',
    'chunkName',
    'file',
    'query',
    'buildNo',
    'buildTime'
  ]

  const context = path.resolve(path.dirname(__dirname), 'fixtures', 'simple-config')
  const compiler = webpack({
    ...require(path.resolve(context, 'webpack.config.js')),
    context,
    plugins: [
      new WebpackUserscript({
        headers (namespace) {
          const variables = Object.keys(namespace)
          t.true(variables.every(variable => expectedVariables.includes(variable)))
          t.is(variables.length, expectedVariables.length)
        }
      })
    ]
  })
  compiler.outputFileSystem = new MemoryFileSystem()

  compiler.run((err, stats) => {
    if (err) {
      console.error(err.stack || err)
      if (err.details) {
        console.error(err.details)
      }

      t.end(err)
      return
    }

    const info = stats.toJson()

    if (stats.hasErrors()) {
      console.error(info.errors)
      t.end(new Error(`Fixture errors.`))
      return
    }

    if (stats.hasWarnings()) {
      console.warn(info.warnings)
    }

    t.end()
  })
})

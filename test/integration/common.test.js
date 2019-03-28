const test = require('tape')
const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const MemoryFileSystem = require('memory-fs')

function getWebpackConfig (context) {
  return Object.assign(
    {},
    require(path.resolve(context, 'webpack.config.js')),
    { context }
  )
}

const CONTEXT_LIST = [
  'simple-config',
  'explicit-config',
  'headers-json'
]

for (let CONTEXT_NAME of CONTEXT_LIST) {
  test(CONTEXT_NAME, function (t) {
    const context = path.resolve(__dirname, '..', 'fixtures', CONTEXT_NAME)
    const compiler = webpack(getWebpackConfig(context))
    const outputFS = compiler.outputFileSystem = new MemoryFileSystem()
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

      const output = outputFS.readFileSync(
        path.join(context, 'output', 'index.user.js'),
        'utf8'
      )
      const expectedOutput = fs.readFileSync(path.join(context, 'expected.user.js'), 'utf8')
      t.same(output, expectedOutput)

      const meta = outputFS.readFileSync(
        path.join(context, 'output', 'index.meta.js'),
        'utf8'
      )
      const expectedMeta = fs.readFileSync(path.join(context, 'expected.meta.js'), 'utf8')
      t.same(meta, expectedMeta)
      t.end()
    })
  })
}

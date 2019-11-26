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

test('proxy-script', function (t) {
  const context = path.resolve(__dirname, '..', 'fixtures', 'proxy-script')
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

    const proxy = outputFS.readFileSync(
      path.join(context, 'output', 'tm-no-cache.proxy.user.js'),
      'utf8'
    )
    const expectedProxy = fs.readFileSync(path.join(context, 'expected.proxy.user.js'), 'utf8')
    t.same(proxy, expectedProxy)
    t.end()
  })
})

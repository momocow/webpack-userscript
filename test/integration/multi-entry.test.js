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

test('multi-entry', function (t) {
  const context = path.resolve(__dirname, '..', 'fixtures', 'multi-entry')
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

    const output1 = outputFS.readFileSync(
      path.join(context, 'output', 'index1.user.js'),
      'utf8'
    )
    const output2 = outputFS.readFileSync(
      path.join(context, 'output', 'index2.user.js'),
      'utf8'
    )
    const output3 = outputFS.readFileSync(
      path.join(context, 'output', 'index3.user.js'),
      'utf8'
    )
    const expectedOutput1 = fs.readFileSync(path.join(context, 'expected1.user.js'), 'utf8')
    const expectedOutput2 = fs.readFileSync(path.join(context, 'expected2.user.js'), 'utf8')
    const expectedOutput3 = fs.readFileSync(path.join(context, 'expected3.user.js'), 'utf8')
    t.same(output1, expectedOutput1)
    t.same(output2, expectedOutput2)
    t.same(output3, expectedOutput3)

    const meta1 = outputFS.readFileSync(
      path.join(context, 'output', 'index1.meta.js'),
      'utf8'
    )
    const meta2 = outputFS.readFileSync(
      path.join(context, 'output', 'index2.meta.js'),
      'utf8'
    )
    const meta3 = outputFS.readFileSync(
      path.join(context, 'output', 'index3.meta.js'),
      'utf8'
    )
    const expectedMeta = fs.readFileSync(path.join(context, 'expected.meta.js'), 'utf8')
    t.same(meta1, expectedMeta)
    t.same(meta2, expectedMeta)
    t.same(meta3, expectedMeta)
    t.end()
  })
})

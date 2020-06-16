const test = require('tape')
const path = require('path')
const fs = require('fs')
const webpack = require('webpack')
const MemoryFileSystem = require('memory-fs')

const DIST_DIR = path.resolve(__dirname, 'dist')

test('#28 source map', function (t) {
  const compiler = webpack(require('./webpack.config'))
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

    t.same(outputFS.readdirSync(DIST_DIR), ['index.user.js', 'index.user.js.map'])

    const output = outputFS.readFileSync(path.join(DIST_DIR, 'index.user.js'), 'utf8')
    const expectedOutput = fs.readFileSync(path.join(__dirname, 'expected.user.js'), 'utf8')
    t.same(output, expectedOutput)

    const sourceMap = outputFS.readFileSync(path.join(DIST_DIR, 'index.user.js.map'), 'utf8')
    const expectedSourceMap = fs.readFileSync(path.join(__dirname, 'expected.user.js.map'), 'utf8')
    t.same(sourceMap, expectedSourceMap)

    t.end()
  })
})

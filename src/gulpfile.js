const clipboardy = require('clipboardy')
const fs = require('fs-extra')
const gulp = require('gulp')
const path = require('path')

const log = require('./lib/logging')

const cmd = require('./gulp-scripts/commands')
const webpack = require('./gulp-scripts/webpack')
const Version = require('./gulp-scripts/version')

function upgradePackage (tlevel, done) {
  done = typeof done === 'function' ? done : function () {}

  // tick package.json version
  log.info('Upgrading')
  const PKG = require('./package.json')
  PKG.version = new Version(PKG.version).tick(tlevel).toString()
  fs.writeJsonSync(path.join(__dirname, 'package.json'), PKG, { spaces: 2 })

  // webpacking
  log.info('Packaging')
  webpack.compile(function () {
    log.info('Git add')
    cmd.ga(function () {
      log.info('Git commit')
      cmd.gc(`v${PKG.version}`, done)
    })
  })
}

/**
 * Regular development
 */
gulp.task('watch', function () {
  webpack.watch(function () {
    log.info('Reading distributable')
    let outputPath = webpack.getOutputPath()
    fs.readFile(outputPath, { encoding: 'utf8' })
      .then(function (content) {
        log.info('Writing to clipboard')
        clipboardy.write(content).then(function () {
          log.info(`'${outputPath}' is loaded in the clipboard.`)
        })
      })
  })
})

/**
 * Packing and versioning
 */
gulp.task('major', function (done) {
  upgradePackage(Version.TICK_LEVEL.MAJOR, done)
})
gulp.task('minor', function (done) {
  upgradePackage(Version.TICK_LEVEL.MINOR, done)
})
gulp.task('patch', function (done) {
  upgradePackage(Version.TICK_LEVEL.PATCH, done)
})

gulp.task('default', [ 'watch' ])

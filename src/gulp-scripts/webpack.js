const webpack = require('webpack')
const path = require('path')

const log = require('../lib/logging')

let cacheConfig

function getConfigAndCache () {
  cacheConfig = require('../webpack.config')
  return cacheConfig
}

function logError (err, stats, onLogged) {
  if (err) {
    log.error(`${err.stack || err}`)
    if (err.details) {
      log.error(`${err.details}`)
    }
    return
  }

  console.log(stats.toString({ colors: true }))

  if (typeof onLogged === 'function') onLogged()
}

function compile (onComplied) {
  const WP_CONFIG = getConfigAndCache()
  webpack(WP_CONFIG, (err, stats) => {
    logError(err, stats, onComplied)
  })
}

function watch (watchConfig, onComplied) {
  if (typeof watchConfig === 'function') {
    onComplied = watchConfig
    watchConfig = {}
  }

  const WP_CONFIG = getConfigAndCache()
  watchConfig = Object.assign({ aggregateTimeout: 3000 }, watchConfig)
  webpack(WP_CONFIG).watch(watchConfig, (err, stats) => {
    logError(err, stats, onComplied)
  })
}

function getOutputPath () {
  return !cacheConfig || !cacheConfig.output || !cacheConfig.output.filename || !cacheConfig.output.path
    ? '' : path.resolve(cacheConfig.output.path, cacheConfig.output.filename)
}

module.exports = {
  watch, compile, getOutputPath
}

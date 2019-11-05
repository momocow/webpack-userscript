const fs = require('fs')
const path = require('path')
const validateOptions = require('schema-utils')
const { ConcatSource, RawSource } = require('webpack-sources')
const userscriptMeta = require('@tkausl/userscript-meta')

const loadHeaderFile = require('./loadHeaderFile')
const createHeaderProvider = require('./createHeaderProvider')
const interpolate = require('./interpolate')
const optionsSchema = require('./schemas/options.json')

const PLUGIN_NAME = 'WebpackUserscript'
/**
 * @type {WebpackUserscriptOptions}
 */
const DEFAULT_CONFIG = {
  pretty: true,
  metajs: true,
  renameExt: true
}
const fileDependencies = new Set()

module.exports = class WebpackUserscript {
  /**
   * @typedef WebpackUserscriptOptions
   * @property {object|string|((data: object) => object)} headers the header object
   * @property {boolean} metajs to generate *.meta.js
   * @property {boolean} pretty to prettify the header block
   * @property {boolean} renameExt to rename *.js files that are not *.user.js to become *.user.js
   * @property {object} hotDev Use \"@require\" keyword in the meta block to include the script
   *//**
   * @param {WebpackUserscriptOptions|string|((data: object) => object)} [options]
   */
  constructor (options = {}) {
    validateOptions(optionsSchema, options, PLUGIN_NAME)

    options.hotDev = Object.assign({
      baseUrl: 'http://localhost:8080/',
      filename: '[basename]-dev.user.js',
      enable: process.env.WEBPACK_DEV_SERVER === 'true'
    }, options.hotDev)
    options.hotDev.enable = typeof options.hotDev.enable === 'function'
      ? options.hotDev.enable() : options.hotDev.enable

    this.options = Object.assign(
      {},
      DEFAULT_CONFIG,
      typeof options === 'string'
        ? {
          headers: loadHeaderFile(options, fileDependencies)
        }
        : typeof options === 'function' ? {
          headers: options
        }
          : typeof options.headers === 'string' ? {
            ...options,
            headers: loadHeaderFile(options.headers, fileDependencies)
          } : options
    )

    this.buildNo = 0
  }

  apply (compiler) {
    const packageJsonFile = path.resolve(compiler.options.context, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'))
    const packageInfoObj = {
      name: packageJson.name || '',
      version: packageJson.version || '',
      description: packageJson.description || '',
      author: packageJson.author || '',
      homepage: packageJson.homepage || '',
      bugs: typeof packageJson.bugs === 'string' ? packageJson.bugs
        : typeof packageJson.bugs === 'object' &&
          typeof packageJson.bugs.url === 'string' ? packageJson.bugs.url
          : ''
    }
    const headerProvider = createHeaderProvider(packageInfoObj, this.options.headers)
    fileDependencies.add(packageJsonFile)

    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.afterOptimizeChunkAssets.tap(PLUGIN_NAME, chunks => {
        for (const chunk of chunks) {
          if (!chunk.canBeInitial()) { // non-entry
            continue
          }

          for (const file of chunk.files) {
            let query = ''
            const hash = compilation.hash
            const querySplit = file.indexOf('?')

            if (querySplit >= 0) {
              query = file.substr(querySplit)
            }

            const data = {
              hash,
              chunkHash: chunk.hash,
              chunkName: chunk.name,
              file,
              basename: file.endsWith('.user.js') ? path.basename(file, '.user.js')
                : path.basename(file, '.js'),
              query,
              buildNo: ++this.buildNo,
              buildTime: Date.now(),
              ...packageInfoObj
            }

            const headerObj = interpolate(headerProvider(data), data)
            const headerString = userscriptMeta.stringify(headerObj, this.options.pretty)

            const outputFile = this.options.renameExt && !file.endsWith('.user.js')
              ? file.replace(/\.js$/, '') + '.user.js'
              : file
            const fileSource = compilation.assets[file]

            if (outputFile !== file) {
              delete compilation.assets[file]
            }

            // prepend header
            compilation.assets[outputFile] = new ConcatSource(
              headerString,
              '\n',
              fileSource
            )

            let hotDevHeaderString = ''
            if (this.options.hotDev.enable) {
              const hotDevBaseUrl = interpolate(this.options.hotDev.baseUrl, data)
              const hotDevFilename = interpolate(this.options.hotDev.filename, data)
              hotDevHeaderString = userscriptMeta.stringify({
                ...headerObj,
                require: `${hotDevBaseUrl.replace(/\/$/, '')}/${outputFile}`
              }, this.options.pretty)
              compilation.assets[hotDevFilename] = new RawSource(hotDevHeaderString)
            }

            if (this.options.metajs) {
              const basename = file.endsWith('.user.js') ? path.basename(file, '.user.js')
                : file.endsWith('.js') ? path.basename(file, '.js')
                  : file
              const metaFile = basename + '.meta.js'
              compilation.assets[metaFile] = new RawSource(
                this.options.hotDev.enable ? hotDevHeaderString : headerString)
            }
          }
        }
      })
    })

    compiler.hooks.afterEmit.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      for (const fileDependency of fileDependencies) {
        // Add file dependencies if they're not already tracked
        if (!compilation.fileDependencies.has(fileDependency)) {
          compilation.fileDependencies.add(fileDependency)
        }
      }
      callback()
    })
  }
}

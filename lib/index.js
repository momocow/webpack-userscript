const fs = require('fs')
const path = require('path')
const validateOptions = require('schema-utils')
const { ConcatSource, RawSource } = require('webpack-sources')
const userscriptMeta = require('@tkausl/userscript-meta')

const loadHeaderFile = require('./loadHeaderFile')
const createHeaderProvider = require('./createHeaderProvider')
const optionsSchema = require('./schemas/options.json')

const PLUGIN_NAME = 'WebpackTampermonkey'
/**
 * @type {WebpackTampermonkeyOptions}
 */
const DEFAULT_CONFIG = {
  pretty: true,
  metajs: true,
  renameExt: true
}
const fileDependencies = new Set()

module.exports = class WebpackTampermonkey {
  /**
   * @typedef WebpackTampermonkeyOptions
   * @property {object} headers the header object
   * @property {boolean} metajs to generate *.meta.js
   * @property {boolean} pretty to prettify the header block
   * @property {boolean} renameExt to rename *.js files that are not *.user.js to become *.user.js
   *//**
   * @param {WebpackTampermonkeyOptions} [options]
   */
  constructor (options = {}) {
    validateOptions(optionsSchema, options, PLUGIN_NAME)

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
  }

  apply (compiler) {
    const packageJsonFile = path.resolve(compiler.options.context, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonFile, 'utf8'))
    const headerProvider = createHeaderProvider(packageJson, this.options.headers)
    fileDependencies.add(packageJsonFile)

    compiler.hooks.compilation.tap(PLUGIN_NAME, compilation => {
      compilation.hooks.afterOptimizeChunkAssets.tap(PLUGIN_NAME, chunks => {
        for (const chunk of chunks) {
          if (!chunk.canBeInitial()) { // non-entry
            continue
          }

          for (const file of chunk.files) {
            let basename
            let query = ''
            let filename = file
            const hash = compilation.hash
            const querySplit = filename.indexOf('?')

            if (querySplit >= 0) {
              query = filename.substr(querySplit)
              filename = filename.substr(0, querySplit)
            }

            const lastSlashIndex = filename.lastIndexOf('/')

            if (lastSlashIndex === -1) {
              basename = filename
            } else {
              basename = filename.substr(lastSlashIndex + 1)
            }

            const data = {
              hash,
              chunk,
              filename,
              basename,
              query
            }

            const headerString = compilation.getPath(
              userscriptMeta.stringify(
                headerProvider(data),
                this.options.pretty
              ),
              data
            )

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

            if (this.options.metajs) {
              const basename = file.endsWith('.user.js') ? path.basename(file, '.user.js')
                : file.endsWith('.js') ? path.basename(file, '.js')
                  : file
              const metaFile = basename + '.meta.js'
              compilation.assets[metaFile] = new RawSource(headerString)
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

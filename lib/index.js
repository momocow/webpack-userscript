const fs = require('fs')
const path = require('path')
const { URL } = require('url')
const validateOptions = require('schema-utils')
const { ConcatSource, RawSource } = require('webpack-sources')
const userscriptMeta = require('@tkausl/userscript-meta')
const _pick = require('lodash.pick')

const loadHeaderFile = require('./loadHeaderFile')
const createHeaderProvider = require('./createHeaderProvider')
const interpolate = require('./interpolate')
const optionsSchema = require('./schemas/options.json')
const { computeSSRI } = require('./ssri')

const PLUGIN_NAME = 'WebpackUserscript'
/**
 * @type {WebpackUserscriptOptions}
 */
const DEFAULT_CONFIG = {
  pretty: true,
  metajs: true,
  renameExt: true,
  downloadBaseUrl: '',
  updateBaseUrl: '',
  ssri: false
}
const DEFAULT_SSRI_CONFIG = {
  include: /.*/,
  single: false
}
const fileDependencies = new Set()

module.exports = class WebpackUserscript {
  /**
   * @typedef ProxyScriptOptions
   * @property {boolean|(()=>boolean)} enable
   * @property {string} filename The filename of the proxy script
   * @property {string} baseUrl The base URL of the dev server
   *//**
   * @typedef WebpackUserscriptOptions
   * @property {object|string|((data: object) => object)} headers the header object
   * @property {boolean} metajs to generate *.meta.js
   * @property {boolean} pretty to prettify the header block
   * @property {boolean} renameExt to rename *.js files that are not *.user.js to become *.user.js
   * @property {string} downloadBaseUrl base URL for download URL
   * @property {string} updateBaseUrl base URL for update URL
   * @property {boolean|object} ssri enable subresource integrity support
   * @property {ProxyScriptOptions} proxyScript Containing a \"@require\" header in the meta block to include the main script
   *//**
   * @param {WebpackUserscriptOptions|string|((data: object) => object)} [options]
   */
  constructor (options = {}) {
    validateOptions(optionsSchema, options, PLUGIN_NAME)

    options.proxyScript = Object.assign({
      baseUrl: 'http://localhost:8080/',
      filename: '[basename].proxy.user.js',
      enable: process.env.WEBPACK_DEV_SERVER === 'true'
    }, options.proxyScript)
    options.proxyScript.enable = typeof options.proxyScript.enable === 'function'
      ? options.proxyScript.enable() : options.proxyScript.enable

    if (options.downloadBaseUrl && !options.updateBaseUrl) {
      options.updateBaseUrl = options.downloadBaseUrl
    } else if (!options.downloadBaseUrl && options.updateBaseUrl) {
      options.downloadBaseUrl = options.updateBaseUrl
    }

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

    compiler.hooks.emit.tapPromise(PLUGIN_NAME, async compilation => {
      for (const chunk of compilation.chunks) {
        if (!chunk.canBeInitial()) { // non-entry
          continue
        }

        for (const file of chunk.files) {
          const hash = compilation.hash
          const querySplit = file.indexOf('?')
          const query = querySplit >= 0 ? file.substr(querySplit) : ''

          const filename = querySplit >= 0 ? file.substr(0, querySplit) : file
          const basename = filename.endsWith('.user.js') ? path.basename(filename, '.user.js')
            : filename.endsWith('.js') ? path.basename(filename, '.js')
              : filename
          const outputFile = this.options.renameExt && !filename.endsWith('.user.js')
            ? filename.replace(/\.js$/, '') + '.user.js'
            : filename
          const metaFile = basename + '.meta.js'

          const data = {
            hash,
            chunkHash: chunk.hash,
            chunkName: chunk.name,
            file,
            filename,
            basename,
            query,
            buildNo: ++this.buildNo,
            buildTime: Date.now(),
            ...packageInfoObj
          }

          const tplHeaderObj = headerProvider(data)
          if (!tplHeaderObj.downloadURL && this.options.downloadBaseUrl) {
            tplHeaderObj.downloadURL = new URL(outputFile, this.options.downloadBaseUrl).toString()
          }
          if (!tplHeaderObj.updateURL && this.options.updateBaseUrl) {
            tplHeaderObj.updateURL = !this.options.metajs ? tplHeaderObj.downloadURL
              : new URL(metaFile, this.options.updateBaseUrl).toString()
          }

          if (this.options.ssri) { // sri support
            const ssriOptions = Object.assign(
              {},
              DEFAULT_SSRI_CONFIG,
              typeof this.options.ssri === 'boolean' ? {}
                : this.options.ssri
            )
            const urlFilters = _pick(ssriOptions, ['include', 'exclude'])
            const integrityOptions = _pick(ssriOptions, ['algorithms', 'integrity', 'size'])

            if (!Array.isArray(tplHeaderObj.require)) {
              tplHeaderObj.require = [tplHeaderObj.require]
            }
            if (!Array.isArray(tplHeaderObj.resource)) {
              tplHeaderObj.resource = [tplHeaderObj.resource]
            }

            tplHeaderObj.require = await Promise.all(
              tplHeaderObj.require
                .map(url => computeSSRI(url, urlFilters, integrityOptions))
            )

            tplHeaderObj.resource = await Promise.all(
              tplHeaderObj.resource
                .map(url => computeSSRI(url, urlFilters, integrityOptions))
            )
          }

          const headerObj = interpolate(tplHeaderObj, data)
          const headerString = userscriptMeta.stringify(headerObj, this.options.pretty)
          const fileSource = compilation.assets[file]

          if (outputFile !== file) {
            delete compilation[file]
          }

          // prepend header
          compilation.assets[outputFile] = new ConcatSource(
            headerString,
            '\n',
            fileSource
          )

          let hotDevHeaderString = ''
          if (this.options.proxyScript.enable) {
            const hotDevBaseUrl = interpolate(this.options.proxyScript.baseUrl, data)
            const hotDevFilename = interpolate(this.options.proxyScript.filename, data)
            hotDevHeaderString = userscriptMeta.stringify({
              ...headerObj,
              require: `${hotDevBaseUrl.replace(/\/$/, '')}/${outputFile}`
            }, this.options.pretty)
            compilation.assets[hotDevFilename] = new RawSource(hotDevHeaderString)
          }

          if (this.options.metajs) {
            compilation.assets[metaFile] = new RawSource(
              this.options.proxyScript.enable ? hotDevHeaderString : headerString)
          }
        }
      }
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

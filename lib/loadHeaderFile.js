const path = require('path')

/**
 * @param {string} file
 */
module.exports = function loadHeaderFile (file, fileDependencies) {
  const absPath = path.resolve(process.cwd(), file)
  const header = require(absPath)
  if (![ 'object', 'function' ].includes(typeof header)) {
    throw new TypeError(`The header file should export either an object or a function.`)
  }
  fileDependencies.add(absPath)
  return header
}

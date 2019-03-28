/**
 * @param {function|object} header
 */
module.exports = function createHeaderProvider (packageJson, headerFnOrObj) {
  const pkgName = packageJson.name
  const pkgVersion = packageJson.version
  // return user defined headers
  let _headerFn = typeof headerFnOrObj === 'function' ? headerFnOrObj
    : () => headerFnOrObj || {}
  return function headerProvider (data) {
    const headerObj = _headerFn(data)
    return {
      name: pkgName,
      version: pkgVersion,
      match: headerObj.include || headerObj.match ? '' : '*://*/*',
      // override default headers
      ...(typeof headerObj === 'object' ? headerObj : {})
    }
  }
}

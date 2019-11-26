/**
 * @param {function|object} header
 */
module.exports = function createHeaderProvider (packageJson, headerFnOrObj) {
  const pkgName = packageJson.name
  const pkgVersion = packageJson.version
  const pkgDescription = packageJson.description
  const pkgAuthor = packageJson.author
  const pkgHomepage = packageJson.homepage
  const pkgSupportUrl = typeof packageJson.bugs === 'string' ? packageJson.bugs
    : typeof packageJson.bugs === 'object' &&
      typeof packageJson.bugs.url === 'string' ? packageJson.bugs.url
      : ''

  // return user defined headers
  let _headerFn = typeof headerFnOrObj === 'function' ? headerFnOrObj
    : () => headerFnOrObj || {}
  return function headerProvider (data) {
    const headerObj = _headerFn(data)
    return trimFalsyLeaves({
      name: pkgName,
      version: pkgVersion,
      author: pkgAuthor,
      description: pkgDescription,
      homepage: pkgHomepage,
      supportURL: pkgSupportUrl,
      match: typeof headerObj === 'object' && (headerObj.include || headerObj.match) ? '' : '*://*/*',
      // override default headers
      ...(typeof headerObj === 'object' ? headerObj : {})
    })
  }
}

function trimFalsyLeaves (obj) {
  if (Array.isArray(obj)) {
    const filtered = obj.filter(Boolean)
    return filtered.length > 0 ? filtered : undefined
  }
  if (typeof obj === 'string') {
    return obj.trim() || undefined
  }
  if (typeof obj === 'object') {
    const filtered = Object.entries(obj)
      .filter(([ , value ]) => Boolean(trimFalsyLeaves(value)))
    return filtered.length > 0 ? filtered.reduce((newObj, [ key, value ]) => {
      newObj[key] = value
      return newObj
    }, {}) : undefined
  }

  return obj
}

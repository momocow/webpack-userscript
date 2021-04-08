const request = require('request')
const ssri = require('ssri')
const devnull = require('dev-null')
const { URL } = require('url')

// @see https://github.com/npm/ssri/blob/79ba4ec4b2af9f82538c6917494d5cc1c24bc724/index.js#L7
const SPEC_ALGORITHMS = [
  /^sha256/,
  /^sha384/,
  /^sha512/
]

function matchAnyOf (target, exps) {
  return undefined !== exps
    .map(exp => new RegExp(exp))
    .find(regexp => {
      return regexp.test(target)
    })
}

/**
 * @param {string} url
 */
module.exports.computeSSRI = async function (url, tag, filters = {}, options = {}) {
  const sep = ','
  const urlObj = new URL(url)

  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    // neither http nor https
    return url
  }

  const metaLine = `// @${tag} ${url}`
  if (filters.include) {
    const incFilters = Array.isArray(filters.include) ? filters.include : [filters.include]
    if (!matchAnyOf(metaLine, incFilters)) {
      return url
    }
  }

  if (filters.exclude) {
    const excFilters = Array.isArray(filters.exclude) ? filters.exclude : [filters.exclude]
    if (matchAnyOf(metaLine, excFilters)) {
      return url
    }
  }

  const ssris = urlObj.hash.replace(/^#/, '').split(/[,;]/)
    .filter(sri => matchAnyOf(sri, SPEC_ALGORITHMS))
  if (Array.isArray(options.algorithms)) {
    options.algorithms = options.algorithms.filter(
      // filter those algorithms that already have integrities
      algo => !ssris.find(s => s.substr(0, algo.length) === algo)
    )
    if (options.algorithms.length === 0) {
      // no more integrities required to be computed
      return url
    }
  } else if (ssris.length > 0) {
    // no algorithms specified and there is already one or more SRIs
    return url
  }

  const allowedStatusCodes = options.allowedStatusCodes || [200]

  return new Promise((resolve, reject) => {
    const integrityStream = ssri.integrityStream(options)
    let integrity = ''
    integrityStream.on('integrity', i => {
      integrity = i.toString({ sep })
      ssris.push(integrity)
      urlObj.hash = '#' + ssris.join(sep)
      url = urlObj.toString()
    })
      .on('end', () => resolve(url))
      .on('error', error => reject(error))

    request(url)
      .on('response', (resp) => {
        if (!allowedStatusCodes.includes(resp.statusCode)) {
          reject(new Error(
            `SSRI failed due to HTTP error (${resp.statusCode} ${resp.request.uri.href})`
          ))
        }
      })
      .pipe(integrityStream)
      .pipe(devnull())
  })
}

const request = require('request')
const ssri = require('ssri')
const devnull = require('dev-null')
const { URL } = require('url')

function matchAnyOf (target, exps) {
  return undefined === exps
    .map(exp => new RegExp(exp))
    .find(regexp => regexp.test(target))
}

/**
 * @param {string} url
 */
module.exports.computeSSRI = async function (url, filters = {}, options = {}) {
  const sep = ','
  const urlObj = new URL(url)

  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    // neither http nor https
    return url
  }

  const incFilter = Array.isArray(filters.include) ? filters.include : [filters.include]
  const excFilter = Array.isArray(filters.exclude) ? filters.exclude : [filters.exclude]

  if (!matchAnyOf(url, incFilter) || matchAnyOf(url, excFilter)) {
    return url
  }

  const ssris = urlObj.hash.replace(/^#/, '').split(/[,;]/)

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

  const integrityStream = ssri.integrityStream(options)
  let integrity = ''
  integrityStream.on('integrity', i => {
    integrity = i.toString({ sep })
    ssris.push(integrity)
    urlObj.hash = '#' + ssris.join(sep)
    url = urlObj.toString()
  })

  return new Promise((resolve, reject) => {
    request(url)
      .pipe(integrityStream)
      .pipe(devnull())
      .on('close', () => resolve(url))
      .on('error', error => reject(error))
  })
}

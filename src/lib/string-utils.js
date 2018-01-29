const UNIT_SEP = String.fromCharCode(31)

function padEnd (target, minLen, padStr = ' ') {
  if (typeof padEnd.cache !== 'object') padEnd.cache = {}

  padStr = typeof padStr !== 'string' || padStr.length < 1 ? ' ' : padStr

  let padKey = target.length + UNIT_SEP + minLen + UNIT_SEP + padStr

  // read from cache
  if (padKey in padEnd.cache) return target + padEnd.cache[padKey]

  let finalPad = ''
  let padLen = minLen - target.length
  for (let i = 0; i < padLen; i++) finalPad += padStr

  // make cache
  padEnd.cache[padKey] = finalPad

  return target + finalPad
}

module.exports = {
  padEnd
}

const PKG = require('./package.json')

function pad (target, minLen, padStr = ' ') {
  padStr = typeof padStr !== 'string' || padStr.length < 1 ? ' ' : padStr
  while (target.length < minLen) target += padStr
  return target
}

function extraHead () {
  let ret = []
  for (let field of Object.keys(PKG.header)) ret.push(`// @${pad(field, 13)}${PKG.header[field]}`)
  return ret.join('\n')
}

module.exports = `\
// ==UserScript==
// @name         ${PKG.name}
// @version      ${PKG.version}
// @description  ${PKG.description}
// @author       ${PKG.author}
${extraHead()}
// ==/UserScript==
`

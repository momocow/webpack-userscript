const { padEnd } = require('./lib/string-utils')

const PKG = require('./package.json')

function extraHead () {
  let ret = []
  for (let field of Object.keys(PKG.header)) {
    if (Array.isArray(PKG.header[field])) {
      PKG.header[field].forEach(element => {
        if (typeof element === 'string') {
          ret.push(`// @${padEnd(field, 13)}${element}`)
        }
      })
    } else if (typeof PKG.header[field] === 'string') {
      ret.push(`// @${padEnd(field, 13)}${PKG.header[field]}`)
    }
  }
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

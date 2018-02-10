const TICK_LEVEL = { MAJOR: 0, MINOR: 1, PATCH: 2 }
TICK_LEVEL.getReadable = function (level) {
  switch (level) {
    case TICK_LEVEL.MAJOR:
      return 'MAJOR'
    case TICK_LEVEL.MINOR:
      return 'MINOR'
    case TICK_LEVEL.PATCH:
      return 'PATCH'
    default:
      return 'Invalid TICK_LEVEL'
  }
}

class Version {
  constructor (verStr) {
    this._ver = verStr
  }

  tick (level, step = 1) {
    let verTokens = this._ver.split('.')
    verTokens[level] = parseInt(verTokens[level]) + step
    for (let i = level + 1; i < 3; i++) {
      verTokens[i] = 0
    }
    this._ver = verTokens.join('.')
    return this
  }

  toString () {
    return this._ver
  }
}

Version.TICK_LEVEL = TICK_LEVEL

module.exports = Version

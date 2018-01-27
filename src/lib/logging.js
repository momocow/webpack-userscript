/**
 * Support for styling console log in both node.js ANSI consoles and browser consoles
 */

const IS_ENV_BROWSER = typeof window === 'object'

const browserConsoleStyleMap = {
  critical: 'color:white;background-color:red',
  error: 'color:red',
  warn: 'color:orange',
  info: 'color:green',
  levelChange: 'color:blue;background-color:yellow;'
}

const colors = IS_ENV_BROWSER ? undefined : require('colors/safe')

// for ANSI terminal console
!IS_ENV_BROWSER && colors.setTheme({
  critical: [ 'white', 'bgRed' ],
  error: 'red',
  warn: 'yellow',
  info: 'green',
  levelChange: [ 'blue', 'bgYellow' ]
})

function getLevelInt (level) {
  if (typeof level === 'number') return level

  level = typeof level === 'string' ? level.toLowerCase() : level

  switch (level) {
    case 'off':
      return 60
    case 'critical':
      return 50
    case 'error':
      return 40
    case 'warn':
      return 30
    case 'info':
      return 20
    case 'debug':
      return 10
    case 'on':
    case 'all':
      return 0
    default:
      return NaN
  }
}

const DEFAULT_CONF = {
  namespace: ''
}

function trim (config) {
  return {
    namespace: config.namespace || config.ns || ''
  }
}

/**
 * A wrapper for logging functions
 */
class Logger {
  constructor (config = {}) {
    config = trim(config)

    this.config = Object.assign({}, DEFAULT_CONF, config)
    this.logLevel = 20
  }

  _log (level, rawMsg, ...args) {
    level = level || 'debug'
    if (getLevelInt(level) >= this.logLevel) {
      let decorate = !colors || !colors[level] ? function (msg) {
        if (!colors && browserConsoleStyleMap[level]) return [ `%c${msg}`, browserConsoleStyleMap[level] ]
        return [ msg ]
      } : function (msg) {
        return [ colors[level](msg) ]
      }

      let ns = this.config.namespace ? this.config.namespace + ': ' : ''
      let msg = `[${new Date().toLocaleString()}] [${level}] ${ns}${rawMsg}`

      console.log(...decorate(msg), ...args)
    }
  }

  debug (...args) {
    this._log('', ...args)
  }

  info (...args) {
    this._log('info', ...args)
  }

  warn (...args) {
    this._log('warn', ...args)
  }

  error (...args) {
    this._log('error', ...args)
  }

  critical (...args) {
    this._log('critical', ...args)
  }

  setLevel (level) {
    this.logLevel = getLevelInt(level)

    let msg = `Log level is set to '${level.toString().toUpperCase()}'`
    if (IS_ENV_BROWSER) {
      console.log(`%c${msg}`, browserConsoleStyleMap.levelChange)
    } else {
      console.log(colors.levelChange(msg))
    }
  }
}

const global = new Logger()
global.Logger = Logger

module.exports = global

const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

let cwdCache

function command (cmd, args, options) {
  let done = typeof (args.slice(-1)[0]) === 'function' ? args.pop() : function () {}
  let proc = spawn(cmd, args, Object.assign({
    shell: true,
    env: process.env,
    cwd: process.cwd(),
    stdio: 'inherit',
    windowsHide: true
  }, options))

  proc.on('close', function (code) {
    done(code)
  })
}

function ensureCWDHasGit () {
  if (cwdCache) return cwdCache

  for (let cwd = path.resolve('.'), parent = path.resolve(cwd, '..'); cwd !== parent; cwd = parent) {
    try {
      if (fs.lstatSync(path.join(cwd, '.git')).isDirectory()) {
        cwdCache = cwd
        return cwd
      }
    } catch (err) {
      continue
    }
  }

  return ''
}

function git (...args) {
  let cwd = ensureCWDHasGit()
  if (cwd) command('git', args, { cwd })
  else {
    let done = typeof (args.slice(-1)[0]) === 'function' ? args.pop() : function (e) {
      console.error(e)
    }
    done(new Error(''))
  }
}

function ga (target, ...args) {
  if (typeof target === 'function') {
    args = [ target ]
    target = '.'
  }
  git('add', target || '.', ...args)
}

function gc (msg, ...args) {
  if (typeof msg !== 'string') {
    throw new Error('A commit message is required.')
  }
  git('commit', '-m', msg || '', ...args)
}

module.exports = {
  command, git, ga, gc
}

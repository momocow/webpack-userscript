#!/usr/bin/env node

/************** Constant strings **************/

const MISSING_DEP = `A missing dependency, '%s', is detected. Do you want to enable auto-installation?`

/**********************************************/

const util = require('util')
const require = wrapRequire()

require('validate-npm-package-name')

/******* Function stack starts from here ******/

function wrapRequire () {
  let wrapper = function (pkg) {
    try {
      return wrapper.require(pkg)
    } catch (err) {
      prompt(util.format(MISSING_DEP, pkg), 'yes', function (ans) {
      })
    }
  }
  wrapper.require = require

  return wrapper
}

function prompt (msg, defaultValue, validator = function () {}) {
  let displayedDefault
  if (defaultValue) defaultValue = ` ${defaultValue}`
  console.log(msg)
}

/**********************************************/

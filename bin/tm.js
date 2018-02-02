#!/usr/bin/env node

/************** Constant strings **************/

const MISSING_DEP = `Missing dependenc%s detected. Do you want to enable auto-installation?`

/**********************************************/

// const {} = getDependencies()

/******* Function stack starts from here ******/

// /**
//  * @return {object} all dependencies
//  */
// function getDependencies () {

// }

function prompt (msg, defaultValue, validator = function () {}) {
  let displayedDefault
  if (defaultValue) defaultValue = ` ${defaultValue}`
  console.log(msg)
}

/**********************************************/

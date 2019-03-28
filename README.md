# webpack-tampermonkey
[![Build Status](https://travis-ci.org/momocow/webpack-tampermonkey.svg?branch=master)](https://travis-ci.org/momocow/webpack-tampermonkey)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/v/webpack-tampermonkey.svg)](https://www.npmjs.com/webpack-tampermonkey)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.carloscuesta.me/)

A Webpack4+ plugin for userscript projects.

> It was a *project prototype* before v1.\*, but it shows no flexibility and not customizable until it is a webpack plugin. For example, it did not support multiple scripts in a single project in v1.\*. See [issue #1](https://github.com/momocow/webpack-tampermonkey/issues/1).

## Features
- Make your userscript development combined with Webpack
  > With powerful Webpack support, you can even package everything in your userscript, e.g. icons and json data.
- Ability to generate userscript headers
- Ability to generate both `.user.js` and `.meta.js`
  > `.meta.js` is used for update check containing headers only.

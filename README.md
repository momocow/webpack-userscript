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
- Properly track files in watch mode
  > Including external header files and package.json.

## Installation
```bash
npm i webpack-tampermonkey -D
```

## Usage

### webpack.config.js

Include the plugin in the `webpack.config.js` as the following example.

```js
const WebpackTampermonkey = require('webpack-tampermonkey')

module.exports = {
  plugins: [
    new WebpackTampermonkey()
  ]
}
```

## Examples
Examples can be found under [the test fixture folder](./test/fixtures).

## Configuration
### WebpackTampermonkey
The `WebpackTampermonkey` constructor has the following signature.
```js
new WebpackTampermonkey(options)
```

### options
> Also see [the schema of options](./lib/schemas/options.json).

```ts
type WebpackTampermonkeyOptions =
  WPTMOptions |
  HeaderFile |   // shorthand for WPTMOptions.headers
  HeaderProvider // shorthand for WPTMOptions.headers
```

#### WPTMOptions
```ts
interface WPTMOptions {
  headers: HeaderFile | HeaderProvider

  /**
   * Output *.meta.js or not
   */
  metajs: boolean

  /**
   * Rename all .js files to .user.js files.
   */
  renameExt: boolean

  /**
   * Prettify the header
   */
  pretty: boolean
}
```

#### HeaderFile
A path to a js or json file which exports a header object or a header provider function.

```ts
type HeaderFile = string
```

#### HeaderProvider
A function that returns a header object.

```ts
type HeaderProvider = (data: object) => HeaderObject
```

Note that `data` contains the same variables as [`output.filename` templates](https://webpack.js.org/configuration/output#outputfilename).

#### HeaderObject
A header object.

> Also see [explicit-config/webpack.config.js](./test/fixtures/explicit-config/webpack.config.js#L13).

```ts
type HeaderFile = object
```
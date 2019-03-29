# webpack-userscript
[![Build Status](https://travis-ci.org/momocow/webpack-userscript.svg?branch=master)](https://travis-ci.org/momocow/webpack-userscript)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/v/webpack-userscript.svg)](https://www.npmjs.com/webpack-userscript)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.carloscuesta.me/)

A Webpack4+ plugin for userscript projects.

> The package has been renamed from `webpack-tampermonkey`.

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
npm i webpack-userscript -D
```

## Usage

### webpack.config.js

Include the plugin in the `webpack.config.js` as the following example.

```js
const WebpackUserscript = require('webpack-userscript')

module.exports = {
  plugins: [
    new WebpackUserscript()
  ]
}
```

## Examples
Examples can be found under [the test fixture folder](./test/fixtures).

## Configuration
### WebpackUserscript
The `WebpackUserscript` constructor has the following signature.
```js
new WebpackUserscript(options)
```

### options
> Also see [the schema of options](./lib/schemas/options.json).

```ts
type WebpackUserscriptOptions =
  WPUSOptions |
  HeaderFile |   // shorthand for WPUSOptions.headers
  HeaderProvider // shorthand for WPUSOptions.headers
```

#### WPUSOptions
```ts
interface WPUSOptions {
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
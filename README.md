# webpack-userscript
[![Build Status](https://travis-ci.org/momocow/webpack-userscript.svg?branch=master)](https://travis-ci.org/momocow/webpack-userscript)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/v/webpack-userscript.svg)](https://www.npmjs.com/webpack-userscript)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.carloscuesta.me/)

A Webpack4+ plugin for userscript projects. 🙈

> The package has been renamed from `webpack-tampermonkey`.

## Features
- Combine your userscript development with Webpack
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
type HeaderProvider = (data: DataObject) => HeaderObject
```

#### HeaderObject
A header object, whose leaves are webpack-like template strings in `[var]` format. Available variables can be found at [DataObject](#dataobject).

> Also see [explicit-config/webpack.config.js](./test/fixtures/explicit-config/webpack.config.js#L13) and [template-strings/webpack.config.js](./test/fixtures/template-strings/webpack.config.js#L16).

```ts
type HeaderFile = Record<string, string | Array<string>>
```

#### DataObject
Local variables used to interpolate the templates of a [HeaderObject](#headerobject).

```ts
interface DataObject {
  /**
   * Hash of Webpack compilation
   */
  hash: string

  /**
   * Webpack chunk hash
   */
  chunkHash: string

  /**
   * Webpack chunk name
   */
  chunkName: string

  /**
   * Entry file path, which may contain queries
   */
  file: string

  /**
   * Query string
   */
  query: string

  /**
   * Info from package.json
   */
  name: string
  version: string
  description: string
  author: string
  homepage: string
  bugs: string // URL
}
```

> Also see [template-strings/webpack.config.js](./test/fixtures/template-strings/webpack.config.js#L16).
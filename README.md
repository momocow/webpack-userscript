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
- Helper mode to integrate with Webpack Dev Server and TamperMonkey.
  > Additionally ouput proxy scripts along with main userscripts, which looks similar with `*.meta.js` but with additional `@require` meta field to include the main userscript, then you can set your TamperMonkey not to cache external files. It's useful when the script is under development.

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

### Hot Development
The following example can be used in development mode with the help of [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server).

`webpack-dev-server` will build the userscript in **watch** mode. Each time the project is built, the `buildNo` variable will increase by 1.

In the following configuration, a portion of the `version` contains the `buildNo`; therefore, each time there is a build, the `version` is also increased so as to indicate a new update available for the script engine like Tampermonkey or GreaseMonkey.

After the first time starting the `webpack-dev-server`, you can install the script via `http://localhost:8080/<project-name>.user.js` (the URL is actually refered to your configuration of `webpack-dev-server`). Once installed, there is no need to manually reinstall the script until you stop the server. To update the script, the script engine has an **update** button on the GUI for you.

- `webpack.config.dev.js`
```js
const path = require('path')
const WebpackUserscript = require('webpack-userscript')
const dev = process.env.NODE_ENV === 'development'

module.exports = {
  mode: dev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src', 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '<project-name>.user.js'
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist')
  },
  plugins: [
    new WebpackUserscript({
      headers: {
        version: dev ? `[version]-build.[buildNo]` : `[version]`
      }
    })
  ]
}
```

### Other
Other examples can be found under [the test fixture folder](./test/fixtures).

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
  headers: HeaderFile | HeaderProvider | HeaderObject

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

  /**
   * Base URL for downloadURL.
   * If not provided, it will be set to `updateBaseUrl` if `updateBaseUrl` is provided
   */
  downloadBaseUrl: string

  /**
   * Base URL for updateURL
   * If not provided, it will be set to `downloadBaseUrl` if `downloadBaseUrl` is provided
   */
  updateBaseUrl: string
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
A header object, whose leaves are webpack-like template strings in `[<var_name>]` format. Available variables can be found at [DataObject](#dataobject).

> Also see [explicit-config/webpack.config.js](./test/fixtures/explicit-config/webpack.config.js#L13) and [template-strings/webpack.config.js](./test/fixtures/template-strings/webpack.config.js#L16).

```ts
type HeaderObject = Record<string, string | Array<string>>
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
   * just like `file` but without queries
   */
  filename: string

  /**
   * just like `filename` but without file extension, i.e. ".user.js" or ".js"
   */
  basename: string

  /**
   * Query string
   */
  query: string

  /**
   * Build number
   */
  buildNo: number

  /**
   * the 13-digits number represents the time the script is built
   */
  buildTime: number

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

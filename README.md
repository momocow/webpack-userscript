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
- Support generating SRIs for `@require` and `@resource` URLs if the protocol is either `http` or `https`.
  > since v2.5.0

## Installation

```bash
npm i webpack-userscript -D
```

## Usage

### webpack.config.js

Include the plugin in the `webpack.config.js` as the following example.

```js
const WebpackUserscript = require('webpack-userscript');

module.exports = {
  plugins: [new WebpackUserscript()],
};
```

## Examples

### Hot Development

The following example can be used in development mode with the help of [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server).

`webpack-dev-server` will build the userscript in **watch** mode. Each time the project is built, the `buildNo` variable will increase by 1.

> **Notes**: `buildNo` will be reset to 0 if the dev server is terminated. In this case, if you expect the build version to be persisted during dev server restarting, you can use the `buildTime` variable instead.

In the following configuration, a portion of the `version` contains the `buildNo`; therefore, each time there is a build, the `version` is also increased so as to indicate a new update available for the script engine like Tampermonkey or GreaseMonkey.

After the first time starting the `webpack-dev-server`, you can install the script via `http://localhost:8080/<project-name>.user.js` (the URL is actually refered to your configuration of `webpack-dev-server`). Once installed, there is no need to manually reinstall the script until you stop the server. To update the script, the script engine has an **update** button on the GUI for you.

- `webpack.config.dev.js`

```js
const path = require('path');
const WebpackUserscript = require('webpack-userscript');
const dev = process.env.NODE_ENV === 'development';

module.exports = {
  mode: dev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src', 'index.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '<project-name>.user.js',
  },
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
  },
  plugins: [
    new WebpackUserscript({
      headers: {
        version: dev ? `[version]-build.[buildNo]` : `[version]`,
      },
    }),
  ],
};
```

### Integration with Webpack Dev Server and TamperMonkey

If you feel tired with firing the update button on TamperMonkey GUI, maybe you can have a try at proxy script.

A proxy script actually looks similar with the content of `*.meta.js` except that it contains additional `@require` field to include the main userscript. A proxy script is used since TamperMonkey has an option that makes external scripts always be update-to-date without caching, and external scripts are included into userscripts via the `@require` meta field. (You may also want to read this issue, [Tampermonkey/tampermonkey#767](https://github.com/Tampermonkey/tampermonkey/issues/767#issuecomment-542813282))

To avoid caching and make the main script always be updated after each page refresh, we have to make our main script **"an external resource"**. That is where the proxy script comes in, it provides TamperMonkey with a `@require` pointint to the URL of the main script on the dev server, and each time you reload your testing page, it will trigger the update.

> Actually it requires 2 reloads for each change to take effect on the page. The first reload trigger the update of external script but without execution (it runs the legacy version of the script), the second reload will start to run the updated script.
>
> I have no idea why TamperMonkey is desinged this way. But..., it's up to you!

To enable the proxy script, provide a `proxyScript` configuration to the plugin constructor.

Set `proxyScript.enable` to `true` will always enable proxy script, or you can provide a function that returns boolean. In the example below, the proxy script is enabled if the environment contains a variable, `LOCAL_DEV`, which is equal to `"1"`.

`baseUrl` should be the base URL of the dev server, and the `filename` is for the proxy script.

After starting the dev server, you can find your proxy script under `<baseUrl>/<filename>`. In the example below, assume the entry filename is `index.js`, you should visit `http://127.0.0.1:12345/index.proxy.user.js` to install the proxy script on TamperMonkey.

> Notes that the leaf values of `proxyScript` with also be interpolated; that is, template variables which can be found [here](#dataobject) are also supported inside these string settings.

```js
new WebpackUserscript({
  // <...your other configs...>,
  proxyScript: {
    baseUrl: 'http://127.0.0.1:12345',
    filename: '[basename].proxy.user.js',
    enable: () => process.env.LOCAL_DEV === '1',
  },
});
```

### Other

Other examples can be found under [the test fixture folder](./test/fixtures).

## Configuration

### WebpackUserscript

The `WebpackUserscript` constructor has the following signature.

```js
new WebpackUserscript(options);
```

### options

> Also see [the schema of options](./lib/schemas/options.json).

```ts
type WebpackUserscriptOptions =
  | WPUSOptions
  | HeaderFile // shorthand for WPUSOptions.headers
  | HeaderProvider; // shorthand for WPUSOptions.headers
```

#### WPUSOptions

```ts
interface WPUSOptions {
  headers: HeaderFile | HeaderProvider | HeaderObject;

  /**
   * Output *.meta.js or not
   */
  metajs: boolean;

  /**
   * Rename all .js files to .user.js files.
   */
  renameExt: boolean;

  /**
   * Prettify the header
   */
  pretty: boolean;

  /**
   * Base URL for downloadURL.
   * If not provided, it will be set to `updateBaseUrl` if `updateBaseUrl` is provided
   */
  downloadBaseUrl: string;

  /**
   * Base URL for updateURL
   * If not provided, it will be set to `downloadBaseUrl` if `downloadBaseUrl` is provided
   */
  updateBaseUrl: string;

  /**
   * Looks similar with `*.meta.js` but with additional `@require` meta field to include the main userscript.
   * It can be useful if you set the TamperMonkey not to cache external files.
   */
  proxyScript: {
    /**
     * filename template of the proxy script, defaults to "[basename].proxy.user.js"
     */
    filename: string;

    /**
     * Base URL of the dev server
     */
    baseUrl: string;

    /**
     * Whether to enable proxy script generation,
     * default value depends on whether `process.env.WEBPACK_DEV_SERVER` is `"true"` or not
     */
    enable: boolean | (() => boolean);
  };

  ssri:
    | boolean
    | {
        /**
         * URL filters.
         * Each of them is actually testing against a string compound of the meta field and the url.
         * For example, if a header is provided as `{ require: "http://example.com/sth.js" }`,
         * a string of "// @require http://example.com/sth.js" is tested with the provided filters.
         */
        include: string | RegExp | string[] | RegExp[];
        exclude: string | RegExp | string[] | RegExp[];

        /**
         * @see https://github.com/npm/ssri#--integritystreamopts---integritystream
         */
        algorithms: ('sha256' | 'sha384' | 'sha512')[];
        integrity: string;
        size: number;
      };
}
```

#### HeaderFile

A path to a js or json file which exports a header object or a header provider function.

```ts
type HeaderFile = string;
```

#### HeaderProvider

A function that returns a header object.

```ts
type HeaderProvider = (data: DataObject) => HeaderObject;
```

#### HeaderObject

A header object, whose leaves are webpack-like template strings in `[<var_name>]` format. Available variables can be found at [DataObject](#dataobject).

> Also see [explicit-config/webpack.config.js](./test/fixtures/explicit-config/webpack.config.js#L13) and [template-strings/webpack.config.js](./test/fixtures/template-strings/webpack.config.js#L16).

```ts
type HeaderObject = Record<string, string | Array<string>>;
```

#### DataObject

Local variables used to interpolate the templates of a [HeaderObject](#headerobject).

```ts
interface DataObject {
  /**
   * Hash of Webpack compilation
   */
  hash: string;

  /**
   * Webpack chunk hash
   */
  chunkHash: string;

  /**
   * Webpack chunk name
   */
  chunkName: string;

  /**
   * Entry file path, which may contain queries
   */
  file: string;

  /**
   * just like `file` but without queries
   */
  filename: string;

  /**
   * just like `filename` but without file extension, i.e. ".user.js" or ".js"
   */
  basename: string;

  /**
   * Query string
   */
  query: string;

  /**
   * Build number
   */
  buildNo: number;

  /**
   * the 13-digits number represents the time the script is built
   */
  buildTime: number;

  /**
   * Info from package.json
   */
  name: string;
  version: string;
  description: string;
  author: string;
  homepage: string;
  bugs: string; // URL
}
```

> Also see [template-strings/webpack.config.js](./test/fixtures/template-strings/webpack.config.js#L16).

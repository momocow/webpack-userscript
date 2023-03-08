# webpack-userscript

[![Test Status](https://github.com/momocow/webpack-userscript/actions/workflows/test.yaml/badge.svg?branch=main)](https://github.com/momocow/webpack-userscript/actions/workflows/test.yaml)
[![Release Status](https://github.com/momocow/webpack-userscript/actions/workflows/release.yaml/badge.svg?branch=main)](https://github.com/momocow/webpack-userscript/actions/workflows/release.yaml)
[![Coding Style](https://img.shields.io/badge/coding%20style-recommended-orange.svg?style=flat)](https://gitmoji.carloscuesta.me/)
[![npm](https://img.shields.io/npm/v/webpack-userscript.svg)](https://www.npmjs.com/package/webpack-userscript/v/latest)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.carloscuesta.me/)

A Webpack plugin for userscript projects. 🙈

## Features

- Combine your userscript development with Webpack
- Ability to generate both `.user.js` and `.meta.js`
- Properly track files in watch mode
- Ability to generate proxy scripts to integrate with Webpack Dev Server and TamperMonkey.
  > See [Issue#63](https://github.com/momocow/webpack-userscript/issues/63) for more information.
- Support generating SSRIs for `@require` and `@resource` URLs.
- > See [Subresource Integrity](https://www.tampermonkey.net/documentation.php#api:Subresource_Integrity) from TamperMonkey documentation.

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

## Features

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
      headers(original) {
        if (dev) {
          return {
            ...original,
            version: `${original.version}-build.[buildNo]`,
          }
        }

        return original;
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

`baseUrl` should be the base URL of the dev server, and the `filename` is for the proxy script.

> Note: `filename` will be interpolated.

After starting the dev server, you can find your proxy script under `<baseUrl>/<filename>`. In the example below, assume the entry filename is `index.js`, you should visit `http://127.0.0.1:12345/index.proxy.user.js` to install the proxy script on TamperMonkey.

See [Issue#63](https://github.com/momocow/webpack-userscript/issues/63) for more information.

```js
new WebpackUserscript({
  // <...your other configs...>,
  proxyScript: {
    baseUrl: 'http://127.0.0.1:12345',
    filename: '[basename].proxy.user.js',
  },
});
```

### Interpolation

Possible interpolation variables are as follows.

- `[name]`: chunk name
- `[buildNo]`: build number starting from 1 at beginning of watch mode
- `[buildTime]`: the timestamp in millisecond when the compilation starts
- `[file]`: full path of the file
  - = `[dirname]` + `[basename]` + `[extname]` + `[query]`
- `[filename]`: file path
  - = `[basename]` + `[extname]`
- `[dirname]`: directory path
- `[basename]`: file base name
- `[extname]`: file extension starting with `.`
- `[query]`: query string starting with `?`

## Configuration

See [UserscriptOptions](https://cow.moe/webpack-userscript/types/UserscriptOptions.html).
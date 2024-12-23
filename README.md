# webpack-userscript

[![Test Status](https://github.com/momocow/webpack-userscript/actions/workflows/test.yaml/badge.svg?branch=main)](https://github.com/momocow/webpack-userscript/actions/workflows/test.yaml)
[![Release Status](https://github.com/momocow/webpack-userscript/actions/workflows/release.yaml/badge.svg?branch=main)](https://github.com/momocow/webpack-userscript/actions/workflows/release.yaml)
[![Coding Style](https://img.shields.io/badge/coding%20style-recommended-orange.svg?style=flat)](https://gitmoji.carloscuesta.me/)
[![npm](https://img.shields.io/npm/v/webpack-userscript.svg)](https://www.npmjs.com/package/webpack-userscript/v/latest)
[![Gitmoji](https://img.shields.io/badge/gitmoji-%20😜%20😍-FFDD67.svg?style=flat-square)](https://gitmoji.carloscuesta.me/)

A Webpack plugin for userscript projects 🙈

- [webpack-userscript](#webpack-userscript)
  - [Overview](#overview)
    - [Installation](#installation)
    - [Usage](#usage)
    - [Options](#options)
  - [Concepts](#concepts)
    - [What does it actually do?](#what-does-it-actually-do)
      - [Prepend headers to userscripts](#prepend-headers-to-userscripts)
      - [Generate metadata files](#generate-metadata-files)
      - [Generate proxyscript files](#generate-proxyscript-files)
    - [Headers pipeline](#headers-pipeline)
      - [Load headers](#load-headers)
      - [Rename ambiguous tags](#rename-ambiguous-tags)
      - [Resolve base URLs](#resolve-base-urls)
      - [Process SSRIs](#process-ssris)
      - [Provide default values for tags](#provide-default-values-for-tags)
      - [Generate proxyscripts](#generate-proxyscripts)
      - [Interpolate templates inside values](#interpolate-templates-inside-values)
      - [Validate headers](#validate-headers)
      - [Render headers](#render-headers)
  - [Guides](#guides)
    - [Hot Development](#hot-development)
    - [Integration with Webpack Dev Server and TamperMonkey](#integration-with-webpack-dev-server-and-tampermonkey)
    - [I18n headers](#i18n-headers)
  - [Furthermore](#furthermore)

## Overview

### Installation

```bash
npm i webpack-userscript -D
```

### Usage

Import and configure the plugin in the `webpack.config.js` as the following example.

```js
const { UserscriptPlugin } = require('webpack-userscript');

module.exports = {
  plugins: [new UserscriptPlugin(/* optionally provide more options here */)],
};
```

### Options

See [UserscriptOptions](https://cow.moe/webpack-userscript/types/UserscriptOptions.html) for all configurations.

## Concepts

### What does it actually do?

#### Prepend headers to userscripts

The main purpose of this plugin is to generate userscript headers, and prepend them as a comment block into output entry scripts whose names are conventionally ending with `.user.js`.

There are several userscript engines on the internet and some of them call userscript headers in different names; but don't worry because they share the same concept and **almost** the same format.

Here are some references to headers definitions of userscript engines:

- [TamperMonkey: userscript headers](https://www.tampermonkey.net/documentation.php#meta)
- [GreaseMonkey: metadata block](https://wiki.greasespot.net/Metadata_Block)
- [GreasyFork: meta keys](https://greasyfork.org/en/help/meta-keys)
- [ViolentMonkey: metadata block](https://violentmonkey.github.io/api/metadata-block/)

#### Generate metadata files

Besides prepending headers to entry scripts, it can optionally generate metadata files which are userscript files without codes; that is, they contain headers only. Metadata files are used to save bandwidth when checking updates. By convention, their names are ending with `.meta.js`.

#### Generate proxyscript files

The concept of proxyscript is introduced by this plugin, unlike userscripts and metadata files which are commonly known. The name of a proxyscript should end with `.proxy.user.js`. It is mainly designed to work around the caching behavior of userscript engines like TamperMonkey. It was a pain point for userscript developers who set up a development environment with Webpack Dev Server and require fresh reloads to test their scripts.

 > See more details in [issue #63](https://github.com/momocow/webpack-userscript/issues/63)

It is worth mentioning that with ViolentMonkey you might experience a better reload story, according to [a feedback in issue #63](https://github.com/momocow/webpack-userscript/issues/63#issuecomment-1500167848).

### Headers pipeline

#### Load headers

Headers can be provided directly as an object, a string referencing to a file, or a function returning an object of headers.

The plugin will also try to load initial headers from the following fields, `name`, `description`, `version`, `author`, `homepage` and `bugs` in `package.json`.

Headers files are added as a file dependency; therefore, changes to headers files are watched by Webpack during developing in the watch mode.

#### Rename ambiguous tags

The main purpose is to fix misspelling or wrong letter case.

- `updateUrl` => `updateURL`
- `iconUrl` => `iconURL`
- `icon64Url` => `icon64URL`
- `installUrl` => `installURL`
- `supportUrl` => `supportURL`
- `downloadUrl` => `downloadURL`
- `homepageUrl` => `homepageURL`

#### Resolve base URLs

Base URLs are resolved for `downloadURL` and `updateURL`.

If `updateBaseURL` is not provided, `downloadBaseURL` will be used; if metajs is disabled, `updateURL` will point to the file of userjs.

#### Process SSRIs

[Subresource Integrity](https://www.tampermonkey.net/documentation.php#api:Subresource_Integrity) is used to ensure the 3rd-party assets do not get mocked by the man in the middle.

URLs in `@require` and `@resource` tags can have their SSRIs be generated and locked in a SSRI lock file whose name is default to `ssri-lock.json`.

Missing SSRIs will be computed right in the compilation, which indicates that developers have to ensure their 3rd-party assets to be trustable during compilation.

If one cannot ensure 3rd-party assets to be trustable, he can modify the lock file himself with trustable integrities of assets.

> Note that the lock file should be commited into the version control system just like `package-lock.json`.

#### Provide default values for tags

If there is no any `@include` or `@match` tag provided, a wildcard `@match`, `*://*/*`, is used.

#### Generate proxyscripts

The content of a proxyscript looks similar to a metajs except that its `@require` tag will include an URL linked to its userjs file and it won't have any one of these tags, `downloadURL`, `updateURL` and `installURL`.

#### Interpolate templates inside values

Leaf values of headers can be interpolable templates. Template variables can be represented in a format, `[var]`, just like how [template strings in Webpack output options](https://webpack.js.org/configuration/output/#template-strings) look like.

Possible template variables are as follows.

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

> Note that `[buildNo]` starts from 0 and will increase during developing in the watch mode.
> Once exiting from the watch mode, it will be reset.

For example, one can embed the build time into `@version` tag via the following configuration.

```js
new UserscriptPlugin({
  headers: {
    version: '0.0.1-beta.[buildTime]'
  },
})
```

#### Validate headers

Headers will be transformed and validated with the help of [`class-transformer`](https://github.com/typestack/class-transformer) and [`class-validator`](https://github.com/typestack/class-validator).

The configuration defaults to strict mode, which means extra tags are not allowed and type checking to headers values are performed.

One can provide `headersClass` option to override the default `Headers` class; but it is suggested to inherit from the original one.

> Note that the `headersClass` is used for both main headers and i18n headers.
> Check the [default implementation](lib/features/validate-headers/headers.ts) before customizing your own.

#### Render headers

Headers in all locales are merged and rendered.

There are 2 useful options here, `pretty` and `tagOrder`.

The `pretty` option is a boolean deciding whether to render the headers as a table or not.

The `tagOrder` option is a precedence list of tag names which should be followed. Listed tags are rendered first; unlisted tags are rendered after listed ones, in ASCII order.

## Guides

### Hot Development

The following example can be used in development mode with the help of [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server).

`webpack-dev-server` will build the userscript in **watch** mode. Each time the project is built, the `buildNo` variable will increase by 1.

> **Notes**: `buildNo` will be reset to 0 if the dev server is terminated. In this case, if you expect the build version to be persisted during dev server restarting, you can use the `buildTime` variable instead.

In the following configuration, a portion of the `version` contains the `buildNo`; therefore, each time there is a build, the `version` is also increased so as to indicate a new update available for the script engine like Tampermonkey or GreaseMonkey.

After the first time starting the `webpack-dev-server`, you can install the script via `http://localhost:8080/<project-name>.user.js` (the URL is actually refered to your configuration of `webpack-dev-server`). Once installed, there is no need to manually reinstall the script until you stop the server. To update the script, the script engine has an **update** button on the GUI for you.

- `webpack.config.dev.js`

```js
const path = require('path');
const { UserscriptPlugin } = require('webpack-userscript');
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
    new UserscriptPlugin({
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

`baseURL` should be the base URL of the dev server, and the `filename` is for the proxy script.

> Note: `filename` will be interpolated.

After starting the dev server, you can find your proxy script under `<baseURL>/<filename>`. In the example below, assume the entry filename is `index.js`, you should visit `http://127.0.0.1:12345/index.proxy.user.js` to install the proxy script on TamperMonkey.

See [Issue#63](https://github.com/momocow/webpack-userscript/issues/63) for more information.

```js
new WebpackUserscript({
  // <...your other configs...>,
  proxyScript: {
    baseURL: 'http://127.0.0.1:12345',
    filename: '[basename].proxy.user.js',
  },
});
```




### I18n headers

I18n headers can be provided as an object, a string (a.k.a headers file) or a function (a.k.a headers provider), just like the main headers.

```js
new UserscriptPlugin({
  headers: {
    name: 'this is the main script name'
  },
  i18n: {
    // headers object
    'en-US': {
      name: 'this is a localized name'
    },
  },
})
```


```js
new UserscriptPlugin({
  headers: {
    name: 'this is the main script name'
  },
  i18n: {
    // headers file
    'en-US': '/dir/to/headers.json' // whose content is `{"name": "this is a localized name"}`
  },
})
```

```js
new UserscriptPlugin({
  headers: {
    name: 'this is the main script name'
  },
  i18n: {
    // headers provider
    'en-US': (headers) => ({
      ...headers,
      name: 'this is a localized name'
    }),
  },
})
```


With the above configurations will generate the following headers,

```js
// ==UserScript==
// @name this is the main script name
// @name:en-US this is a localized name
// @version 0.0.0
// @match *://*/*
// ==/UserScript==
```

## Furthermore
- [Get started with Webpack](https://webpack.js.org/guides/getting-started/)
- [How to write userscript in TypeScript?](https://github.com/momocow/webpack-userscript/issues/95)
- [Solution to userscript not refreshing on every page load](https://github.com/momocow/webpack-userscript/issues/63)
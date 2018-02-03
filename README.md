# webpack-tampermonkey
A webpack project prototype for user-scripts of Tampermonkey.

> An init helper is WIP.

## Features
- Writing userscript in a Node.js fashion.  
> e.g. `require` or ES6 `import`/`export`
> According to the ES6 support of your target browser, you may want to use Webpack babel-loader to tranlate the codes. You can modify `webpack.config.js` yourself to customize the project.
- Css files supported.  
> `GM_addStyle(require('path/to/css')) // easily inject CSS rules`
- Image files supported.  
> `document.createElement('img').src = require('path/to/image')`
- Built-in scripts for watching code changes, building userscript, and copying the output userscript to your clipboard.
> After saving every file, you can just go to Tampermonkey to add or modify a script and paste your userscript to the editor.

## Usage
- Clone this repository  
`git clone https://github.com/momocow/webpack-tampermonkey.git`
- Copy everythind under `src/` to your project folder
- Install dependencies  
`npm install`
- Fill in the `package.json` properly (see [Headers](#headers))
- Start coding from `<your-project>/src/index.js`

> IMPORTANT! The project folder is required to contain the git folder, i.e. `.git/`

## Headers
- Tampermonkey headers are specified in the `header` field in `package.json` as key-value pairs
- Values of Tampermonkey headers can be either a `string` or an `array`.
  - e.g. `grant` can have multiple values; therefore, you can config as the following.  
```
// package.json
{
  "name": "my-user-script",   //required
  "version": "0.0.0",         //required
  "description": "*",         //required
  "main": "*",                //required
  "header": {
    "grant": [
      "GM_setClipboard",
      "GM_addStyle"
    ]
  },

  ... (other fields)
}
```

## Image files supported
Images files can be packaged into the bundle automatically by `require('/path/to/image')` in your source code, where images can be `.png`, `.jpg` or `.gif` files. Requiring css files will get a base-64 encoded string of the image.

Then you can provide such base-64 encoded string as the `src` of an `<img>` element.

## CSS files supported
Css files can be packaged into the bundle automatically by `require('/path/to/your.css')` in your source code. Requiring css files will get a string of css content.

To inject it into the webpage, first ensure you have `"grant": "GM_addStyle"` in your `header` field.
Then call `GM_addStyle(css_string)` where `css_string` is the string requiring from the css file.

## Commands
### Build
Run webpack once.
- `npm run build`
### Versioning
All the following commands will tick the version in the `package.json`, packaging distributable, and commit all.
- `npm run major`
- `npm run minor`
- `npm run patch`
### Development
Watch, automatically package distributable, and copy the distributable into your clipboard (which can be pasted into Tampermonkey) for fast testing.
- `npm run watch`
# webpack-tampermonkey
A webpack project prototype for user-scripts of Tampermonkey.

> An init helper is WIP.

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

## CSS files support
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
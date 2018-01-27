# webpack-tampermonkey
A webpack project prototype for user-scripts of Tampermonkey.

## Usage
- Clone this repository  
`git clone https://github.com/momocow/webpack-tampermonkey.git`
- Copy everythind under `src/` to your project folder
- Install dependencies  
`npm install`
- Fill in the `package.json` properly
- Start coding from `<your-project>/src/index.js`

## The project folder is required to contain the git folder, i.e. `.git/`

## Commands
### Version
All the following commands will tick the version in the `package.json`, packaging distributable, and commit all.
- `npm run major`
- `npm run minor`
- `npm run patch`
### Development
Watch, automatically package distributable, and copy the distributable into your clipboard (which can be pasted into Tampermonkey) for fast testing.
- `npm run watch`
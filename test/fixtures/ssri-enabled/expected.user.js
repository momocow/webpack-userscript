// ==UserScript==
// @name        @webpack-tampermonkey/test-sri-enabled
// @version     1.0.0
// @author      MomoCow
// @description SRI test for webpack-userscript.
// @homepage    https://github.com/momocow/webpack-tampermonkey#readme
// @supportURL  https://github.com/momocow/webpack-tampermonkey/issues
// @match       *://*/*
// @require     http://localhost:@PORT@/jquery-3.4.1.min.js#sha512-4A/wOVnSDQeXRrI/QzEI3KmXrI5HNV1AUIJ7PEQ/1VF2GBJDcC/P9nkwo1INle1hlCWgKlfyPI3H5qd08yn5Pg==
// @require     http://localhost:@PORT@/index.js#sha512-PdHhlgpay8ksxFO2YjZiEz4waVWwmsRFAROOCYHUW6CvpxyHNVr4gevdEk2afhVPg0iBsiFKmqlVJjNNgAiGKQ==
// @resource    http://localhost:@PORT@/travis-webpack-userscript.svg#sha512-KiBzxTcE7gMnhgbqM0b7XsNtTJMWUnIh67lPYqW4Hpoinu7ZwCsKsPqlwo++Dc7OjThlTR4tOR2CLp8O2zmfjw==
// ==/UserScript==

!function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t){console.log("Hello world")}]);
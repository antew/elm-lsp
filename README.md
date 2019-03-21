# Elm LSP
Language server for Elm with diagnostic support, built on [elm-analyse](https://github.com/stil4m/elm-analyse).

Shown with ALE integration in Vim.

![screenshot](https://user-images.githubusercontent.com/1693421/54731367-46e90580-4b64-11e9-8759-69d0f881b866.png)

[![NPM Version][npm-image]][npm-url]
[![Build Status][travis-image]][travis-url]
[![Downloads Stats][npm-downloads]][npm-url]

## Installation

```sh
npm install -g elm-lsp
```

## Editor Setup

|Editor|What you need|
|---|---|
|Vim|[ALE](https://github.com/w0rp/ale)|

## Project Information
This project aims to become a full-fleged language server over time by building on existing work from the Elm community.  In this initial release all linting support is provided by the excellent [elm-analyse](https://github.com/stil4m/elm-analyse).

## Roadmap
|Feature|Supported|
|---|---|
|Diagnostics|✔️|
|Code completion|❌|
|Hover|❌|
|Jump to definition|❌|
|Workspace symbols|❌|
|Find references|❌|

## Release History

* 1.0.1
    * Fix readme on npm
* 1.0.0
    * Initial release with `elm-analyse` support

## Meta

Distributed under the MIT license. See ``LICENSE`` for more information.

<!-- Markdown link & img dfn's -->
[npm-image]: https://img.shields.io/npm/v/elm-lsp.svg?style=flat-square
[npm-url]: https://npmjs.org/package/elm-lsp
[npm-downloads]: https://img.shields.io/npm/dt/elm-lsp.svg?style=flat-square
[travis-image]: https://img.shields.io/travis/antew/elm-lsp/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/antew/elm-lsp
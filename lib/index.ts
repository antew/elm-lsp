#!/usr/bin/env node

import LSPServer from './language-server';
import * as fs from 'fs';

const packageFileExists = fs.existsSync('./elm.json');
if (!packageFileExists) {
    console.log('There is no elm.json file in this directory. elm-lsp will only work in directories where such a file is located.');
    process.exit(1);
}

const projectFile = JSON.parse(fs.readFileSync('./elm.json').toString());

LSPServer.start(projectFile);
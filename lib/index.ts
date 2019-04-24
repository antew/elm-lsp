#!/usr/bin/env node

import LSPServer from "./language-server";
import * as fs from "fs";
import findUp from "find-up";
import * as path from "path";

const packageFilePath = findUp.sync("elm.json");
if (packageFilePath === null) {
  console.log("Unable to find an elm.json file, elm-lsp will be disabled.");
  throw new Error("Unable to find elm.json");
}

const projectFile = JSON.parse(fs.readFileSync(packageFilePath).toString());
const dirname = path.dirname(packageFilePath);
process.chdir(dirname);

LSPServer.start(projectFile);

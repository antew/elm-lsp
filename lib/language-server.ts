import uri2path from "file-uri-to-path";
import fileUrl from "file-url";
import _ from "lodash";
import * as path from "path";
import {
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  InitializeParams,
  ProposedFeatures,
  TextDocumentChangeEvent,
  TextDocuments,
  TextDocumentSyncKind
} from "vscode-languageserver";
import { ElmApp, Message, LogMessage } from "elm-analyse/ts/domain";
import * as fileLoadingPorts from "elm-analyse/ts/file-loading-ports";
// import * as dependencies from 'elm-analyse/ts/util/dependencies';
import * as dependencies from "elm-analyse/ts/util/dependencies";

const { Elm } = require("elm-analyse/dist/app/backend-elm.js");

// TODO: remove need for this config, the port, format, and open options
// should not be needed.
// elm-format will be needed to implement fixing issues with elm-analyse
const CONFIG = {
  port: 3000,
  elmFormatPath: "elm-format",
  format: "json",
  open: false
};

function start(project: {}) {
  // Disable console logging while in language server mode
  // otherwise in stdio mode we will not be sending valid JSON
  console.log = console.warn = console.error = () => {};

  let connection = createConnection(ProposedFeatures.all);

  run(project, function(elm: ElmApp) {
    let documents: TextDocuments = new TextDocuments();
    let filesWithDiagnostics = new Set();

    documents.listen(connection);
    connection.listen();

    connection.onInitialize((params: InitializeParams) => ({
      capabilities: {
        textDocumentSync: {
          openClose: true,
          willSave: true,
          change: TextDocumentSyncKind.Full
        },
        textDocument: {
          publishDiagnostics: {
            relatedInformation: false
          }
        }
      }
    }));

    // The content of a text document has changed. This event is emitted
    // when the text document first opened or when its content has changed.
    documents.onDidOpen(validateTextDocument);
    documents.onDidChangeContent(validateTextDocument);
    documents.onDidSave(validateTextDocument);

    async function validateTextDocument(change: TextDocumentChangeEvent): Promise<void> {
      elm.ports.fileWatch.send({
        event: "update",
        file: path.relative(process.cwd(), uri2path(change.document.uri)),
        content: change.document.getText()
      });
    }

    function publishDiagnostics(messages: Message[], uri: string) {
      const messagesForFile = messages.filter(m =>
        // Windows paths have a forward slash in the `message.file`, which won't
        // match with the end of the file URI we have from the language server event,
        // so this replaces backslashes before matching to get consistent behavior
        uri.endsWith(m.file.replace("\\", "/"))
      );

      let diagnostics: Diagnostic[] = messagesForFile.map(messageToDiagnostic);
      connection.sendDiagnostics({ uri: uri, diagnostics });
    }

    elm.ports.sendReportValue.subscribe(function(report) {
      // When publishing diagnostics it looks like you have to publish
      // for one URI at a time, so this groups all of the messages for
      // each file and sends them as a batch
      const messagesByFile = _.groupBy(report.messages, "file");
      const filesInReport = new Set(_.map(_.keys(messagesByFile), fileUrl));
      const filesThatAreNowFixed = new Set([...filesWithDiagnostics].filter(uriPath => !filesInReport.has(uriPath)));

      filesWithDiagnostics = filesInReport;

      // We you fix the last error in a file it no longer shows up in the report, but
      // we still need to clear the error marker for it
      filesThatAreNowFixed.forEach(file => publishDiagnostics([], file));
      _.forEach(messagesByFile, (messages, file) => publishDiagnostics(messages, fileUrl(file)));
    });

    elm.ports.log.subscribe((data: LogMessage) => {
      console.log(data.level + ":", data.message);
    });
  });
}

function messageToDiagnostic(message: Message): Diagnostic {
  if (message.type === "FileLoadFailed") {
    return {
      severity: DiagnosticSeverity.Error,
      range: { start: { line: 0, character: 0 }, end: { line: 1, character: 0 } },
      code: "1",
      message: "Error parsing file",
      source: "elm-analyse"
    };
  }

  let [lineStart, colStart, lineEnd, colEnd] = message.data.properties.range;
  const range = {
    start: { line: lineStart - 1, character: colStart - 1 },
    end: { line: lineEnd - 1, character: colEnd - 1 }
  };
  return {
    severity: DiagnosticSeverity.Warning,
    range: range,
    code: message.id,
    // Clean up the error message a bit, removing the end of the line, e.g.
    // "Record has only one field. Use the field's type or introduce a Type. At ((14,5),(14,20))"
    message:
      message.data.description.split(/at .+$/i)[0] +
      "\n" +
      `See https://stil4m.github.io/elm-analyse/#/messages/${message.type}`,
    source: "elm-analyse"
  };
}

function run(project: {}, onload: (app: ElmApp) => void) {
  dependencies.getDependencies(function(registry) {
    const app = Elm.Analyser.init({
      flags: {
        server: false,
        registry: registry || [],
        project: project
      }
    });

    fileLoadingPorts.setup(app, CONFIG, process.cwd());
    onload(app);
  });
}

export default { start };

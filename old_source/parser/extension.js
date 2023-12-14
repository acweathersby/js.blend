"use strict";
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Anthony Weathersby
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
var path = require("path");
var vscode_1 = require("vscode");
var vscode_languageclient_1 = require("vscode-languageclient");
var client;
function activate(context) {
    var serverModule = context.asAbsolutePath(path.join('server/build/library/wick-ls.js')), serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: {
            module: serverModule,
            // Relying on module support provided by node 14.3.*+
            // My current dev node version is 14.6.0
            runtime: "node",
            // Apparently this will only work if piped. IPC does nothing
            transport: vscode_languageclient_1.TransportKind.pipe,
            options: {
                execArgv: ['--nolazy', '--inspect=6009']
            }
        }
    }, 
    // Options to control the language client
    clientOptions = {
        errorHandler: {
            closed: function () {
                return vscode_languageclient_1.CloseAction.Restart;
            },
            error: function (error, message, count) {
                console.log(error, message);
                return vscode_languageclient_1.ErrorAction.Shutdown;
            }
        },
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: "wick-component" }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    // Create and start the language client.
    client = new vscode_languageclient_1.LanguageClient('languageServerExample', 'Language Server Example', serverOptions, clientOptions);
    vscode_1.window.showInformationMessage("Wick Component Language Server started");
    // Start the client. This will also launch the server
    client.start();
}
exports.activate = activate;
function deactivate() {
    if (!client)
        return;
    vscode_1.window.showErrorMessage("Server Stopped");
    return client.stop();
}
exports.deactivate = deactivate;

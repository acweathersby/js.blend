/* --------------------------------------------------------------------------------------------
 * Copyright (c) Anthony Weathersby
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { workspace, ExtensionContext, window } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
    ErrorAction,
    CloseAction
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {

    const

        serverModule = context.asAbsolutePath(path.join('server/build/library/wick-ls.js')),

        serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: {
                module: serverModule,
                // Relying on module support provided by node 14.3.*+
                // My current dev node version is 14.6.0
                runtime: "node",
                // Apparently this will only work if piped. IPC does nothing
                transport: TransportKind.pipe,
                options: {
                    execArgv: ['--nolazy', '--inspect=6009']
                }
            }
        },

        // Options to control the language client
        clientOptions: LanguageClientOptions = {
            errorHandler: {
                closed: function () {
                    return CloseAction.Restart;
                },
                error: function (error, message, count) {
                    console.log(error, message);
                    return ErrorAction.Shutdown;
                }
            },

            // Register the server for plain text documents
            documentSelector: [{ scheme: 'file', language: "wick-component" }],

            synchronize: {
                // Notify the server about file changes to '.clientrc files contained in the workspace
                fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
            }
        };

    // Create and start the language client.
    client = new LanguageClient(
        'languageServerExample',
        'Language Server Example',
        serverOptions,
        clientOptions
    );

    window.showInformationMessage("Wick Component Language Server started");

    // Start the client. This will also launch the server
    client.start();
}

export function deactivate(): Thenable<void> | undefined {

    if (!client) return;

    window.showErrorMessage("Server Stopped");

    return client.stop();
}

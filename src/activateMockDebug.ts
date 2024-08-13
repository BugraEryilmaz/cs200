/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
/*
 * activateMockDebug.ts containes the shared extension code that can be executed both in node.js and the browser.
 */

"use strict";

import * as vscode from "vscode";
import {
  WorkspaceFolder,
  DebugConfiguration,
  ProviderResult,
  CancellationToken,
} from "vscode";

export function activateMockDebug(
  context: vscode.ExtensionContext,
  factory: vscode.DebugAdapterDescriptorFactory
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.cs200.debugEditorContents",
      (resource: vscode.Uri) => {
        let targetResource = resource;
        if (!targetResource && vscode.window.activeTextEditor) {
          targetResource = vscode.window.activeTextEditor.document.uri;
        }
        if (targetResource) {
          vscode.debug.startDebugging(undefined, {
            type: "cs200",
            name: "Debug File",
            request: "launch",
            program: targetResource.fsPath,
            stopOnEntry: true,
          });
        }
      }
    )
  );

  // register a configuration provider for 'mock' debug type
  const provider = new MockConfigurationProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider("cs200", provider)
  );

  // register a dynamic configuration provider for 'mock' debug type
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(
      "cs200",
      {
        provideDebugConfigurations(
          folder: WorkspaceFolder | undefined
        ): ProviderResult<DebugConfiguration[]> {
          return [
            {
              name: "Dynamic Launch",
              request: "launch",
              type: "cs200",
              program: "${file}",
            },
          ];
        },
      },
      vscode.DebugConfigurationProviderTriggerKind.Dynamic
    )
  );

  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory("cs200", factory)
  );
  if ("dispose" in factory && typeof factory.dispose === "function") {
    context.subscriptions.push(
      factory as vscode.DebugAdapterDescriptorFactory & { dispose(): void }
    );
  }
}

class MockConfigurationProvider implements vscode.DebugConfigurationProvider {
  /**
   * Massage a debug configuration just before a debug session is being launched,
   * e.g. add all missing attributes to the debug configuration.
   */
  resolveDebugConfiguration(
    folder: WorkspaceFolder | undefined,
    config: DebugConfiguration,
    token?: CancellationToken
  ): ProviderResult<DebugConfiguration> {
    // if launch.json is missing or empty
    if (!config.type && !config.request && !config.name) {
      const editor = vscode.window.activeTextEditor;
      if (
        editor &&
        (editor.document.languageId === "riscv" ||
          editor.document.languageId === "assembly" ||
          editor.document.languageId === "verilog" ||
          editor.document.languageId === "system verilog")
      ) {
        config.type = "cs200";
        config.name = "Launch";
        config.request = "launch";
        config.program = "${file}";
        config.stopOnEntry = true;
      }
    }

    if (!config.program) {
      return vscode.window
        .showInformationMessage("Cannot find a program to debug")
        .then((_) => {
          return undefined; // abort launch
        });
    }

    return config;
  }
}

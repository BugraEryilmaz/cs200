import * as vscode from "vscode";
import { WebViewPanel } from "./WebView";
import { Terminal } from "./terminal";
import { WebViewPanelProvider } from "./sidebarprovider";

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "cs200" is now active!');

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "cs200-sidebar",
      new WebViewPanelProvider(context.extensionUri)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cs200.helloWorld", () => {
      WebViewPanel.createOrShow(context.extensionUri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("cs200.runCommand", () => {
      console.log("Running command");
      const terminal = new Terminal(showInformationMessage);
    })
  );
}

function showInformationMessage(message: any) {}

// This method is called when your extension is deactivated
export function deactivate() {}

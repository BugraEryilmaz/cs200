import * as vscode from "vscode";
import { WebViewPanel } from "./WebView";
import { activateMockDebug } from "./activateMockDebug";
import { ProviderResult } from "vscode";
import * as cp from "child_process";

const runMode: "external" | "server" | "namedPipeServer" | "inline" = "inline";

let cs200Panel: vscode.WebviewPanel;

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "cs200" is now active!');

  vscode.debug.onDidStartDebugSession((e) => {
    console.log("Debug session started");
    vscode.commands.executeCommand("cs200.helloWorld");
    WebViewPanel.clearCallbacks();
    WebViewPanel.addCallback((message: any) => {
      if (message.command === "updateInput") {
        console.log("Sending message: ", message);
        e.customRequest("updateInput", message.arguments);
      }
    });
  });

  vscode.debug.onDidTerminateDebugSession((e) => {
    console.log("Debug session terminated");
    if (WebViewPanel.currentPanel) {
      WebViewPanel.currentPanel.dispose();
    }
  });

  vscode.debug.onDidReceiveDebugSessionCustomEvent((e) => {
    console.log("Custom event received: ", e);
    if (e.event === "boardUpdate") {
      console.log("Board update event");
      if (WebViewPanel.currentPanel !== undefined) {
        WebViewPanel.currentPanel._panel.webview.postMessage({
          type: "boardUpdate",
          body: e.body,
        });
      }
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("cs200.helloWorld", () => {
      WebViewPanel.createOrShow(context.extensionUri);
    })
  );

  activateMockDebug(context, new DebugAdapterExecutableFactory());
}

function showInformationMessage(message: any) { }

// This method is called when your extension is deactivated
export function deactivate() { }

class DebugAdapterExecutableFactory
  implements vscode.DebugAdapterDescriptorFactory {
  // The following use of a DebugAdapter factory shows how to control what debug adapter executable is used.
  // Since the code implements the default behavior, it is absolutely not neccessary and we show it here only for educational purpose.

  async createDebugAdapterDescriptor(
    _session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined
  ): Promise<vscode.DebugAdapterDescriptor | null | undefined> {
    // param "executable" contains the executable optionally specified in the package.json (if any)

    // Compile the program
    console.log("Program: ", _session.configuration.program);
    await compileFile(_session.configuration.program);
    
    // Check Vtb executable on each workspace folder
    if (!executable) {
      for (const folder of vscode.workspace.workspaceFolders || []) {
        const executablePath = folder.uri.fsPath + "/Vtb";
        if (require("fs").existsSync(executablePath)) {
          executable = new vscode.DebugAdapterExecutable(
            executablePath,
            [_session.configuration.program]
          );
          break;
        }
      } 
    }
    if (!executable) {
      vscode.window.showErrorMessage("Vtb executable not found on the workspace folders");
      return undefined;
    }
    console.log("Executable: ", executable);

    // make VS Code launch the DA executable
    return executable;
  }
}


function compileFile(filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // strip the basename of the file
    const basename = filePath.split("/").pop();
    // strip the extension of the file
    const name = basename?.split(".").shift();
    // get the directory of the file
    const dir = filePath.split("/").slice(0, -1).join("/");

    cp.exec(`make clean`, { cwd: dir }, (error, stdout, stderr) => {
      if (error) {
        vscode.window.showErrorMessage(`Compilation error: ${stderr}`);
        reject(error);
      } else {
        cp.exec(`make build_${name}`, { cwd: dir }, (error, stdout, stderr) => {
          if (error) {
            vscode.window.showErrorMessage(`Compilation error: ${stderr}`);
            reject(error);
          } else {
            resolve();
          }
        });
      }
    });
  });
}
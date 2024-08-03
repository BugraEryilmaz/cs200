import * as vscode from "vscode";
import { WebViewPanel } from "./WebView";
import { activateMockDebug } from "./activateMockDebug";
import { existsSync } from "fs";
import * as cp from "child_process";

let output = vscode.window.createOutputChannel("CS200");

export function activate(context: vscode.ExtensionContext) {
  output.appendLine('Congratulations, your extension "cs200" is now active!');

  vscode.debug.onDidStartDebugSession((e) => {
    output.appendLine("Debug session started");
    vscode.commands.executeCommand("cs200.helloWorld");
    WebViewPanel.clearCallbacks();
    WebViewPanel.addCallback((message: any) => {
      if (message.command === "updateInput") {
        output.appendLine("Sending message: " + JSON.stringify(message));
        e.customRequest("updateInput", message.arguments);
      }
    });
  });

  vscode.debug.onDidTerminateDebugSession((e) => {
    output.appendLine("Debug session terminated");
    if (WebViewPanel.currentPanel) {
      WebViewPanel.currentPanel.dispose();
    }
  });

  vscode.debug.onDidReceiveDebugSessionCustomEvent((e) => {
    output.appendLine("Custom event received: " + JSON.stringify(e));
    if (e.event === "boardUpdate") {
      output.appendLine("Board update event");
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

// This method is called when your extension is deactivated
export function deactivate() {}

class DebugAdapterExecutableFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  // The following use of a DebugAdapter factory shows how to control what debug adapter executable is used.
  // Since the code implements the default behavior, it is absolutely not neccessary and we show it here only for educational purpose.

  async createDebugAdapterDescriptor(
    _session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined
  ): Promise<vscode.DebugAdapterDescriptor | null | undefined> {
    // param "executable" contains the executable optionally specified in the package.json (if any)

    // Compile the program
    output.appendLine("Program: " + _session.configuration.program);
    await compileFile(_session.configuration.program);

    const args = _session.configuration.trace
      ? [_session.configuration.program]
      : [];

    const dir = _session.configuration.program
      .split("/")
      .slice(0, -1)
      .join("/");

    // Check Vtb executable on the program folder
    if (!executable) {
      const executablePath = dir + "/Vtb";
      output.appendLine("Checking: " + executablePath + " ");
      if (existsSync(executablePath)) {
        output.appendLine("Executable found: " + executablePath);
        executable = new vscode.DebugAdapterExecutable(executablePath, args);
      }
    }
    // Check Vtb executable on each workspace folder
    if (!executable) {
      for (const folder of vscode.workspace.workspaceFolders || []) {
        const executablePath = folder.uri.fsPath + "/Vtb";
        output.appendLine("Checking: " + executablePath);
        if (existsSync(executablePath)) {
          output.appendLine("Executable found: " + executablePath);
          executable = new vscode.DebugAdapterExecutable(executablePath, args);
          break;
        }
      }
    }
    if (!executable) {
      vscode.window.showErrorMessage(
        "Vtb executable not found on the workspace folders"
      );
      return undefined;
    }
    output.appendLine("Executable: " + JSON.stringify(executable));

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

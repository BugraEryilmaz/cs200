import * as vscode from "vscode";
import { WebViewPanel } from "./WebView";
import { Terminal } from "./terminal";
import { WebViewPanelProvider } from "./sidebarprovider";
import { activateMockDebug } from "./activateMockDebug";
import { ProviderResult } from "vscode";

const runMode: "external" | "server" | "namedPipeServer" | "inline" = "inline";

let cs200Panel: vscode.WebviewPanel;

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

  activateMockDebug(context, new DebugAdapterExecutableFactory());
}

function showInformationMessage(message: any) {}

// This method is called when your extension is deactivated
export function deactivate() {}

class DebugAdapterExecutableFactory
  implements vscode.DebugAdapterDescriptorFactory
{
  // The following use of a DebugAdapter factory shows how to control what debug adapter executable is used.
  // Since the code implements the default behavior, it is absolutely not neccessary and we show it here only for educational purpose.

  createDebugAdapterDescriptor(
    _session: vscode.DebugSession,
    executable: vscode.DebugAdapterExecutable | undefined
  ): ProviderResult<vscode.DebugAdapterDescriptor> {
    // param "executable" contains the executable optionally specified in the package.json (if any)

    // use the executable specified in the package.json if it exists or determine it based on some other information (e.g. the session)
    const command =
      "/home/bugra/ders/PhD/cs200-ta/gitlabCS200/src/DebugAdapter/out/obj_dir/Vtb";
    const args: string[] | undefined = [];
    const options = {};
    executable = new vscode.DebugAdapterExecutable(command, args, options);
    console.log("Executable: ", executable);

    // make VS Code launch the DA executable
    return executable;
  }
}

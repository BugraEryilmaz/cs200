import { ChildProcessWithoutNullStreams, spawn } from "child_process";
import * as vscode from "vscode";

export class Terminal {
  terminal: ChildProcessWithoutNullStreams;
  dummyterminaloutput: number = 0;
  callback: (data: any) => void;

  constructor(callback: (data: any) => void) {
    this.callback = callback;
    const terminal = spawn("python3", ["verilator.py"], {
      cwd: vscode.workspace.workspaceFolders![0].uri.fsPath,
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    console.log("Terminal created");
    terminal.on("error", (err) => {
      console.log(err);
      vscode.window.showErrorMessage(err.message);
    });
    terminal.stdout.on("data", (data) => {
      const jsdata = JSON.parse(data.toString());
      callback(jsdata);
      for (const key in jsdata) {
        console.log(key, jsdata[key]);
      }
    });
    terminal.stderr.on("data", (data) => {
      console.log(data.toString());
      vscode.window.showErrorMessage(data.toString());
    });
    terminal.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
    });
    console.log("Data listeners added");
    this.terminal = terminal;
  }

  write(data: string) {
    console.log("Writing to terminal: ", data);
    this.terminal.stdin.write(data + "\n");
  }

  dispose() {
    this.terminal.stdin.end();
  }
}

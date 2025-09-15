import * as assert from "assert";
import * as vscode from "vscode";

suite("Dev Code Memory Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("La extensión se activa", async () => {
    const ext = vscode.extensions.getExtension("SerenoDevs.dev-code-memory");
    await ext?.activate();
    assert.ok(ext?.isActive, "La extensión debería estar activa");
  });

  test("Comando addSnippet está registrado", async () => {
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(
      cmds.includes("dev-code-memory.addSnippet"),
      "El comando addSnippet debería estar registrado"
    );
  });

  test("Comando insertSnippet está registrado", async () => {
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(
      cmds.includes("dev-code-memory.insertSnippet"),
      "El comando insertSnippet debería estar registrado"
    );
  });
});
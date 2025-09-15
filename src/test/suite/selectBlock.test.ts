import * as assert from "assert";
import * as vscode from "vscode";

suite("Select Block Command", () => {
  test("El comando selectBlock está registrado", async () => {
    const ext = vscode.extensions.getExtension("SerenoDevs.dev-code-memory");
    await ext?.activate(); // activar primero
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(
      cmds.includes("dev-code-memory.selectBlock"),
      "El comando selectBlock debería estar registrado"
    );
  });

  test("Selecciona el bloque de llaves", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "function demo() { let x = 1; }",
      language: "javascript",
    });
    const editor = await vscode.window.showTextDocument(doc);

    editor.selection = new vscode.Selection(doc.positionAt(16), doc.positionAt(16));

    await vscode.commands.executeCommand("dev-code-memory.selectBlock");

    assert.ok(
      !editor.selection.isEmpty,
      "La selección debería expandirse al bloque"
    );
  });
});
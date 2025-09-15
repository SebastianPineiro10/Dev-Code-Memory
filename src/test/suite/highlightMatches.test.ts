import * as assert from "assert";
import * as vscode from "vscode";

suite("Highlight Matches Command", () => {
  test("El comando highlightMatches está registrado", async () => {
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(
      cmds.includes("dev-code-memory.highlightMatches"),
      "El comando highlightMatches debería estar registrado"
    );
  });

  test("Resalta coincidencias de un texto", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "uno dos uno dos uno",
      language: "plaintext",
    });
    const editor = await vscode.window.showTextDocument(doc);

    editor.selection = new vscode.Selection(
      doc.positionAt(0),
      doc.positionAt(3) // "uno"
    );

    (vscode.window.showQuickPick as any) = async () =>
      "Coincidencia exacta (sensible a mayúsculas)";

    await vscode.commands.executeCommand("dev-code-memory.highlightMatches");

    assert.ok(
      editor.selections.length > 1,
      "Debería haber resaltado varias coincidencias"
    );
  });
});
import * as assert from "assert";
import * as vscode from "vscode";

suite("Replace Matches Command", () => {
  test("El comando replaceMatches está registrado", async () => {
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(
      cmds.includes("dev-code-memory.replaceMatches"),
      "El comando replaceMatches debería estar registrado"
    );
  });

  test("Reemplaza coincidencias en el documento", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: "<h1>Título</h1>",
      language: "html",
    });
    const editor = await vscode.window.showTextDocument(doc);

    editor.selection = new vscode.Selection(
      doc.positionAt(1),
      doc.positionAt(3) // "h1"
    );

    (vscode.window.showQuickPick as any) = async (opts: any) => {
      if (opts.placeHolder?.includes("Reemplazar")) return "Reemplazar todo";
      if (opts.placeHolder?.includes("palabra completa")) return "Sí";
      if (opts.placeHolder?.includes("Ignorar")) return "No";
      return "Reemplazar todo";
    };

    (vscode.window.showInputBox as any) = async () => "h2";

    await vscode.commands.executeCommand("dev-code-memory.replaceMatches");

    const newText = doc.getText();
    assert.ok(newText.includes("<h2>"), "Debería haber reemplazado h1 por h2");
  });
});
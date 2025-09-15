import * as assert from "assert";
import * as vscode from "vscode";

suite("Goto Matching Command", () => {
  test("El comando gotoMatching está registrado", async () => {
    const ext = vscode.extensions.getExtension("SerenoDevs.dev-code-memory");
    await ext?.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("dev-code-memory.gotoMatching"),
      "El comando gotoMatching no está registrado"
    );
  });

  test("Salta entre etiquetas HTML (toggle inicio <-> fin)", async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: `<div>\n  <span>Hola</span>\n</div>`,
      language: "html",
    });
    const editor = await vscode.window.showTextDocument(doc);

    // Cursor dentro del <div>, no en la primera columna
    const insideOpenDiv = new vscode.Position(0, 1);
    editor.selection = new vscode.Selection(insideOpenDiv, insideOpenDiv);

    // Posiciones esperadas
    const text = doc.getText();
    const openStartIdx = text.indexOf("<div>");
    const closeStartIdx = text.indexOf("</div>");
    const closeEndIdx = closeStartIdx + "</div>".length;

    const openStartPos = doc.positionAt(openStartIdx);
    const closeEndPos = doc.positionAt(closeEndIdx);

    // 1er salto: al inicio del <div> (porque no estábamos exactamente en range.start)
    await vscode.commands.executeCommand("dev-code-memory.gotoMatching");
    let newPos = editor.selection.active;
    assert.strictEqual(newPos.line, openStartPos.line, "El primer salto no fue al inicio del <div> (línea)");
    assert.strictEqual(newPos.character, openStartPos.character, "El primer salto no fue al inicio del <div> (columna)");

    // 2do salto: ahora sí al final del </div> (posicionado después de >)
    await vscode.commands.executeCommand("dev-code-memory.gotoMatching");
    newPos = editor.selection.active;
    assert.strictEqual(newPos.line, closeEndPos.line, "El segundo salto no fue al final del </div> (línea)");
    assert.strictEqual(newPos.character, closeEndPos.character, "El segundo salto no fue al final del </div> (columna)");
  });
});
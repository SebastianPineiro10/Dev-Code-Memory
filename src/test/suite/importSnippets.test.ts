import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

suite("Import Snippets Command", () => {
  // usar la misma ruta que la extensión
  const snippetsFile = path.resolve(__dirname, "../../../snippets.json");
  const importFile = path.join(__dirname, "toImport.json");

  test("El comando importSnippets está registrado", async () => {
    const ext = vscode.extensions.getExtension("SerenoDevs.dev-code-memory");
    await ext?.activate();
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(
      cmds.includes("dev-code-memory.importSnippets"),
      "El comando importSnippets debería estar registrado"
    );
  });

  test("Importa snippets desde un archivo JSON válido", async () => {
    const snippet = {
      id: "test-123",
      name: "saludo",
      category: "test",
      language: "javascript",
      content: "console.log('Hola importado');",
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(importFile, JSON.stringify([snippet], null, 2));

    // limpiar antes
    fs.writeFileSync(snippetsFile, "[]");

    // mock de diálogo
    (vscode.window.showOpenDialog as any) = async () => [{ fsPath: importFile }];

    await vscode.commands.executeCommand("dev-code-memory.importSnippets");

    const imported = JSON.parse(fs.readFileSync(snippetsFile, "utf-8"));
    assert.ok(imported.length > 0, "Se deberían haber importado snippets");
    assert.strictEqual(imported[0].name, "saludo");
    assert.ok(imported[0].content.includes("Hola importado"));
  });
});
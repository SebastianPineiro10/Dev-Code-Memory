import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

suite("Export Snippets Command", () => {
  test("El comando exportSnippets está registrado", async () => {
    const ext = vscode.extensions.getExtension("SerenoDevs.dev-code-memory");
    await ext?.activate();

    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes("dev-code-memory.exportSnippets"),
      "El comando exportSnippets no está registrado"
    );
  });

  test("Exporta snippets a un archivo JSON", async () => {
    const ext = vscode.extensions.getExtension("SerenoDevs.dev-code-memory");
    await ext?.activate();
    assert.ok(ext, "No se obtuvo la extensión");

    // Escribe en el MISMO snippets.json que usa la extensión
    const snippetsFile = path.join(ext!.extensionPath, "snippets.json");

    const snippet = {
      id: "1",
      name: "h1",
      category: "html",
      language: "html",
      content: "<h1>saludo</h1>",
      createdAt: new Date().toISOString(),
    };
    await fs.promises.writeFile(snippetsFile, JSON.stringify([snippet], null, 2), "utf-8");

    // Archivo de exportación temporal
    const exportPath = path.join(__dirname, "exported.json");
    try { await fs.promises.unlink(exportPath); } catch {}

    const uri = vscode.Uri.file(exportPath);

    // Mock seguro de showSaveDialog SIN errores de tipado y restauración posterior
    const originalShowSaveDialog = vscode.window.showSaveDialog;
    Object.defineProperty(vscode.window, "showSaveDialog", {
      value: async () => uri,
      configurable: true,
      writable: true,
    });

    try {
      await vscode.commands.executeCommand("dev-code-memory.exportSnippets");
    } finally {
      // Restaurar el método original
      Object.defineProperty(vscode.window, "showSaveDialog", {
        value: originalShowSaveDialog,
        configurable: true,
        writable: true,
      });
    }

    // Verificar exportación
    assert.ok(fs.existsSync(exportPath), "El archivo exportado no existe");
    const exported = JSON.parse(await fs.promises.readFile(exportPath, "utf-8"));

    assert.strictEqual(exported[0].name, "h1", "El snippet exportado debería tener el nombre 'h1'");
    assert.strictEqual(exported[0].content, "<h1>saludo</h1>");
  });
});
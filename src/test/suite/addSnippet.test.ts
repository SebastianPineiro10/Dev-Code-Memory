import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

suite("Add Snippet Command", () => {
  const snippetsFile = path.resolve(__dirname, "../../../snippets.json");

  test("El comando addSnippet está registrado", async () => {
    const ext = vscode.extensions.getExtension("SerenoDevs.dev-code-memory");
    await ext?.activate();
    const cmds = await vscode.commands.getCommands(true);
    assert.ok(
      cmds.includes("dev-code-memory.addSnippet"),
      "El comando addSnippet debería estar registrado"
    );
  });

  test("Agrega un snippet nuevo", async () => {
    fs.writeFileSync(snippetsFile, "[]");

    // mockear activeTextEditor con defineProperty
    Object.defineProperty(vscode.window, "activeTextEditor", {
      value: {
        document: {
          getText: () => "console.log('demo')",
          languageId: "javascript",
        },
        selection: { isEmpty: false },
        edit: async (cb: any) => {
          cb({ replace: () => {} });
          return true;
        },
      },
    });

    // mock de inputs
    (vscode.window.showInputBox as any) = async ({ placeHolder }: any) => {
      if (placeHolder.includes("Nombre")) return "demoSnippet";
      if (placeHolder.includes("Categoría")) return "test";
      return "console.log('demo')";
    };

    await vscode.commands.executeCommand("dev-code-memory.addSnippet");

    const imported = JSON.parse(fs.readFileSync(snippetsFile, "utf-8"));
    assert.ok(imported.length > 0, "Se debería haber agregado un snippet");
    assert.strictEqual(imported[0].name, "demoSnippet");
  });
});
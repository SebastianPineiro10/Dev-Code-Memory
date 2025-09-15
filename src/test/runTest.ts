import * as path from "path";
import { runTests } from "@vscode/test-electron";

async function main() {
  try {
    // Carpeta raíz de la extensión
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // Carpeta de tests
    const extensionTestsPath = path.resolve(__dirname, "./suite");

    // Ejecutar VS Code con los tests
    await runTests({ extensionDevelopmentPath, extensionTestsPath });
  } catch (err) {
    console.error("Failed to run tests", err);
    process.exit(1);
  }
}

main();
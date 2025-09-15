// src/test/suite/index.ts
//
// Punto de entrada para que VS Code cargue todos los tests
// usando Mocha + glob

import * as path from "path";
import Mocha from "mocha"; // 👈 Import default, así sí funciona el new Mocha()
import { glob } from "glob"; // 👈 glob moderno exporta glob como función nombrada

export async function run(): Promise<void> {
  // Crear instancia de Mocha
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
  });

  const testsRoot = path.resolve(__dirname);

  // Buscar todos los archivos *.test.js dentro de la carpeta suite
  const files: string[] = await glob("**/*.test.js", { cwd: testsRoot });

  // Agregar cada archivo a mocha
  files.forEach((f: string) => {
    mocha.addFile(path.resolve(testsRoot, f));
  });

  // Ejecutar los tests
  return new Promise((resolve, reject) => {
    try {
      mocha.run((failures: number) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
        } else {
          resolve();
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
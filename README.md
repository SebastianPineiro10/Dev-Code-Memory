# Dev Code Memory

ES
Guarda, organiza e inserta fragmentos de código en múltiples lenguajes 🚀

EN
Save, organize, and insert code snippets in multiple languages 🚀

![Demo](media/dev-code-memory.gif)

## Overview / Descripción

EN
Dev Code Memory is a Visual Studio Code extension that allows you to save, organize, and insert code snippets automatically.
Snippets are stored in a collection-like JSON structure (Mongo-style) with fields (id, name, category, language, content, createdAt), ensuring robustness and compatibility with any language detected by VS Code.
It also provides advanced search, replace, and navigation tools that VS Code does not natively cover.

ES
Dev Code Memory es una extensión para Visual Studio Code que te permite guardar, organizar e insertar fragmentos de código automáticamente.
Los fragmentos se almacenan en una estructura tipo colección (Mongo-like) en JSON, con campos (id, name, category, language, content, createdAt), lo que garantiza robustez y compatibilidad con cualquier lenguaje detectado por VS Code.
Además, ofrece herramientas avanzadas de búsqueda, reemplazo y navegación que VS Code no cubre de forma nativa.


## Features / Características

EN
	•	Automatic Snippet Capture: Save selected code directly from the editor.
	•	Mongo-like Data Model: Each snippet is stored as a structured document with UUID and metadata.
	•	Robust Local Storage: File I/O with concurrency lock and safe writes (.tmp fallback).
	•	Overwrite Protection: Confirms before replacing existing snippets.
	•	Quick Insertion: Insert snippets in just two steps, filtered by language.
	•	Import/Export: Backup and restore your snippet collections.
	•	Highlight Matches: Find and highlight multiple occurrences with 4 precision modes.
	•	Smart Replace: Replace all or review one by one (supports plain text and HTML/XML tags).
	•	Block/Tag Navigation: Jump to matching {}, [], (), or paired HTML tags.
	•	Keyboard Shortcuts:
	•	Add snippet → Ctrl+Alt+D (Win/Linux) / Cmd+Alt+D (macOS)
	•	Insert snippet → Ctrl+Alt+P (Win/Linux) / Cmd+Alt+P (macOS)

ES
	•	Captura Automática de Fragmentos: Guarda directamente el código seleccionado en el editor.
	•	Modelo de Datos Mongo-like: Cada fragmento se guarda como documento estructurado con UUID y metadatos.
	•	Almacenamiento Local Robusto: Escritura de archivos con lock de concurrencia y fallback seguro (.tmp).
	•	Protección contra Sobrescritura: Confirma antes de reemplazar fragmentos existentes.
	•	Inserción Rápida: Inserta fragmentos en solo dos pasos, filtrados por lenguaje.
	•	Importar/Exportar: Respaldar y restaurar colecciones de fragmentos.
	•	Resaltado de Coincidencias: Encuentra y resalta múltiples ocurrencias con 4 modos de precisión.
	•	Reemplazo Inteligente: Reemplaza todo o revisa uno por uno (compatible con texto y etiquetas HTML/XML).
	•	Navegación de Bloques/Etiquetas: Salta entre pares {}, [], () o etiquetas HTML emparejadas.
	•	Atajos de Teclado:
	•	Agregar fragmento → Ctrl+Alt+D (Win/Linux) / Cmd+Alt+D (macOS).
	•	Insertar fragmento → Ctrl+Alt+P (Win/Linux) / Cmd+Alt+P (macOS).
	

## Example Snippet / Ejemplo de Fragmento

```json
{
  "id": "a1b2c3d4",
  "name": "HelloWorldJS",
  "category": "JavaScript",
  "language": "javascript",
  "content": "console.log('Hello, world!');",
  "createdAt": "2025-09-15T12:34:56.789Z"
}
```

## Installation / Instalación

EN
	1.	Open Visual Studio Code.
	2.	Go to Extensions (Ctrl+Shift+X).
	3.	Search for Dev Code Memory.
	4.	Install and reload VS Code.

ES
	1.	Abre Visual Studio Code.
	2.	Ve a Extensiones (Ctrl+Shift+X).
	3.	Busca Dev Code Memory.
	4.	Instálala y recarga VS Code.



## Usage / Uso

EN
	•	Save a snippet: Select the code and press Ctrl+Alt+D (or Cmd+Alt+D). Enter a name when prompted.
	•	Insert a snippet: Use Ctrl+Alt+P (or Cmd+Alt+P), select from the list, and the code will be inserted.
	•	Highlight matches: Select text → Run Dev Code Memory: Highlight Matches → choose search mode.
	•	Replace matches: Select text or a tag → Run Dev Code Memory: Replace Matches → choose “All” or “One by one”.
	•	Select block/tag: Place cursor inside {} or <tag> → Run Dev Code Memory: Select Block.
	•	Goto matching: Place cursor inside {} or <tag> → Run Dev Code Memory: Goto Matching.

ES
	•	Guardar un fragmento: Selecciona el código y presiona Ctrl+Alt+D (o Cmd+Alt+D). Escribe un nombre cuando se te pida.
	•	Insertar un fragmento: Usa Ctrl+Alt+P (o Cmd+Alt+P), elige de la lista, y el código será insertado.
	•	Resaltar coincidencias: Selecciona texto → Ejecuta Dev Code Memory: Highlight Matches → elige el modo de búsqueda.
	•	Reemplazar coincidencias: Selecciona texto o etiqueta → Ejecuta Dev Code Memory: Replace Matches → elige “Todo” o “Uno por uno”.
	•	Seleccionar bloque/etiqueta: Pon el cursor dentro de {} o <tag> → Ejecuta Dev Code Memory: Select Block.
	•	Ir a la pareja: Pon el cursor dentro de {} o <tag> → Ejecuta Dev Code Memory: Goto Matching.

	

### Extra Keyboard Shortcuts

EN
- Highlight matches → Ctrl+Alt+H (Win/Linux) / Cmd+Alt+H (macOS).
- Replace matches → Ctrl+Alt+R (Win/Linux) / Cmd+Alt+R (macOS).
- Select block → Ctrl+Alt+B (Win/Linux) / Cmd+Alt+B (macOS).
- Goto matching → Ctrl+Alt+M (Win/Linux) / Cmd+Alt+M (macOS).

ES
- Resaltar coincidencias → Ctrl+Alt+H (Win/Linux) / Cmd+Alt+H (macOS)
- Reemplazar coincidencias → Ctrl+Alt+R (Win/Linux) / Cmd+Alt+R (macOS).
- Seleccionar bloque → Ctrl+Alt+B (Win/Linux) / Cmd+Alt+B (macOS).
- Ir a la pareja → Ctrl+Alt+M (Win/Linux) / Cmd+Alt+M (macOS).




## Requirements / Requisitos

EN
	•	Visual Studio Code version 1.103.0 or higher.

ES
	•	Visual Studio Code versión 1.103.0 o superior.



## Known Issues / Problemas Conocidos

EN
	•	Snippets are stored locally in snippets.json. Synchronization between machines is not yet available.

ES
	•	Los fragmentos se almacenan localmente en snippets.json. Aún no existe sincronización entre máquinas.



## Roadmap / Hoja de Ruta

EN (planned for v5)
	•	Cloud synchronization.
	•	Team sharing of snippets.
	•	Advanced search with tags and multi-channel navigation.

ES (planeado para v5)
	•	Sincronización en la nube.
	•	Compartir fragmentos con equipos.
	•	Búsqueda avanzada con etiquetas y navegación multicanal.



## Release Notes / Notas de Versión

0.0.1
	•	EN Initial release: save, organize, and insert snippets.
	•	ES Versión inicial: guardar, organizar e insertar fragmentos.

0.0.4 (Enterprise Refactor — Bulletproof)
	•	EN Added highlight matches (4 modes), robust replace (tags + text), block/tag navigation, and file I/O with lock system.
	•	ES Agregado resaltado de coincidencias (4 modos), reemplazo robusto (etiquetas + texto), navegación de bloques/etiquetas y sistema de archivo con bloqueo.


## License / Licencia

EN
Proprietary — All rights reserved.
This extension and its source code are the intellectual property of Sebastian Piñeiro Madero (SerenoDevs).
Unauthorized copying, modification, redistribution, or commercial use is strictly prohibited without prior written permission.

ES
Propietaria — Todos los derechos reservados.
Esta extensión y su código fuente son propiedad intelectual de Sebastian Piñeiro Madero (SerenoDevs).
La copia, modificación, redistribución o uso comercial no autorizado están estrictamente prohibidos sin permiso previo por escrito.


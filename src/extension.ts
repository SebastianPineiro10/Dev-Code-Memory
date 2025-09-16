// ============================
// Dev Code Memory — VS Code Extension (Enterprise Refactor - v4 Bulletproof)
// Autor: Sebastian Piñeiro Madero
// Licencia: PROPIETARIA — TODOS LOS DERECHOS RESERVADOS
// Descripción: Snippets con estructura tipo colección (Mongo-like),
//              soporta cualquier lenguaje detectado por VS Code,
//              con exportación/importación, búsqueda/reemplazo exacto,
//              selección de bloques y salto a pareja.
// ============================

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

// -----------------------------
// Config & Debug
// -----------------------------
const DEBUG = false;
function log(...args: any[]) {
  if (DEBUG) {console.log("[DevCodeMemory]", ...args);}
}

// -----------------------------
// 1) ARCHIVO LOCAL (E/S ROBUSTA)
// -----------------------------
let SNIPPETS_FILE: string;
let TMP_FILE: string;

// Mutex simple para evitar condiciones de carrera
let ioLock: Promise<void> = Promise.resolve();

function withIOLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = ioLock.then(fn, fn);
  ioLock = next.then(() => undefined, () => undefined);
  return next;
}

async function ensureFile(): Promise<void> {
  await fs.promises.mkdir(path.dirname(SNIPPETS_FILE), { recursive: true });
  try {
    await fs.promises.access(SNIPPETS_FILE, fs.constants.F_OK);
  } catch {
    await fs.promises.writeFile(SNIPPETS_FILE, "[]", "utf-8");
  }
}

interface SnippetDoc {
  id: string;
  name: string;
  category: string;
  language: string;
  content: string;
  createdAt: string;
}

function isSnippetDoc(obj: any): obj is SnippetDoc {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.name === "string" &&
    typeof obj.category === "string" &&
    typeof obj.language === "string" &&
    typeof obj.content === "string" &&
    typeof obj.createdAt === "string"
  );
}

async function loadSnippets(): Promise<SnippetDoc[]> {
  return withIOLock(async () => {
    await ensureFile();
    try {
      const raw = await fs.promises.readFile(SNIPPETS_FILE, "utf-8");
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.every(isSnippetDoc)) {
        log("Archivo de snippets con formato inesperado.");
        return [];
      }
      return arr as SnippetDoc[];
    } catch (err) {
      log("loadSnippets error:", err);
      return [];
    }
  });
}

async function saveSnippets(snippets: SnippetDoc[]): Promise<void> {
  return withIOLock(async () => {
    const data = JSON.stringify(snippets, null, 2);
    await fs.promises.writeFile(TMP_FILE, data, "utf-8");
    try {
      await fs.promises.rename(TMP_FILE, SNIPPETS_FILE);
      vscode.window.setStatusBarMessage("Snippets guardados.", 3000);
    } catch (err) {
      log("rename failed, fallback copy:", err);
      await fs.promises.copyFile(TMP_FILE, SNIPPETS_FILE);
      await fs.promises.unlink(TMP_FILE).catch(() => {});
      vscode.window.setStatusBarMessage("Error al guardar snippets, respaldo aplicado.", 5000);
    }
  });
}

// -----------------------------
// 2) UTILIDADES
// -----------------------------
function suggestName(content: string): string {
  const clean = content.replace(/[\r\n]+/g, " ").trim();
  if (!clean) {return "snippet";}
  if (clean.startsWith("<")) {
    const m = clean.match(/^<\s*([a-zA-Z0-9:-]+)/);
    if (m) {return m[1];}
  }
  const mf = clean.match(/function\s+([a-zA-Z0-9_]+)/);
  if (mf) {return mf[1];}
  return clean.split(/\s+/).slice(0, 3).join("_").slice(0, 40);
}

async function resolveLanguageId(doc: vscode.TextDocument): Promise<string> {
  const langId = doc.languageId;
  if (langId && langId !== "plaintext") {return langId;}
  const picked = await vscode.window.showInputBox({
    placeHolder: "Documento 'plaintext'. Ingresa languageId (ej: javascript, python, html, sql...)",
    validateInput: (v) => (v.trim().length === 0 ? "Requerido" : undefined),
  });
  return (picked || "plaintext").trim();
}

function rangesFromIndices(doc: vscode.TextDocument, indices: number[], len: number): vscode.Range[] {
  return indices.map((i) => new vscode.Range(doc.positionAt(i), doc.positionAt(i + len)));
}

function collectPlainRanges(
  text: string,
  needle: string,
  wholeWord: boolean,
  caseInsensitive: boolean,
  highlightFullWord: boolean
): Array<{ start: number; end: number }> {
  const out: Array<{ start: number; end: number }> = [];
  if (!needle) {return out;}

  const haystack = caseInsensitive ? text.toLowerCase() : text;
  const query = caseInsensitive ? needle.toLowerCase() : needle;

  let pos = 0;
  while (true) {
    const i = haystack.indexOf(query, pos);
    if (i === -1) {break;}

    const leftOk = !wholeWord || i === 0 || !/\w/.test(text[i - 1]);
    const rightOk = !wholeWord || i + needle.length === text.length || !/\w/.test(text[i + needle.length]);

    if (leftOk && rightOk) {
        if (highlightFullWord) {
            let wordStart = i;
            while (wordStart > 0 && /\w/.test(text[wordStart - 1])) {
                wordStart--;
            }
            let wordEnd = i + needle.length;
            while (wordEnd < text.length && /\w/.test(text[wordEnd])) {
                wordEnd++;
            }
            out.push({ start: wordStart, end: wordEnd });
        } else {
            out.push({ start: i, end: i + needle.length });
        }
    }
    pos = i + needle.length;
  }
  return out;
}

// -----------------------------
// 3) COMANDOS SNIPPETS
// -----------------------------
async function cmdAddSnippet() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {return;}

  const doc = editor.document;
  let content = doc.getText(editor.selection);
  if (!content || content.trim() === "") {
    content = (await vscode.window.showInputBox({ placeHolder: "Contenido del fragmento" })) || "";
  }
  if (!content) {
    vscode.window.setStatusBarMessage("Acción cancelada.", 3000);
    return;
  }

  const suggested = suggestName(content);
  const name = (await vscode.window.showInputBox({
    placeHolder: "Nombre del fragmento",
    value: suggested,
    validateInput: (v) => (v.trim().length === 0 ? "Requerido" : undefined),
  })) || "";
  if (!name) {
    vscode.window.setStatusBarMessage("Acción cancelada.", 3000);
    return;
  }

  const language = await resolveLanguageId(doc);
  const category = (await vscode.window.showInputBox({
    placeHolder: "Categoría (ej: CSS, React, utilidades, etc.)",
    value: language, // Sugerir el lenguaje como categoría por defecto
    validateInput: (v) => (v.trim().length === 0 ? "Requerido" : undefined),
  })) || "";
  if (!category) {
    vscode.window.setStatusBarMessage("Acción cancelada.", 3000);
    return;
  }

  const newSnippet: SnippetDoc = {
    id: randomUUID(),
    name,
    category,
    language,
    content,
    createdAt: new Date().toISOString(),
  };

  const snippets = await loadSnippets();
  const existsIdx = snippets.findIndex((s) => s.name === name && s.language === language);
  if (existsIdx >= 0) {
    const overwrite = await vscode.window.showQuickPick(["Sí, reemplazar", "No, cancelar"], {
      placeHolder: `Ya existe "${name}" en ${language}. ¿Reemplazar?`,
    });
    if (overwrite !== "Sí, reemplazar") {
      vscode.window.setStatusBarMessage("Acción cancelada.", 3000);
      return;
    }
    snippets[existsIdx] = newSnippet;
  } else {
    snippets.push(newSnippet);
  }
  await saveSnippets(snippets);

  vscode.window.setStatusBarMessage(`Fragmento "${name}" guardado.`, 3000);
}

async function cmdInsertSnippet() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {return;}

  const snippets = await loadSnippets();
  if (snippets.length === 0) {
    vscode.window.showInformationMessage("No tienes fragmentos guardados.");
    return;
  }

  const language = await resolveLanguageId(editor.document);
  const filtered = snippets.filter((s) => s.language === language);
  const source = filtered.length > 0 ? filtered : snippets;

  const items = source.map((s) => ({
    label: s.name,
    description: `${s.language} | ${s.category} • ${new Date(s.createdAt).toLocaleString()}`,
    snippet: s,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: filtered.length
      ? "Selecciona un fragmento (filtrado por lenguaje)"
      : "Selecciona un fragmento (todos)",
    matchOnDescription: true,
  });
  if (!selected) {
    vscode.window.setStatusBarMessage("Acción cancelada.", 3000);
    return;
  }

  await editor.edit((eb) => {
    eb.replace(editor.selection, selected.snippet.content);
  });

  vscode.window.setStatusBarMessage(`Fragmento insertado: ${selected.label}`, 3000);
}

// --- Eliminar fragmento (lista + Enter = borrar) ---
async function cmdDeleteSnippet() {
  const editor = vscode.window.activeTextEditor;
  const all = await loadSnippets();
  if (all.length === 0) {
    vscode.window.showInformationMessage("No tienes fragmentos guardados.");
    return;
  }

  const lang = editor?.document ? await resolveLanguageId(editor.document) : undefined;
  const filtered = lang ? all.filter(s => s.language === lang) : [];
  const source = filtered.length > 0 ? filtered : all;

  const items = source.map(s => ({
    label: s.name,
    description: `${s.language} | ${s.category} • ${new Date(s.createdAt).toLocaleString()}`,
    snippet: s
  }));

  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: filtered.length > 0
      ? `Elige el fragmento a eliminar (${lang})`
      : "Elige el fragmento a eliminar",
    matchOnDescription: true
  });

  if (!picked) {
      vscode.window.setStatusBarMessage("Eliminación cancelada.", 3000);
      return;
  }

  // ✅ CAMBIO: Se añade un paso de confirmación explícito
  const confirmation = await vscode.window.showInformationMessage(
      `¿Estás seguro de que quieres eliminar "${picked.label}"?`,
      { modal: true },
      "Sí, eliminar",
      "No, cancelar"
  );

  if (confirmation !== "Sí, eliminar") {
      vscode.window.setStatusBarMessage("Eliminación cancelada.", 3000);
      return;
  }
  
  const remaining = all.filter(s => s.id !== picked.snippet.id);
  await saveSnippets(remaining);
  vscode.window.showInformationMessage(`Fragmento eliminado: ${picked.label}`);
}

async function cmdExportSnippets() {
  const snippets = await loadSnippets();
  const uri = await vscode.window.showSaveDialog({
    filters: { JSON: ["json"] },
    saveLabel: "Exportar",
  });
  if (!uri) {
    vscode.window.setStatusBarMessage("Acción cancelada.", 3000);
    return;
  }

  try {
    await fs.promises.writeFile(uri.fsPath, JSON.stringify(snippets, null, 2), "utf-8");
    vscode.window.showInformationMessage(`Snippets exportados a ${uri.fsPath}`);
  } catch (err) {
    vscode.window.showErrorMessage(`Error al exportar: ${String(err)}`);
  }
}

async function cmdImportSnippets() {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { JSON: ["json"] },
    openLabel: "Importar",
  });
  if (!uris || uris.length === 0) {
    vscode.window.setStatusBarMessage("Acción cancelada.", 3000);
    return;
  }

  try {
    const fileData = await fs.promises.readFile(uris[0].fsPath, "utf-8");
    const imported = JSON.parse(fileData);
    if (!Array.isArray(imported)) {throw new Error("Formato inválido (se esperaba un array)");}

    const current = await loadSnippets();
    const map = new Map<string, SnippetDoc>();
    for (const s of current) {
      map.set(s.id || `${s.language}::${s.name}`, s);
    }
    for (const raw of imported) {
      try {
        const s = normalizeImported(raw);
        const key = s.id || `${s.language}::${s.name}`;
        map.set(key, s);
      } catch (err) {
        log(`Error al normalizar un snippet importado: ${String(err)}`);
      }
    }
    await saveSnippets([...map.values()]);
    vscode.window.showInformationMessage(`Snippets importados desde ${uris[0].fsPath}`);
  } catch (err) {
    vscode.window.showErrorMessage(`Error al importar: ${String(err)}`);
  }
}

function normalizeImported(raw: any): SnippetDoc {
  if (!raw || typeof raw !== "object") {
    throw new Error("El objeto snippet no es válido.");
  }
  const id = typeof raw?.id === "string" && raw.id ? raw.id : randomUUID();
  const name = String(raw?.name || "").trim();
  const content = String(raw?.content || "").trim();

  if (!name) {throw new Error("Falta el campo 'name'");}
  if (!content) {throw new Error("Falta el campo 'content' o está vacío");}
  if (typeof raw?.language !== "string") {throw new Error("Falta el campo 'language'");}

  const language = raw.language.trim();
  const category = String(raw?.category || language);
  const createdAt = typeof raw?.createdAt === "string" && raw.createdAt ? raw.createdAt : new Date().toISOString();

  return { id, name, language, category, content, createdAt };
}

// -----------------------------
// 4) COINCIDENCIAS
// -----------------------------
async function cmdHighlightMatches() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {return;}

  const doc = editor.document;
  const selection = doc.getText(editor.selection);
  if (!selection) {
    vscode.window.showInformationMessage("Selecciona un texto para buscar coincidencias.");
    return;
  }

  const choice = await vscode.window.showQuickPick([
    "Coincidencia exacta (sensible a mayúsculas)",
    "Coincidencia parcial (sensible a mayúsculas)",
    "Resaltar palabra completa (insensible a mayúsculas)",
    "Coincidencia exacta (insensible a mayúsculas)"
  ], {
    placeHolder: "¿Cómo quieres buscar coincidencias?",
  });
  if (!choice) {
    vscode.window.setStatusBarMessage("Acción cancelada.", 3000);
    return;
  }
  
  let wholeWord = false;
  let caseInsensitive = false;
  let highlightFullWord = false;

  switch (choice) {
    case "Coincidencia exacta (sensible a mayúsculas)":
      wholeWord = true;
      caseInsensitive = false;
      break;
    case "Coincidencia parcial (sensible a mayúsculas)":
      wholeWord = false;
      caseInsensitive = false;
      break;
    case "Resaltar palabra completa (insensible a mayúsculas)":
      wholeWord = false;
      caseInsensitive = true;
      highlightFullWord = true;
      break;
    case "Coincidencia exacta (insensible a mayúsculas)":
      wholeWord = true;
      caseInsensitive = true;
      break;
  }

  const text = doc.getText();
  const indices = collectPlainRanges(text, selection, wholeWord, caseInsensitive, highlightFullWord).map(r => r.start);
  const ranges = rangesFromIndices(doc, indices, selection.length);

  if (ranges.length === 0) {
    vscode.window.showInformationMessage("No se encontraron coincidencias.");
    return;
  }

  editor.selections = ranges.map((r) => new vscode.Selection(r.start, r.end));
  vscode.window.showInformationMessage(`${ranges.length} coincidencias.`);
}

// -----------------------------
// 5) REEMPLAZO ROBUSTO (con palabra completa y case-insensitive)
// -----------------------------
async function cmdReplaceMatches() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {return;}

  const doc = editor.document;
  const selectionRaw = doc.getText(editor.selection);
  const selection = selectionRaw.trim();
  if (!selection) {
    vscode.window.showInformationMessage("Selecciona un texto o nombre de etiqueta para reemplazar.");
    return;
  }

  // Detectar si es un tag HTML/XML (ej: <h3> o h3)
  const tagNameMatch = selection.match(/^<?\/?\s*([A-Za-z][A-Za-z0-9\-\:]*)\s*>?$/);
  const isTagName = !!tagNameMatch;

  const text0 = doc.getText();
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // --- Rangos de TAGS ---
  function collectTagNameRanges(text: string, name: string): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    const nameEsc = esc(name);
    const flags = ["html", "xml", "xhtml"].includes(doc.languageId) ? "gi" : "g";
    const open = new RegExp(`<\\s*(${nameEsc})\\b`, flags);
    const close = new RegExp(`<\\s*\\/\\s*(${nameEsc})\\b`, flags);

    let m: RegExpExecArray | null;
    while ((m = open.exec(text))) {
      ranges.push({ start: m.index + m[0].indexOf(m[1]), end: m.index + m[0].indexOf(m[1]) + m[1].length });
    }
    while ((m = close.exec(text))) {
      ranges.push({ start: m.index + m[0].indexOf(m[1]), end: m.index + m[0].indexOf(m[1]) + m[1].length });
    }
    return ranges.sort((a, b) => a.start - b.start);
  }

  // --- Preguntar modo ---
  const mode = await vscode.window.showQuickPick(["Reemplazar todo", "Revisar uno por uno"], {
    placeHolder: isTagName
      ? `Renombrar etiqueta <${tagNameMatch![1]}>`
      : `Reemplazar texto "${selection}"`,
  });
  if (!mode) {return;}

  // --- Config extra solo para TEXTO ---
  let wholeWord = false;
  let caseInsensitive = false;
  if (!isTagName) {
    const opt1 = await vscode.window.showQuickPick(["Sí", "No"], { placeHolder: "¿Coincidencia de palabra completa?" });
    wholeWord = opt1 === "Sí";
    const opt2 = await vscode.window.showQuickPick(["Sí", "No"], { placeHolder: "¿Ignorar mayúsculas/minúsculas?" });
    caseInsensitive = opt2 === "Sí";
  }

  // --- Input de reemplazo ---
  const newTag = isTagName
    ? await vscode.window.showInputBox({
        placeHolder: `Reemplazar etiqueta <${tagNameMatch![1]}> por... (ej: h2)`,
        validateInput: (v) => (/^[A-Za-z][A-Za-z0-9\-\:]*$/.test(v.trim()) ? undefined : "Nombre inválido"),
      })
    : undefined;

  const replacement = !isTagName
    ? await vscode.window.showInputBox({ placeHolder: `Reemplazar "${selection}" con...` })
    : undefined;

  if ((isTagName && !newTag) || (!isTagName && replacement === undefined)) {return;}

  // --- Buscar rangos ---
  const oldTag = isTagName ? tagNameMatch![1] : selection;
  const ranges = isTagName
    ? collectTagNameRanges(text0, oldTag)
    : collectPlainRanges(text0, selection, wholeWord, caseInsensitive, wholeWord);

  if (ranges.length === 0) {
    vscode.window.showWarningMessage("No se encontraron coincidencias.");
    return;
  }

  // --- Reemplazar todo ---
  if (mode === "Reemplazar todo") {
    await editor.edit((eb) => {
      for (let i = ranges.length - 1; i >= 0; i--) {
        const r = ranges[i];
        eb.replace(new vscode.Range(doc.positionAt(r.start), doc.positionAt(r.end)), isTagName ? newTag! : replacement!);
      }
    });
    vscode.window.showInformationMessage(
      isTagName
        ? `Renombradas ${ranges.length} etiquetas <${oldTag}> → <${newTag}>.`
        : `Reemplazadas ${ranges.length} ocurrencias de "${selection}".`
    );
    return;
  }

  // --- Uno por uno ---
  let changed = 0;
  for (let i = ranges.length - 1; i >= 0; i--) {
    const nextRange = ranges[i];
    const rng = new vscode.Range(doc.positionAt(nextRange.start), doc.positionAt(nextRange.end));
    editor.selection = new vscode.Selection(rng.start, rng.end);
    editor.revealRange(rng, vscode.TextEditorRevealType.InCenter);

    const action = await vscode.window.showInformationMessage(
      isTagName
        ? `Renombrar esta etiqueta <${oldTag}> → <${newTag}> ?`
        : `Reemplazar este texto "${selection}" → "${replacement}" ?`,
      "Reemplazar",
      "Saltar",
      "Terminar"
    );
    if (!action || action === "Terminar") {break;}
    if (action === "Saltar") {continue;}

    const ok = await editor.edit((eb) => eb.replace(rng, isTagName ? newTag! : replacement!));
    if (ok) {changed++;}
  }

  vscode.window.showInformationMessage(
    isTagName
      ? `Renombrados ${changed} tags.`
      : `Reemplazos aplicados: ${changed}`
  );
}

// -----------------------------
// 6) BLOQUES Y TAGS
// -----------------------------
const PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  ")": "(",
  "]": "[",
  "}": "{",
};

function isOpening(ch: string): boolean {
  return ch === "(" || ch === "[" || ch === "{";
}
function isClosing(ch: string): boolean {
  return ch === ")" || ch === "]" || ch === "}";
}

function findMatchingBracket(doc: vscode.TextDocument, pos: vscode.Position): vscode.Position | null {
  const text = doc.getText();
  const idx = doc.offsetAt(pos);
  const ch = text[idx];

  if (!ch || (!isOpening(ch) && !isClosing(ch))) {return null;}

  const target = PAIRS[ch];
  if (!target) {return null;}

  if (isOpening(ch)) {
    let depth = 0;
    for (let i = idx; i < text.length; i++) {
      const c = text[i];
      if (c === ch) {depth++;}
      else if (c === target) {
        depth--;
        if (depth === 0) {return doc.positionAt(i);}
      }
    }
  } else {
    let depth = 0;
    for (let i = idx; i >= 0; i--) {
      const c = text[i];
      if (c === ch) {depth++;}
      else if (c === target) {
        depth--;
        if (depth === 0) {return doc.positionAt(i);}
      }
    }
  }
  return null;
}

// findMatchingTag con ventana limitada (performance)
function findMatchingTag(doc: vscode.TextDocument, pos: vscode.Position): vscode.Range | null {
  const text = doc.getText();
  const idx = doc.offsetAt(pos);
  const offsetRange = 5000;
  const start = Math.max(0, idx - offsetRange);
  const end = Math.min(text.length, idx + offsetRange);
  const snippet = text.slice(start, end);

  const openTagRegex = /<([a-zA-Z][a-zA-Z0-9:-]*)(?:\s+[^>]*?)?>/g;
  const closeTagRegex = /<\/([a-zA-Z][a-zA-Z0-9:-]*)\s*>/g;
  
  let matches: Array<{ name: string; isClosing: boolean; start: number; end: number; full: string }> = [];

  let m;
  while ((m = openTagRegex.exec(snippet)) !== null) {
      matches.push({
          name: m[1],
          isClosing: false,
          start: m.index + start,
          end: m.index + m[0].length + start,
          full: m[0]
      });
  }
  while ((m = closeTagRegex.exec(snippet)) !== null) {
      matches.push({
          name: m[1],
          isClosing: true,
          start: m.index + start,
          end: m.index + m[0].length + start,
          full: m[0]
      });
  }
  matches.sort((a, b) => a.start - b.start);

  const cursorIsInsideTag = matches.find(match => idx >= match.start && idx <= match.end);

  if (!cursorIsInsideTag) {
      return null;
  }

  const stack: string[] = [];
  const startTagIndex = matches.indexOf(cursorIsInsideTag);

  if (cursorIsInsideTag.isClosing) {
      stack.push(cursorIsInsideTag.name);
      for (let i = startTagIndex - 1; i >= 0; i--) {
          const match = matches[i];
          if (match.isClosing) {
              stack.push(match.name);
          } else {
              if (stack.length > 0 && stack[stack.length - 1] === match.name) {
                  stack.pop();
              }
              if (stack.length === 0) {
                  const startPos = doc.positionAt(match.start);
                  const endPos = doc.positionAt(cursorIsInsideTag.end);
                  return new vscode.Range(startPos, endPos);
              }
          }
      }
  } else {
      stack.push(cursorIsInsideTag.name);
      for (let i = startTagIndex + 1; i < matches.length; i++) {
          const match = matches[i];
          if (!match.isClosing) {
              stack.push(match.name);
          } else {
              if (stack.length > 0 && stack[stack.length - 1] === match.name) {
                  stack.pop();
              }
              if (stack.length === 0) {
                  const startPos = doc.positionAt(cursorIsInsideTag.start);
                  const endPos = doc.positionAt(match.end);
                  return new vscode.Range(startPos, endPos);
              }
          }
      }
  }

  return null;
}

async function cmdSelectBlock() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {return;}
  const doc = editor.document;
  const cur = editor.selection.active;

  const here = doc.getText(new vscode.Range(cur, cur.translate(0, 1)));
  const back = cur.character > 0 ? doc.getText(new vscode.Range(cur.translate(0, -1), cur)) : "";

  let openPos: vscode.Position | null = null;
  let closePos: vscode.Position | null = null;

  if (isOpening(here)) {
    const match = findMatchingBracket(doc, cur);
    if (match) {
      openPos = cur;
      closePos = match.translate(0, 1);
    }
  } else if (isClosing(here)) {
    const match = findMatchingBracket(doc, cur);
    if (match) {
      openPos = match;
      closePos = cur.translate(0, 1);
    }
  } else if (isClosing(back)) {
    const match = findMatchingBracket(doc, cur.translate(0, -1));
    if (match) {
      openPos = match;
      closePos = cur;
    }
  } else if (isOpening(back)) {
    const match = findMatchingBracket(doc, cur.translate(0, -1));
    if (match) {
      openPos = cur.translate(0, -1);
      closePos = match.translate(0, 1);
    }
  }

  if (!openPos || !closePos) {
    const range = findMatchingTag(doc, cur);
    if (range) {
      editor.selection = new vscode.Selection(range.start, range.end);
      editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
      return;
    }
  }

  if (openPos && closePos) {
    const range = new vscode.Range(openPos, closePos);
    editor.selection = new vscode.Selection(range.start, range.end);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  } else {
    vscode.window.showInformationMessage("No se encontró un bloque o etiqueta emparejada.");
  }
}

async function cmdGotoMatching() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {return;}
  const doc = editor.document;
  const cur = editor.selection.active;

  const here = doc.getText(new vscode.Range(cur, cur.translate(0, 1)));
  const back = cur.character > 0 ? doc.getText(new vscode.Range(cur.translate(0, -1), cur)) : "";

  let target: vscode.Position | null = null;

  if (isOpening(here) || isClosing(here)) {
    target = findMatchingBracket(doc, cur);
  } else if (isOpening(back) || isClosing(back)) {
    target = findMatchingBracket(doc, cur.translate(0, -1));
  }

  if (target) {
    const newSel = new vscode.Selection(target, target);
    editor.selection = newSel;
    editor.revealRange(new vscode.Range(target, target), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    return;
  }

  const tagRange = findMatchingTag(doc, cur);
  if (tagRange) {
    const atStart = cur.isEqual(tagRange.start);
    const pos = atStart ? tagRange.end : tagRange.start;
    const newSel = new vscode.Selection(pos, pos);
    editor.selection = newSel;
    editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    return;
  }

  vscode.window.showInformationMessage("No se encontró pareja de bloque/etiqueta.");
}

// -----------------------------
// 7) ACTIVACIÓN
// -----------------------------
export function activate(context: vscode.ExtensionContext) {
  // ✅ CAMBIO CLAVE: Usar la ubicación de almacenamiento global
  // Esto asegura que la extensión siempre tenga permisos para guardar
  // su archivo de configuración.
  SNIPPETS_FILE = path.join(context.globalStorageUri.fsPath, "snippets.json");
  TMP_FILE = SNIPPETS_FILE + ".tmp";
  
  log("Dev Code Memory activada v4");
  context.subscriptions.push(
    vscode.commands.registerCommand("dev-code-memory.addSnippet", cmdAddSnippet),
    vscode.commands.registerCommand("dev-code-memory.insertSnippet", cmdInsertSnippet),
    vscode.commands.registerCommand("dev-code-memory.exportSnippets", cmdExportSnippets),
    vscode.commands.registerCommand("dev-code-memory.importSnippets", cmdImportSnippets),
    vscode.commands.registerCommand("dev-code-memory.highlightMatches", cmdHighlightMatches),
    vscode.commands.registerCommand("dev-code-memory.replaceMatches", cmdReplaceMatches),
    vscode.commands.registerCommand("dev-code-memory.selectBlock", cmdSelectBlock),
    vscode.commands.registerCommand("dev-code-memory.gotoMatching", cmdGotoMatching),
    vscode.commands.registerCommand("dev-code-memory.deleteSnippet", cmdDeleteSnippet)
  );
}

export function deactivate() {
  log("Dev Code Memory desactivada");
}
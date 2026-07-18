// dataStore.ts — loads/saves the paint code deck.
//
// Reads: `${import.meta.env.BASE_URL}data.json` (works both in dev and once
// deployed under a GitHub Pages subpath).
//
// Writes: on Chrome/Edge, via the File System Access API, directly to a
// data.json file you pick from disk (works when running `npm run dev`
// locally — pick the one in /public). Everywhere else, "save" falls back
// to downloading a new data.json to drop back into /public yourself.
//
// The File System Access API isn't in TypeScript's built-in DOM types yet
// (it's a Chrome-only API, not a finished standard), so the minimal bits
// this file needs are declared below, self-contained — no extra
// @types package or tsconfig changes required.

interface FileSystemFileHandle {
  readonly name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write(data: string | BufferSource | Blob): Promise<void>;
  close(): Promise<void>;
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  excludeAcceptAllOption?: boolean;
  multiple?: boolean;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: OpenFilePickerOptions) => Promise<FileSystemFileHandle[]>;
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

export interface SaveResult {
  method: 'filesystem' | 'download';
  filename: string;
}

let fileHandle: FileSystemFileHandle | null = null;

export async function loadViaFetch<T = unknown>(): Promise<T> {
  const res = await fetch(`${import.meta.env.BASE_URL}data.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not read data.json (HTTP ${res.status})`);
  return res.json() as Promise<T>;
}

export async function loadViaPicker<T = unknown>(): Promise<T> {
  if (!window.showOpenFilePicker) {
    throw new Error("Your browser can't open files directly. Use Chrome or Edge for this feature.");
  }
  const [handle] = await window.showOpenFilePicker({
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  });
  fileHandle = handle;
  const file = await handle.getFile();
  return JSON.parse(await file.text()) as T;
}

export async function save(data: unknown): Promise<SaveResult> {
  const json = JSON.stringify(data, null, 2);

  if (fileHandle) {
    const writable = await fileHandle.createWritable();
    await writable.write(json);
    await writable.close();
    return { method: 'filesystem', filename: fileHandle.name };
  }

  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'data.json',
      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    });
    fileHandle = handle;
    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();
    return { method: 'filesystem', filename: handle.name };
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { method: 'download', filename: 'data.json' };
}

export function supportsFilesystem(): boolean {
  return !!window.showOpenFilePicker;
}
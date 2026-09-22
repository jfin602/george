import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../../../src/', import.meta.url);

async function sources(directory: URL): Promise<URL[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => entry.isDirectory()
    ? sources(new URL(`${entry.name}/`, directory))
    : entry.name.endsWith('.ts') ? [new URL(entry.name, directory)] : []))).flat();
}

test('core, provider, and application stay independent of OpenTUI', async () => {
  const files = (await Promise.all(['core', 'provider', 'application'].map((name) => sources(new URL(`${name}/`, root))))).flat();
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    assert.doesNotMatch(source, /(?:from\s+|import\s*\()['"]@opentui\//, `${file.pathname} imports OpenTUI`);
  }
  assert.ok(files.length > 0, `No adapter-boundary sources found beneath ${join(root.pathname, 'core')}`);
});

test('normal TUI launch scripts enable Node FFI', async () => {
  const manifest = JSON.parse(await readFile(new URL('../../../package.json', import.meta.url), 'utf8')) as { scripts: Record<string, string> };
  assert.match(manifest.scripts.start, /node --experimental-ffi/);
  assert.match(manifest.scripts.tui, /node --experimental-ffi/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export async function acceptExistingCoreEdit(workspace) {
  const { formatReleaseLabel, normalizeLabel } = await import(pathToFileURL(`${workspace}/src/labels.js`).href);
  assert.equal(normalizeLabel(' Release Candidate '), 'release-candidate');
  assert.equal(formatReleaseLabel(' Release Candidate '), 'release-candidate@stable');
  assert.equal(formatReleaseLabel(' Release Candidate ', ' BETA '), 'release-candidate@beta');
  assert.equal(formatReleaseLabel('Release Candidate', 'next'), 'release-candidate@next');
  assert.throws(() => formatReleaseLabel('Release Candidate', 'preview'));
  assert.match(await readFile(`${workspace}/README.md`, 'utf8'), /stable.*beta.*next|stable, beta, (?:or )?next/i);
}

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { collectManifestEntries, formatManifestSummary, writeManifest } from '../../scripts/release/lib/manifest.js';

const TMP = join(process.cwd(), 'tmp-manifest');

async function setupFiles(structure: Record<string, string>) {
  await fs.rm(TMP, { recursive: true, force: true });
  for (const [file, contents] of Object.entries(structure)) {
    const fullPath = join(TMP, file);
    await fs.mkdir(dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, contents, 'utf-8');
  }
}

afterEach(async () => {
  await fs.rm(TMP, { recursive: true, force: true });
});

describe('release manifest helpers', () => {
  it('collects file entries with stable ordering', async () => {
    await setupFiles({
      'a.txt': 'alpha',
      'nested/b.txt': 'beta'
    });

    const entries = await collectManifestEntries(TMP);
    expect(entries.map((e) => e.path)).toEqual(['a.txt', 'nested/b.txt']);
  });

  it('writes manifest with metadata summary', async () => {
    await setupFiles({
      'bundle.js': 'console.log(1);',
      'style.css': 'body{color:#fff;}'
    });

    const manifest = await writeManifest(TMP, 'manifest.json', { channel: 'test' });
    const summary = formatManifestSummary(manifest);
    expect(manifest.files).toHaveLength(2);
    expect(summary.fileCount).toBe(2);
    const manifestFile = JSON.parse(await fs.readFile(join(TMP, 'manifest.json'), 'utf-8'));
    expect(manifestFile.channel).toBe('test');
  });
});

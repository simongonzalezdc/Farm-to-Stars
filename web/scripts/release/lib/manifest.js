import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join, relative } from 'path';

async function walkDirectory(root, current = '.') {
  const results = [];
  const dir = join(root, current);
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = join(current, entry.name);
    if (entry.isDirectory()) {
      const nested = await walkDirectory(root, entryPath);
      results.push(...nested);
      continue;
    }
    if (!entry.isFile()) {
      continue;
    }
    results.push(entryPath);
  }
  return results;
}

export async function collectManifestEntries(rootDir) {
  const entries = await walkDirectory(rootDir);
  const manifest = [];
  for (const relativePath of entries) {
    const absolutePath = join(rootDir, relativePath);
    const stat = await fs.stat(absolutePath);
    if (!stat.isFile()) {
      continue;
    }
    const buffer = await fs.readFile(absolutePath);
    const hash = createHash('sha256').update(buffer).digest('hex');
    manifest.push({
      path: relative(rootDir, absolutePath).replace(/\\/g, '/'),
      size: stat.size,
      sha256: hash
    });
  }
  manifest.sort((a, b) => a.path.localeCompare(b.path));
  return manifest;
}

export async function writeManifest(rootDir, fileName, metadata = {}) {
  const entries = await collectManifestEntries(rootDir);
  const payload = {
    generatedAt: new Date().toISOString(),
    files: entries,
    ...metadata
  };
  const target = join(rootDir, fileName);
  await fs.writeFile(target, JSON.stringify(payload, null, 2), 'utf-8');
  return payload;
}

export function formatManifestSummary(manifest) {
  const totalBytes = manifest.files.reduce((sum, file) => sum + file.size, 0);
  const hashSeed = createHash('sha256');
  for (const file of manifest.files) {
    hashSeed.update(file.sha256);
  }
  return {
    fileCount: manifest.files.length,
    totalBytes,
    combinedHash: hashSeed.digest('hex')
  };
}

export async function ensureDirectory(dir) {
  await fs.mkdir(dir, { recursive: true });
}

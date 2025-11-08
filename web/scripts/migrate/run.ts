#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateSave } from '../../src/migrations.ts';
import { CURRENT_SCHEMA_VERSION, type ResourcesTable } from '../../src/types.ts';

interface CLIOptions {
  input?: string;
  output?: string;
  from?: string;
  help?: boolean;
}

interface ParseResult {
  options: CLIOptions;
  positional: string[];
  errors: string[];
}

const SCRIPT_DIR = fileURLToPath(new URL('.', import.meta.url));
const FIXTURE_DIR = resolve(SCRIPT_DIR, '__fixtures__');
const RESOURCE_TABLE = loadResourceTable();

async function main() {
  const { options, positional, errors } = parseArgs(process.argv.slice(2));

  if (errors.length > 0) {
    for (const message of errors) {
      console.error(message);
    }
    process.exitCode = 1;
    return;
  }

  if (options.help) {
    printHelp();
    return;
  }

  if (options.from && (options.input || options.output || positional.length > 0)) {
    console.error('`--from` cannot be combined with input/output arguments.');
    process.exitCode = 1;
    return;
  }

  if (options.from) {
    await migrateFixtures(options.from);
    return;
  }

  const inputPath = options.input ?? positional[0];
  const outputPath = options.output ?? positional[1];

  try {
    const raw = await readInput(inputPath);
    const migrated = migrateSave(raw, RESOURCE_TABLE);
    if (!migrated) {
      console.error('Failed to migrate save payload.');
      process.exitCode = 1;
      return;
    }

    const serialized = JSON.stringify(migrated, null, 2);
    if (outputPath) {
      const resolved = resolve(process.cwd(), outputPath);
      writeFileSync(resolved, serialized, 'utf-8');
      console.info(`Migrated save written to ${outputPath}`);
    } else {
      process.stdout.write(`${serialized}\n`);
    }
  } catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
  }
}

async function migrateFixtures(versionToken: string) {
  const normalized = normalizeVersion(versionToken);
  if (!normalized) {
    console.error(`Invalid version token: ${versionToken}`);
    process.exitCode = 1;
    return;
  }

  const files = readdirSync(FIXTURE_DIR).filter((file) =>
    file.startsWith(`v${normalized}-`) && file.endsWith('.json')
  );

  if (files.length === 0) {
    console.error(`No fixtures found for schema version v${normalized}.`);
    process.exitCode = 1;
    return;
  }

  let failures = 0;
  for (const file of files) {
    try {
      const sourcePath = resolve(FIXTURE_DIR, file);
      const raw = JSON.parse(readFileSync(sourcePath, 'utf-8'));
      const migrated = migrateSave(raw, RESOURCE_TABLE);
      if (!migrated) {
        throw new Error('Migration returned null');
      }

      const suffix = file.slice(`v${normalized}-`.length).replace(/\.json$/, '');
      const targetName = `v${CURRENT_SCHEMA_VERSION}-from-v${normalized}-${suffix}.json`;
      const targetPath = resolve(FIXTURE_DIR, targetName);
      writeFileSync(targetPath, JSON.stringify(migrated, null, 2), 'utf-8');
      console.info(`[migrate] ${file} -> ${targetName}`);
    } catch (error) {
      failures += 1;
      console.error(`[migrate] ${file} failed: ${(error as Error).message}`);
    }
  }

  if (failures > 0) {
    process.exitCode = 1;
  }
}

function normalizeVersion(token: string): string | null {
  const trimmed = token.trim();
  const match = /^v?(\d+)$/.exec(trimmed);
  if (!match) {
    return null;
  }
  return match[1];
}

async function readInput(inputPath?: string) {
  if (inputPath) {
    const resolved = resolve(process.cwd(), inputPath);
    const text = readFileSync(resolved, 'utf-8');
    return JSON.parse(text);
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) {
    throw new Error('No input provided');
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
}

function parseArgs(tokens: string[]): ParseResult {
  const options: CLIOptions = {};
  const positional: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '--help' || token === '-h') {
      options.help = true;
      continue;
    }

    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = tokens[i + 1];
      if (!next || next.startsWith('--')) {
        errors.push(`Missing value for --${key}`);
        continue;
      }

      switch (key) {
        case 'input':
          options.input = next;
          break;
        case 'output':
          options.output = next;
          break;
        case 'from':
          options.from = next;
          break;
        default:
          errors.push(`Unknown option --${key}`);
          break;
      }
      i += 1;
    } else {
      positional.push(token);
    }
  }

  return { options, positional, errors };
}

function printHelp() {
  console.log(`Usage:\n  yarn migrate --from <schemaVersion>\n  yarn migrate -- --input <path> [--output <path>]\n`);
  console.log('Options:');
  console.log('  --from <schemaVersion>  Run migrations against fixtures for the given version.');
  console.log('  --input <path>          Read legacy save data from a file.');
  console.log('  --output <path>         Write migrated save data to a file instead of stdout.');
  console.log('  --help, -h              Show this message.');
  console.log('\nWithout --input the CLI reads JSON from stdin.');
}

function loadResourceTable(): ResourcesTable {
  const resourcePath = resolve(SCRIPT_DIR, '../../src/data/resources.json');
  const contents = readFileSync(resourcePath, 'utf-8');
  return JSON.parse(contents) as ResourcesTable;
}

await main();

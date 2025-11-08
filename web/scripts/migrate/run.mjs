#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateSave } from '../../src/migrations';

async function main() {
  const { args, positional } = parseArgs(process.argv.slice(2));
  if (args.has('help') || args.has('h')) {
    printHelp();
    return;
  }

  const inputPath = args.get('input') ?? positional[0];
  const outputPath = args.get('output') ?? positional[1];

  const raw = await readInput(inputPath);
  const resourceTable = loadResourceTable();
  const migrated = migrateSave(raw, resourceTable);
  if (!migrated) {
    console.error('Failed to migrate save payload.');
    process.exitCode = 1;
    return;
  }

  const serialized = JSON.stringify(migrated, null, 2);
  if (outputPath) {
    writeFileSync(resolve(process.cwd(), outputPath), serialized, 'utf-8');
    console.info(`Migrated save written to ${outputPath}`);
  } else {
    process.stdout.write(`${serialized}\n`);
  }
}

function parseArgs(tokens) {
  const args = new Map();
  const positional = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const value = tokens[i + 1] && !tokens[i + 1].startsWith('--') ? tokens[++i] : 'true';
      args.set(key, value);
    } else {
      positional.push(token);
    }
  }
  return { args, positional };
}

function printHelp() {
  console.log('Usage: npm run migrate -- [--input path] [--output path]\n');
  console.log('Reads a legacy save from --input (or stdin) and writes a schema v6 save to --output (or stdout).');
}

async function readInput(inputPath) {
  if (inputPath) {
    const text = readFileSync(resolve(process.cwd(), inputPath), 'utf-8');
    return JSON.parse(text);
  }
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) {
    throw new Error('No input provided');
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
}

function loadResourceTable() {
  const base = fileURLToPath(new URL('.', import.meta.url));
  const resourcePath = resolve(base, '../../src/data/resources.json');
  return JSON.parse(readFileSync(resourcePath, 'utf-8'));
}

await main();

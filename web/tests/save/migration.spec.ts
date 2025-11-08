import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { migrateSave } from '../../src/migrations.ts';
import {
  CURRENT_SCHEMA_VERSION,
  PREVIOUS_SCHEMA_VERSION,
  type ResourcesTable,
  type SaveV5,
  type SaveV6
} from '../../src/types.ts';

const TEST_DIR = fileURLToPath(new URL('.', import.meta.url));
const FIXTURE_DIR = resolve(TEST_DIR, '../../scripts/migrate/__fixtures__');
const RESOURCE_TABLE_PATH = resolve(TEST_DIR, '../../src/data/resources.json');
const RESOURCE_TABLE = JSON.parse(readFileSync(RESOURCE_TABLE_PATH, 'utf-8')) as ResourcesTable;

function loadFixture<T = unknown>(name: string): T {
  const path = resolve(FIXTURE_DIR, name);
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

describe('save migration ladder', () => {
  it('migrates v5 fixtures into schema v6 with new entities populated', () => {
    const legacy = loadFixture('v5-basic.json');
    const expected = loadFixture<SaveV6>('v6-from-v5-basic.json');

    const migrated = migrateSave(legacy, RESOURCE_TABLE);
    expect(migrated).not.toBeNull();
    expect(migrated?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated).toEqual(expected);
    expect(migrated?.mail).toEqual({ nextId: 1, inbox: [], scheduled: [], lastGeneratedDay: 0 });
    expect(migrated?.jobQueue).toEqual({ nextJobId: 1, jobs: [] });
  });

  it('migrates legacy v4 fixtures forward through the ladder', () => {
    const legacy = loadFixture('v4-basic.json');
    const expected = loadFixture<SaveV6>('v6-from-v4-basic.json');

    const migrated = migrateSave(legacy, RESOURCE_TABLE);
    expect(migrated).not.toBeNull();
    expect(migrated?.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(migrated).toEqual(expected);
  });

  it('recovers downgraded v6 saves by treating them as v5 payloads', () => {
    const expected = loadFixture<SaveV6>('v6-from-v5-basic.json');
    const { mail: _mail, jobQueue: _jobQueue, ...rest } = expected;
    const downgraded: SaveV5 = {
      ...(rest as unknown as SaveV5),
      schemaVersion: PREVIOUS_SCHEMA_VERSION
    };

    const migrated = migrateSave(downgraded, RESOURCE_TABLE);
    expect(migrated).not.toBeNull();
    expect(migrated).toEqual(expected);
  });
});

#!/usr/bin/env node
/**
 * Data validation CLI
 * Validates all JSON data files in web/src/data/ against documented schemas
 *
 * Usage:
 *   node tools/cli/validate.mjs [--verbose] [--file <path>]
 *
 * Exit codes:
 *   0 - All validations passed
 *   1 - Validation errors found
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateResources } from '../validation/schemas/resources.mjs';
import { validateBuildings } from '../validation/schemas/buildings.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '../..');
const dataDir = join(projectRoot, 'web/src/data');

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const fileFlag = args.indexOf('--file');
const specificFile = fileFlag !== -1 ? args[fileFlag + 1] : null;

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function loadJSON(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    throw new Error(`Failed to parse ${filePath}: ${err.message}`);
  }
}

function validateFile(name, validator, data, context = {}) {
  log(`\n📋 Validating ${name}...`, 'cyan');

  const errors = validator(data, context);

  if (errors.length === 0) {
    log(`✅ ${name} — No issues found`, 'green');
    return { errors: 0, warnings: 0 };
  }

  let errorCount = 0;
  let warningCount = 0;

  for (const error of errors) {
    if (error.type === 'fatal' || error.type === 'error') {
      errorCount++;
      const location = error.resource || error.building || error.crop || '';
      const field = error.field ? `.${error.field}` : '';
      log(`  ❌ [${location}${field}] ${error.message}`, 'red');
    } else if (error.type === 'warning') {
      warningCount++;
      if (verbose) {
        const location = error.resource || error.building || error.crop || '';
        const field = error.field ? `.${error.field}` : '';
        log(`  ⚠️  [${location}${field}] ${error.message}`, 'yellow');
      }
    }
  }

  if (errorCount > 0) {
    log(`❌ ${name} — ${errorCount} error(s), ${warningCount} warning(s)`, 'red');
  } else {
    log(`⚠️  ${name} — ${warningCount} warning(s)`, 'yellow');
  }

  return { errors: errorCount, warnings: warningCount };
}

async function main() {
  log('🔍 Farm to Stars — Data Validation', 'cyan');
  log('━'.repeat(50), 'dim');

  let totalErrors = 0;
  let totalWarnings = 0;
  let filesValidated = 0;

  try {
    // Load resources first (needed for cross-references)
    const resourcesPath = join(dataDir, 'resources.json');
    const resources = loadJSON(resourcesPath);

    if (specificFile) {
      log(`\n📁 Validating specific file: ${specificFile}`, 'cyan');

      if (specificFile.includes('resources.json')) {
        const result = validateFile('resources.json', validateResources, resources);
        totalErrors += result.errors;
        totalWarnings += result.warnings;
        filesValidated++;
      } else if (specificFile.includes('buildings.json')) {
        const buildings = loadJSON(specificFile);
        const result = validateFile('buildings.json', validateBuildings, buildings, resources);
        totalErrors += result.errors;
        totalWarnings += result.warnings;
        filesValidated++;
      } else {
        log(`⚠️  No validator available for ${specificFile}`, 'yellow');
      }
    } else {
      // Validate all files
      log('\n📁 Scanning web/src/data/ directory...', 'cyan');

      // 1. Resources
      const resourcesResult = validateFile('resources.json', validateResources, resources);
      totalErrors += resourcesResult.errors;
      totalWarnings += resourcesResult.warnings;
      filesValidated++;

      // 2. Buildings
      const buildingsPath = join(dataDir, 'buildings.json');
      const buildings = loadJSON(buildingsPath);
      const buildingsResult = validateFile('buildings.json', validateBuildings, buildings, resources);
      totalErrors += buildingsResult.errors;
      totalWarnings += buildingsResult.warnings;
      filesValidated++;

      // TODO: Add validators for crops.json, livestock.json, recipes.json, tools.json
      // as schemas are documented in tools/validation/schemas/
      log('\n📝 Note: crops, livestock, recipes, tools validators not yet implemented', 'dim');
    }

  } catch (err) {
    log(`\n💥 Fatal error: ${err.message}`, 'red');
    process.exit(1);
  }

  // Summary
  log('\n━'.repeat(50), 'dim');
  log(`\n📊 Validation Summary`, 'cyan');
  log(`   Files validated: ${filesValidated}`);
  log(`   Errors: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green');
  log(`   Warnings: ${totalWarnings}`, totalWarnings > 0 ? 'yellow' : 'green');

  if (totalErrors > 0) {
    log('\n❌ Validation failed — Fix errors before committing', 'red');
    process.exit(1);
  } else if (totalWarnings > 0) {
    log('\n⚠️  Validation passed with warnings', 'yellow');
    if (!verbose) {
      log('   Run with --verbose to see warning details', 'dim');
    }
    process.exit(0);
  } else {
    log('\n✅ All validations passed!', 'green');
    process.exit(0);
  }
}

main();

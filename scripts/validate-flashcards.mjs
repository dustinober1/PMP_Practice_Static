#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const FLASHCARDS_SOURCE_DIR = path.resolve('src/data/flashcards-source');

const CONFIG = {
  EXPECTED_CARDS_PER_ENABLER: 100,
  DIFFICULTY_DISTRIBUTION: {
    easy: 50,
    medium: 30,
    hard: 20,
  },
  TOLERANCE: 5,
  FRONT_MIN_LENGTH: 10,
  FRONT_MAX_LENGTH: 200,
  BACK_MIN_LENGTH: 10,
  BACK_MAX_LENGTH: 500,
  VALID_DIFFICULTIES: ['easy', 'medium', 'hard'],
  TAG_REGEX: /^[a-z0-9-]+$/,
};

async function validateEnablerFile(filePath) {
  const errors = [];
  const content = await fs.readFile(filePath, 'utf-8');
  const flashcards = JSON.parse(content);
  const basename = path.basename(filePath);

  // 1. Card Count
  if (flashcards.length !== CONFIG.EXPECTED_CARDS_PER_ENABLER) {
    errors.push(`Expected ${CONFIG.EXPECTED_CARDS_PER_ENABLER} cards, but found ${flashcards.length}.`);
  }

  // 2. Difficulty Distribution
  const counts = { easy: 0, medium: 0, hard: 0 };
  flashcards.forEach(card => {
    if (card.difficulty) {
      counts[card.difficulty]++;
    }
  });

  for (const diff of CONFIG.VALID_DIFFICULTIES) {
    const expected = CONFIG.DIFFICULTY_DISTRIBUTION[diff];
    const actual = counts[diff];
    if (Math.abs(expected - actual) > CONFIG.TOLERANCE) {
      errors.push(`Difficulty '${diff}': Expected ${expected} (±${CONFIG.TOLERANCE}), but found ${actual}.`);
    }
  }

  // 3. Per-Card Validation
  flashcards.forEach((card, index) => {
    const cardIdentifier = `Card #${index + 1} (front: "${card.front ? card.front.substring(0, 20) : ''}...")`;

    // Required Fields
    ['front', 'back', 'tags', 'difficulty'].forEach(field => {
      if (!card[field]) {
        errors.push(`${cardIdentifier}: Missing required field '${field}'.`);
      }
    });

    // Length Limits
    if (card.front && (card.front.length < CONFIG.FRONT_MIN_LENGTH || card.front.length > CONFIG.FRONT_MAX_LENGTH)) {
      errors.push(`${cardIdentifier}: Front content length ${card.front.length} is outside the allowed range [${CONFIG.FRONT_MIN_LENGTH}-${CONFIG.FRONT_MAX_LENGTH}].`);
    }
    if (card.back && (card.back.length < CONFIG.BACK_MIN_LENGTH || card.back.length > CONFIG.BACK_MAX_LENGTH)) {
        errors.push(`${cardIdentifier}: Back content length ${card.back.length} is outside the allowed range [${CONFIG.BACK_MIN_LENGTH}-${CONFIG.BACK_MAX_LENGTH}].`);
    }

    // Valid Difficulty
    if (card.difficulty && !CONFIG.VALID_DIFFICULTIES.includes(card.difficulty)) {
      errors.push(`${cardIdentifier}: Invalid difficulty '${card.difficulty}'.`);
    }

    // Tags Format
    if (card.tags && Array.isArray(card.tags)) {
      card.tags.forEach(tag => {
        if (!CONFIG.TAG_REGEX.test(tag)) {
          errors.push(`${cardIdentifier}: Invalid tag format '${tag}'.`);
        }
      });
    } else if (card.tags) {
        errors.push(`${cardIdentifier}: 'tags' field must be an array.`);
    }
  });

  return { file: basename, errors, warnings: [] }; // Warnings can be added later
}

async function main() {
  let totalErrors = 0;
  let filesScanned = 0;
  const results = [];

  try {
    const domains = await fs.readdir(FLASHCARDS_SOURCE_DIR);

    for (const domain of domains) {
      const domainPath = path.join(FLASHCARDS_SOURCE_DIR, domain);
      if (!(await fs.stat(domainPath)).isDirectory()) continue;

      const taskDirs = await fs.readdir(domainPath);
      for (const taskDir of taskDirs) {
        const taskPath = path.join(domainPath, taskDir);
        if (!(await fs.stat(taskPath)).isDirectory()) continue;

        const enablerFiles = await fs.readdir(taskPath);
        for (const enablerFile of enablerFiles) {
          if (!enablerFile.endsWith('.json')) continue;
          filesScanned++;
          const filePath = path.join(taskPath, enablerFile);
          const result = await validateEnablerFile(filePath);
          results.push(result);
          if (result.errors.length > 0) {
            totalErrors += result.errors.length;
            console.error(`\n--- Errors in ${result.file} ---`);
            result.errors.forEach(e => console.error(`  - ${e}`));
          }
        }
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: The source directory ${FLASHCARDS_SOURCE_DIR} does not exist.`);
      process.exit(1);
    }
    console.error('An unexpected error occurred during validation:', error);
    process.exit(1);
  }

  console.log(`\n--- Validation Summary ---`);
  console.log(`Files scanned: ${filesScanned}`);
  console.log(`Total errors: ${totalErrors}`);

  if (totalErrors > 0) {
    console.error('\nValidation failed.');
    process.exit(1);
  } else {
    console.log('\nValidation passed successfully.');
  }
}

main();

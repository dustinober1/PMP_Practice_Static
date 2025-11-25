#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const FLASHCARDS_SOURCE_DIR = path.resolve('src/data/flashcards-source');
const FLASHCARDS_OUTPUT_DIR = path.resolve('src/data/flashcards');

/**
 * Reads a JSON file and returns its content, or an empty array if it doesn't exist.
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<object[]>} The parsed JSON data.
 */
async function readJsonSafe(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return []; // Return empty array if file doesn't exist
    }
    throw error;
  }
}

async function main() {
  await fs.mkdir(FLASHCARDS_OUTPUT_DIR, { recursive: true });

  const mergedFlashcards = {
    people: [],
    process: [],
    business: [],
  };

  // 1. Read existing flashcards and preserve manually-created ones
  for (const domain in mergedFlashcards) {
    const existingPath = path.join(FLASHCARDS_OUTPUT_DIR, `${domain}.json`);
    const existingCards = await readJsonSafe(existingPath);
    const manualCards = existingCards.filter(card => !card.id.startsWith('fc-'));
    mergedFlashcards[domain] = manualCards;
    console.log(`Preserving ${manualCards.length} manual flashcards for domain: ${domain}`);
  }

  // 2. Walk the source directory and merge AI-generated cards
  try {
    const domains = await fs.readdir(FLASHCARDS_SOURCE_DIR);

    for (const domain of domains) {
      if (!mergedFlashcards[domain]) continue;

      const domainPath = path.join(FLASHCARDS_SOURCE_DIR, domain);
      if (!(await fs.stat(domainPath)).isDirectory()) continue;

      const taskDirs = await fs.readdir(domainPath);
      for (const taskDir of taskDirs) {
        const taskPath = path.join(domainPath, taskDir);
        if (!(await fs.stat(taskPath)).isDirectory()) continue;

        const enablerFiles = await fs.readdir(taskPath);
        for (const enablerFile of enablerFiles) {
          if (!enablerFile.endsWith('.json')) continue;

          const enablerPath = path.join(taskPath, enablerFile);
          const content = await fs.readFile(enablerPath, 'utf-8');
          const newCards = JSON.parse(content);

          const enablerId = path.basename(enablerFile, '.json'); // e.g., "e-people-1-1"
          const taskId = taskDir; // e.g., "people-1"

          const taskNumber = taskId.split('-')[1];
          const enablerNumber = enablerId.split('-')[3];

          newCards.forEach((card, index) => {
            const cardNum = String(index + 1).padStart(3, '0');

            card.id = `fc-${domain}-${taskNumber}-${enablerNumber}-${cardNum}`;
            card.domainId = domain;
            card.taskId = taskId;
            card.type = 'concept';

            mergedFlashcards[domain].push(card);
          });
        }
      }
    }

    // 3. Write the final merged files
    for (const domain in mergedFlashcards) {
      const outputPath = path.join(FLASHCARDS_OUTPUT_DIR, `${domain}.json`);
      // Sort by ID for consistent output
      mergedFlashcards[domain].sort((a, b) => a.id.localeCompare(b.id));
      await fs.writeFile(outputPath, JSON.stringify(mergedFlashcards[domain], null, 2));
      console.log(`Wrote ${mergedFlashcards[domain].length} total flashcards to ${outputPath}`);
    }

    console.log('Flashcard merging complete.');

  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No new flashcards to merge. Skipping.');
      return;
    }
    console.error('An unexpected error occurred during merging:', error);
    process.exit(1);
  }
}

main();

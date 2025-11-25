#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.resolve('src/data');
const ENABLERS_PATH = path.join(DATA_DIR, 'enablers.json');
const TASKS_PATH = path.join(DATA_DIR, 'tasks.json');
const DOMAINS_PATH = path.join(DATA_DIR, 'domains.json');
const FLASHCARDS_SOURCE_DIR = path.resolve('src/data/flashcards-source');
const STATE_FILE_PATH = path.resolve('.flashcards-generation-state.json');

/**
 * Loads all necessary context data.
 * @returns {Promise<object>} An object containing enablers, tasks, and domains.
 */
async function loadContextData() {
  const [enablers, tasks, domains] = await Promise.all([
    fs.readFile(ENABLERS_PATH, 'utf-8').then(JSON.parse),
    fs.readFile(TASKS_PATH, 'utf-8').then(JSON.parse),
    fs.readFile(DOMAINS_PATH, 'utf-8').then(JSON.parse),
  ]);
  return { enablers, tasks, domains };
}

/**
 * Builds the AI prompt for a given enabler.
 * @param {object} enabler - The enabler object.
 * @param {object} context - The context data.
 * @returns {string} The generated prompt.
 */
function buildPrompt(enabler, context) {
  const task = context.tasks.find(t => t.id === enabler.taskId);
  const domain = context.domains.find(d => d.id === task.domainId);

  return `
You are a PMP exam prep expert creating simple concept flashcards.

DOMAIN: ${domain.name}
TASK: ${task.description}
ENABLER: ${enabler.text}

Create exactly 100 simple concept flashcards with:

1. FORMAT: Term/definition or concept/explanation
   - Front: Clear question (e.g., "What is X?", "Define Y", "Explain Z")
   - Back: Concise answer (1-3 sentences max)

2. DIFFICULTY DISTRIBUTION:
   - 50 cards: easy (basic definitions)
   - 30 cards: medium (application, relationships)
   - 20 cards: hard (nuances, edge cases, comparisons)

3. CONTENT COVERAGE:
   - Key terminology specific to this enabler
   - Core techniques and tools
   - Best practices and principles
   - Common pitfalls
   - Real-world applications

4. QUALITY:
   - Each card self-contained (no ambiguous references)
   - PMBOK 7th Edition aligned
   - No duplicates within the set
   - 1-3 relevant tags per card (lowercase, hyphen-separated)

Return ONLY valid JSON array: [{"front": "...", "back": "...", "tags": [...], "difficulty": "easy"}, ...]
  `.trim();
}

/**
 * Generates placeholder flashcards after logging the AI prompt.
 * @param {object} enabler - The enabler object.
 * @param {object} context - The context data.
 * @returns {Promise<object[]>} A promise that resolves to an array of flashcards.
 */
async function generateFlashcardsForEnabler(enabler, context) {
  const prompt = buildPrompt(enabler, context);

  console.log('--- GENERATED AI PROMPT ---');
  console.log(prompt);
  console.log('---------------------------');
  console.log(`\nGenerating placeholder flashcards for enabler: ${enabler.id}`);

  // TODO: Replace this with a real call to an AI model in a future phase.
  // Simulate AI call
  await new Promise(resolve => setTimeout(resolve, 100));

  const flashcards = [];
  for (let i = 0; i < 100; i++) {
    flashcards.push({
      front: `What is the key aspect of "${enabler.text}"? (${i + 1})`,
      back: `This is the detailed explanation for the key aspect of "${enabler.text}". (${i + 1})`,
      tags: ['placeholder', enabler.taskId.split('-')[0]],
      difficulty: i < 50 ? 'easy' : i < 80 ? 'medium' : 'hard',
    });
  }
  return flashcards;
}

async function saveFlashcards(enabler, flashcards) {
  const [domain, taskNumber] = enabler.taskId.split('-');
  const taskDir = `${domain}-${taskNumber}`;

  const outputDir = path.join(FLASHCARDS_SOURCE_DIR, domain, taskDir);
  await fs.mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${enabler.id}.json`);
  await fs.writeFile(outputPath, JSON.stringify(flashcards, null, 2));
  console.log(`Saved ${flashcards.length} flashcards to ${outputPath}`);
}

async function loadState() {
  try {
    const content = await fs.readFile(STATE_FILE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { completed: [], failed: [] };
    }
    throw error;
  }
}

async function saveState(state) {
  await fs.writeFile(STATE_FILE_PATH, JSON.stringify(state, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  const enablerId = args.includes('--enabler') ? args[args.indexOf('--enabler') + 1] : null;

  const context = await loadContextData();
  const state = await loadState();

  const enablersToProcess = enablerId
    ? context.enablers.filter(e => e.id === enablerId)
    : context.enablers.filter(e => !state.completed.includes(e.id));

  if (enablerId && enablersToProcess.length === 0) {
      console.error(`Error: Enabler with ID "${enablerId}" not found.`);
      process.exit(1);
  }

  for (const enabler of enablersToProcess) {
    try {
      const flashcards = await generateFlashcardsForEnabler(enabler, context);
      await saveFlashcards(enabler, flashcards);
      if (!state.completed.includes(enabler.id)) {
        state.completed.push(enabler.id);
      }
    } catch (error) {
      console.error(`Failed to generate flashcards for ${enabler.id}:`, error);
      state.failed.push(enabler.id);
    } finally {
      await saveState(state);
    }
  }

  console.log('Flashcard generation complete.');
}

main().catch(error => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});

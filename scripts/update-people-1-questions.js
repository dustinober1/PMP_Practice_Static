#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dir = path.join(__dirname, '..', 'src', 'data', 'questions', 'people', 'people-1');
let updatedCount = 0;

(async () => {
  let files;
  try {
    files = (await fs.promises.readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch (err) {
    console.error('Failed to read directory:', dir);
    process.exit(1);
  }

  for (const file of files) {
    const filePath = path.join(dir, file);
    let content;
    try {
      content = await fs.promises.readFile(filePath, 'utf8');
    } catch (err) {
      console.error('Failed to read file:', filePath);
      continue;
    }

    let questions;
    try {
      questions = JSON.parse(content);
    } catch (err) {
      console.error('JSON parse error in file:', filePath);
      continue;
    }

    let changed = false;
    if (Array.isArray(questions)) {
      questions.forEach((q) => {
        if (typeof q === 'object' && q !== null) {
          if (!('process' in q)) {
            q.process = 'plan-stakeholder-engagement';
            changed = true;
            updatedCount++;
          }
          if (!('knowledgeAreaId' in q)) {
            q.knowledgeAreaId = 'stakeholder';
            changed = true;
          }
        }
      });
    }

    if (changed) {
      const newContent = JSON.stringify(questions, null, 2) + '\\n';
      try {
        await fs.promises.writeFile(filePath, newContent, 'utf8');
      } catch (err) {
        console.error('Failed to write file:', filePath);
      }
    }
  }

  console.log('Updated', updatedCount, 'questions with process/knowledgeAreaId fields.');
})();

#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const questionsDir = path.join(__dirname, '..', 'src', 'data', 'questions', 'people', 'people-1');
const enablersPath = path.join(__dirname, '..', 'src', 'data', 'enablers.json');
const processesPath = path.join(__dirname, '..', 'src', 'data', 'processes.json');
const knowledgePath = path.join(__dirname, '..', 'src', 'data', 'knowledge_areas.json');

async function loadJson(p) {
  const raw = await fs.promises.readFile(p, 'utf8');
  return JSON.parse(raw);
}

async function main() {
  // Load reference data
  const enablers = await loadJson(enablersPath);
  const processes = await loadJson(processesPath);
  const knowledges = await loadJson(knowledgePath);

  const enablerSet = new Set(enablers.map(e => e.id));
  const processSet = new Set(processes.map(p => p.id));
  const knowledgeSet = new Set(knowledges.map(k => k.id));

  // Collect all question files under the directory (could be multiple JSON files)
  const entries = await fs.promises.readdir(questionsDir, { withFileTypes: true });
  let issues = [];
  let totalQuestions = 0;
  const enablerCounts = {};
  for (const e of enablerSet) enablerCounts[e] = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(questionsDir, entry.name);
    let content;
    try {
      content = await fs.promises.readFile(filePath, 'utf8');
    } catch (err) {
      issues.push({ file: filePath, error: 'Failed to read file' });
      continue;
    }

    let questions;
    try {
      questions = JSON.parse(content);
    } catch (err) {
      issues.push({ file: filePath, error: 'Invalid JSON' });
      continue;
    }

    const list = Array.isArray(questions) ? questions : [questions];
    for (const q of list) {
      totalQuestions += 1;
      // Basic field checks
      const requiredFields = ['domainId','taskId','enablerIds','text','options','correctOptionId','explanation','difficulty','topics','process','knowledgeAreaId'];
      const missing = requiredFields.filter(f => !(f in q));
      if (missing.length > 0) {
        issues.push({ file: filePath, questionId: q?.id ?? 'UNKNOWN', error: `Missing fields: ${missing.join(', ')}` });
      }

      // enablerIds check
      if (Array.isArray(q.enablerIds)) {
        for (const eid of q.enablerIds) {
          if (!enablerSet.has(eid)) {
            issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: `Unknown enablerId: ${eid}` });
          } else {
            enablerCounts[eid] = (enablerCounts[eid] ?? 0) + 1;
          }
        }
      }

      // options checks
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: 'There must be exactly 4 options (a-d).' });
      } else {
        const optionIds = q.options.map(o => o.id);
        const hasAllIds = ['a','b','c','d'].every(id => optionIds.includes(id));
        if (!hasAllIds) {
          issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: 'Options must include ids a, b, c, d.' });
        }
        // correctOptionId validity
        if (!optionIds.includes(q.correctOptionId)) {
          issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: 'correctOptionId must be one of a/b/c/d.' });
        }
        // option labels existence
        const labelsMissing = q.options.filter(o => !('label' in o) || typeof o.label !== 'string' || o.label.trim() === '');
        if (labelsMissing.length > 0) {
          issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: 'All options must have non-empty label fields.' });
        }
      }

      // process/knowledgeAreaId validity
      if (typeof q.process === 'string' && !processSet.has(q.process)) {
        issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: `Unknown process: ${q.process}` });
      }
      if (typeof q.knowledgeAreaId === 'string' && !knowledgeSet.has(q.knowledgeAreaId)) {
        issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: `Unknown knowledgeAreaId: ${q.knowledgeAreaId}` });
      }

      // difficulty check
      if (!['easy','medium','hard'].includes(q.difficulty)) {
        issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: `Invalid difficulty: ${q.difficulty}` });
      }

      // text check
      if (typeof q.text !== 'string' || q.text.trim() === '') {
        issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: 'Question text is empty.' });
      }

      // basic sanity: at least one enabler per question
      if (!Array.isArray(q.enablerIds) || q.enablerIds.length === 0) {
        issues.push({ file: filePath, questionId: q.id ?? 'UNKNOWN', error: 'Question must reference at least one enablerId.' });
      }
    }
  }

  // Validate enabler coverage (exactly 25 references per enabler present)
  const coverageTarget = 25;
  const coverageGaps = [];
  for (const [eid, count] of Object.entries(enablerCounts)) {
    if (count !== coverageTarget) {
      coverageGaps.push({ enablerId: eid, count, expected: coverageTarget });
    }
  }

  const result = {
    totalQuestionsCompared: totalQuestions,
    issues,
    coverageGaps
  };

  const outPath = path.join(__dirname, '..', 'scripts', 'validation-results-people-1.json');
  await fs.promises.writeFile(outPath, JSON.stringify(result, null, 2) + '\n', 'utf8');

  console.log('Validation complete. Found', issues.length, 'issues. Coverage gaps for enablers:', coverageGaps.length);
  console.log('Results written to', outPath);
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

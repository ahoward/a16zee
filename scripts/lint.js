#!/usr/bin/env node
// lint.js — validate every content/zazen/*.yml.
// fails non-zero on any error so CI blocks the merge.

import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, '..');
const CONTENT    = path.join(ROOT, 'content', 'zazen');

// the build script declares which motifs are valid. parse them out so we
// don't have to maintain the list in two places.
const MOTIFS = (() => {
  const src = fs.readFileSync(path.join(__dirname, 'build.js'), 'utf8');
  const block = src.match(/const motifs = \{([\s\S]*?)\};/);
  if (!block) return [];
  return [...block[1].matchAll(/^\s*'([a-z0-9-]+)'\s*:/gm)].map(m => m[1]);
})();

const FORBIDDEN_WORDS = ['disrupt']; // PRD-mandated. add as needed.

const errors = [];
function err(file, msg) { errors.push(`  ${file}: ${msg}`); }

// --- syllable counter -------------------------------------------------------
// english heuristic; good enough to catch wildly off counts (1, 2, 12).
// based on the standard "count vowel groups, subtract silent e" approach.
function syllables(word) {
  word = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!word) return 0;
  // exceptions for common cases the heuristic flubs
  const exact = { 'the': 1, 'a': 1, 'i': 1, 'are': 1, 'were': 1, 'they': 1,
                  'fire': 1, 'tire': 1, 'hire': 1,
                  'a16z': 4, 'a16zee': 4, 'a17z': 4, 'api': 3, 'ai': 2,
                  'tam': 1, 'ceo': 3, 'cto': 3, 'pmf': 3,
                  'github': 2, 'commit': 2, 'commits': 2 };
  if (exact[word] !== undefined) return exact[word];
  let count = 0, prevVowel = false;
  for (let i = 0; i < word.length; i++) {
    const isVowel = 'aeiouy'.includes(word[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  // silent e
  if (word.endsWith('e') && count > 1 && !word.endsWith('le')) count--;
  return Math.max(1, count);
}

function lineSyllables(line) {
  // strip punctuation and numerals; split on whitespace
  return line
    .toLowerCase()
    .replace(/[^a-z'0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, w) => sum + syllables(w), 0);
}

// --- main -------------------------------------------------------------------

const files = fs.readdirSync(CONTENT).filter(f => f.endsWith('.yml'));
if (files.length === 0) err('content/zazen', 'no .yml files found');

let okCount = 0;
const seenSlugs = new Set();

for (const f of files) {
  const file = `content/zazen/${f}`;
  let data;
  try {
    data = yaml.load(fs.readFileSync(path.join(CONTENT, f), 'utf8'));
  } catch (e) {
    err(file, `yaml parse error: ${e.message}`);
    continue;
  }
  if (!data || typeof data !== 'object') {
    err(file, 'top-level must be a mapping');
    continue;
  }

  // required fields
  for (const key of ['slug', 'title', 'author', 'body', 'motif']) {
    if (!data[key]) err(file, `missing required field: ${key}`);
  }
  if (errors.length && errors[errors.length - 1].startsWith(`  ${file}:`)) continue;

  // slug must match filename (without .yml)
  const expectedSlug = f.replace(/\.yml$/, '');
  if (data.slug !== expectedSlug) {
    err(file, `slug "${data.slug}" must match filename "${expectedSlug}"`);
  }
  // slug must be url-safe
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(data.slug || '')) {
    err(file, `slug "${data.slug}" must be lowercase, alphanumeric, hyphens only, no leading/trailing hyphen`);
  }
  if (seenSlugs.has(data.slug)) {
    err(file, `duplicate slug "${data.slug}"`);
  }
  seenSlugs.add(data.slug);

  // motif must be one we render
  if (data.motif && !MOTIFS.includes(data.motif)) {
    err(file, `unknown motif "${data.motif}". valid: ${MOTIFS.join(', ')}`);
  }

  // body must be a string, exactly 3 non-empty lines
  if (typeof data.body !== 'string') {
    err(file, 'body must be a multiline string');
  } else {
    const lines = data.body.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length !== 3) {
      err(file, `body must have exactly 3 lines, got ${lines.length}`);
    } else {
      const counts = lines.map(lineSyllables);
      const expected = [5, 7, 5];
      for (let i = 0; i < 3; i++) {
        // tolerance of ±1 — english heuristic isn't perfect, and we'd rather
        // not reject a funny haiku because "fire" counts as 1.5
        if (Math.abs(counts[i] - expected[i]) > 1) {
          err(file, `line ${i+1} should be ~${expected[i]} syllables, got ${counts[i]} ("${lines[i]}")`);
        }
      }
    }

    // forbidden words
    const lower = data.body.toLowerCase();
    for (const w of FORBIDDEN_WORDS) {
      if (lower.includes(w)) err(file, `body contains forbidden word "${w}"`);
    }
  }

  // title sanity
  if (typeof data.title !== 'string' || data.title.length > 60) {
    err(file, 'title must be a string ≤ 60 chars');
  }

  // author sanity
  if (typeof data.author !== 'string' || data.author.length > 60) {
    err(file, 'author must be a string ≤ 60 chars');
  }

  if (errors.length === 0 || !errors[errors.length - 1].startsWith(`  ${file}:`)) {
    okCount++;
  }
}

if (errors.length) {
  console.error(`✗ lint failed:`);
  for (const e of errors) console.error(e);
  console.error(`\n${errors.length} issue(s) across ${files.length} file(s).`);
  process.exit(1);
}

console.log(`✓ lint ok: ${okCount}/${files.length} haikus, ${MOTIFS.length} motifs available`);

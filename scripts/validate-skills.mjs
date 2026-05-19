#!/usr/bin/env node
/**
 * AI Green Skills — machine-readable layer validator.
 *
 * Scope (intentionally narrow):
 *   1. Every skill folder under skills/ that ships an OPTIONAL skill.yaml is
 *      validated against schemas/skill.schema.json.
 *   2. The folder name MUST match the manifest `id`.
 *   3. A SKILL.md MUST exist next to the manifest.
 *   4. skills/index.json (if present) is validated against schemas/index.schema.json
 *      and cross-checked with discovered manifests.
 *
 * Out of scope:
 *   - The content/prose of SKILL.md (kept free-form on purpose).
 *   - Skills that ship NO skill.yaml — they remain valid as-is.
 */
import fg from 'fast-glob';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

function loadSchema(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
}

const validateSkill = ajv.compile(loadSchema('schemas/skill.schema.json'));
const validateIndex = ajv.compile(loadSchema('schemas/index.schema.json'));

let errors = 0;
const fail = (msg) => { console.error(`❌ ${msg}`); errors++; };
const ok   = (msg) => { console.log(`✅ ${msg}`); };

// ── 1. Discover and validate skill manifests ────────────────────────────────
const manifests = await fg(['skills/*/skill.yaml', 'skills/*/skill.yml'], { cwd: ROOT });
const discovered = [];

for (const manifestRel of manifests) {
  const dir = path.dirname(manifestRel);
  const folderId = path.basename(dir);
  const skillMdPath = path.join(dir, 'SKILL.md');

  if (!fs.existsSync(path.join(ROOT, skillMdPath))) {
    fail(`${manifestRel}: missing companion SKILL.md (the prose contract must remain the source of truth).`);
    continue;
  }

  let data;
  try {
    data = YAML.parse(fs.readFileSync(path.join(ROOT, manifestRel), 'utf8'));
  } catch (e) {
    fail(`${manifestRel}: invalid YAML — ${e.message}`);
    continue;
  }

  if (!validateSkill(data)) {
    fail(manifestRel);
    for (const e of validateSkill.errors) {
      console.error(`   ${e.instancePath || '/'} ${e.message}`);
    }
    continue;
  }

  if (data.id !== folderId) {
    fail(`${manifestRel}: id="${data.id}" must match folder name "${folderId}".`);
    continue;
  }

  discovered.push({
    id: data.id,
    path: `skills/${folderId}`,
    version: data.version,
    capabilities: data.capabilities,
    languages: data.languages ?? [],
    gci_refs: data.gci_refs ?? []
  });
  ok(`${data.id} v${data.version} [${data.capabilities.join(', ')}]`);
}

// ── 2. Validate skills/index.json if present, and cross-check ──────────────
const indexPath = path.join(ROOT, 'skills/index.json');
if (fs.existsSync(indexPath)) {
  let idx;
  try {
    idx = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (e) {
    fail(`skills/index.json: invalid JSON — ${e.message}`);
  }
  if (idx && !validateIndex(idx)) {
    fail('skills/index.json');
    for (const e of validateIndex.errors) {
      console.error(`   ${e.instancePath || '/'} ${e.message}`);
    }
  }
  if (idx && validateIndex(idx)) {
    const byId = new Map(idx.skills.map(s => [s.id, s]));
    for (const d of discovered) {
      const i = byId.get(d.id);
      if (!i) {
        fail(`skills/index.json: missing entry for "${d.id}" (manifest exists).`);
      } else if (i.version !== d.version) {
        fail(`skills/index.json: "${d.id}" version mismatch — index=${i.version}, manifest=${d.version}.`);
      }
    }
    for (const entry of idx.skills) {
      const stillThere = discovered.find(d => d.id === entry.id);
      if (!stillThere) {
        const manifestExists = fs.existsSync(path.join(ROOT, entry.path, 'skill.yaml'))
                            || fs.existsSync(path.join(ROOT, entry.path, 'skill.yml'));
        if (!manifestExists) {
          fail(`skills/index.json: entry "${entry.id}" has no manifest at ${entry.path}/skill.yaml.`);
        }
      }
    }
    ok(`skills/index.json — ${idx.skills.length} entry(ies)`);
  }
}

// ── 3. Report ───────────────────────────────────────────────────────────────
if (errors > 0) {
  console.error(`\n${errors} error(s).`);
  process.exit(1);
}
console.log(`\nAll ${discovered.length} machine-readable skill manifest(s) valid.`);


#!/usr/bin/env node

/**
 * Standalone .dops v2 file validator for CI.
 * Dependencies: js-yaml (npm install js-yaml)
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import yaml from "js-yaml";

const ROOT = new URL("..", import.meta.url).pathname;
const NAME_RE = /^[a-z][a-z0-9-]*$/;

// ── Glob all .dops files ──────────────────────────────────────────────────────

function globDops(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith(".")) {
      results.push(...globDops(full));
    } else if (entry.isFile() && entry.name.endsWith(".dops")) {
      results.push(full);
    }
  }
  return results;
}

// ── Validate a single file ────────────────────────────────────────────────────

function validate(filePath) {
  const errors = [];
  const rel = relative(ROOT, filePath);

  let raw;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (e) {
    return { file: rel, errors: [`Cannot read file: ${e.message}`] };
  }

  // Split frontmatter
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    return { file: rel, errors: ["Missing YAML frontmatter (---/--- delimiters)"] };
  }

  const [, yamlStr, markdown] = fmMatch;

  // Parse YAML
  let fm;
  try {
    fm = yaml.load(yamlStr);
  } catch (e) {
    return { file: rel, errors: [`Invalid YAML: ${e.message}`] };
  }

  if (typeof fm !== "object" || fm === null) {
    return { file: rel, errors: ["Frontmatter must be a YAML object"] };
  }

  // dops version
  if (fm.dops !== "v2") {
    errors.push(`dops must be "v2", got "${fm.dops}"`);
  }

  // kind must be "skill" — legacy "tool" format is not supported
  if (fm.kind !== "skill") {
    errors.push(`kind must be "skill", got "${fm.kind}"`);
  }

  // meta
  if (!fm.meta || typeof fm.meta !== "object") {
    errors.push("Missing meta block");
  } else {
    if (!fm.meta.name || !NAME_RE.test(fm.meta.name)) {
      errors.push(`meta.name must match ${NAME_RE}, got "${fm.meta.name}"`);
    }
    if (!fm.meta.version) {
      errors.push("Missing meta.version");
    }
    if (!fm.meta.description) {
      errors.push("Missing meta.description");
    }
  }

  // context
  if (!fm.context || typeof fm.context !== "object") {
    errors.push("Missing context block");
  } else {
    if (!fm.context.technology) errors.push("Missing context.technology");
    if (!fm.context.fileFormat) errors.push("Missing context.fileFormat");
    if (!fm.context.outputGuidance) errors.push("Missing context.outputGuidance");
    if (!Array.isArray(fm.context.bestPractices) || fm.context.bestPractices.length < 5) {
      errors.push("context.bestPractices must have at least 5 entries");
    }
  }

  // files
  if (!Array.isArray(fm.files) || fm.files.length === 0) {
    errors.push("files must be a non-empty array");
  } else {
    for (const f of fm.files) {
      if (!f.path) errors.push("Each file entry must have a path");
      if (!f.format) errors.push(`File entry "${f.path}" missing format`);
    }
  }

  // permissions
  if (!fm.permissions || typeof fm.permissions !== "object") {
    errors.push("Missing permissions block");
  }

  // risk
  if (!fm.risk || typeof fm.risk !== "object") {
    errors.push("Missing risk block");
  } else {
    if (!["LOW", "MEDIUM", "HIGH"].includes(fm.risk.level)) {
      errors.push(`risk.level must be LOW, MEDIUM, or HIGH, got "${fm.risk.level}"`);
    }
  }

  // Required markdown sections
  if (!markdown.includes("## Prompt")) {
    errors.push("Missing ## Prompt section");
  }
  if (!markdown.includes("## Keywords")) {
    errors.push("Missing ## Keywords section");
  }

  return { file: rel, errors, name: fm.meta?.name };
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = globDops(ROOT);

if (files.length === 0) {
  console.error("No .dops files found");
  process.exit(1);
}

console.log(`Found ${files.length} .dops files\n`);

const results = files.map(validate);
const names = new Map();
let hasErrors = false;

// Cross-file uniqueness — community skills may share a name with built-in counterparts,
// but warn so contributors know they are shadowing a built-in skill.
const warnings = [];
for (const r of results) {
  if (r.name) {
    if (names.has(r.name)) {
      const existing = names.get(r.name);
      const oneIsBuiltIn = existing.startsWith("built-in/") || r.file.startsWith("built-in/");
      if (oneIsBuiltIn) {
        warnings.push(`WARN  ${r.file} shadows built-in skill "${r.name}" (from ${existing})`);
      } else {
        r.errors.push(`Duplicate meta.name "${r.name}" (also in ${existing})`);
      }
    } else {
      names.set(r.name, r.file);
    }
  }
}

// Print results
for (const r of results) {
  if (r.errors.length > 0) {
    hasErrors = true;
    console.log(`FAIL  ${r.file}`);
    for (const e of r.errors) {
      console.log(`      - ${e}`);
    }
  } else {
    console.log(`PASS  ${r.file}`);
  }
}

if (warnings.length > 0) {
  console.log("");
  for (const w of warnings) {
    console.log(w);
  }
}

console.log(`\n${results.length} files checked, ${results.filter((r) => r.errors.length > 0).length} failed`);

if (hasErrors) {
  process.exit(1);
}

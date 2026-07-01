/**
 * Unit tests for templates/ — manifest, rubric heading alignment, stage file presence.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkCompleteness } from '../../cli/src/quality/checks/completeness.js';
import {
  loadManifest,
  resolveTemplatesDir,
  loadTemplatesForStage,
} from '../../cli/src/templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const RUBRIC_PATH = path.join(ROOT, 'BABOK_AGENT', 'agents', 'quality_scoring_rubric.json');
const STAGES_DIR = path.join(ROOT, 'BABOK_AGENT', 'stages');

describe('templates manifest', () => {
  it('manifest.json exists and covers stages 0–8', () => {
    const manifest = loadManifest(TEMPLATES_DIR);
    for (let n = 0; n <= 8; n++) {
      assert.ok(manifest.stages[String(n)], `missing stage ${n} in manifest`);
      assert.ok(manifest.stages[String(n)].primary, `missing primary for stage ${n}`);
    }
  });

  it('all manifest template paths exist on disk', () => {
    const manifest = loadManifest(TEMPLATES_DIR);
    const paths = new Set();
    for (const cfg of Object.values(manifest.stages)) {
      paths.add(cfg.primary);
      for (const m of cfg.modules || []) paths.add(m);
    }
    for (const pack of Object.values(manifest.industry_supplements || {})) {
      for (const stageFiles of Object.values(pack)) {
        for (const f of stageFiles) paths.add(f);
      }
    }
    for (const rel of paths) {
      const fp = path.join(TEMPLATES_DIR, rel);
      assert.ok(fs.existsSync(fp), `missing template file: ${rel}`);
    }
  });
});

describe('stage skeleton rubric alignment', () => {
  const rubric = JSON.parse(fs.readFileSync(RUBRIC_PATH, 'utf-8'));

  for (let n = 1; n <= 8; n++) {
    it(`stage ${n} skeleton passes completeness check against rubric`, () => {
      const { text, requiredSections } = loadTemplatesForStage(n, { includeModules: false });
      const primaryOnly = text;
      const sections = rubric.stages[`stage${n}`].required_sections;
      assert.deepEqual(requiredSections, sections);
      const { score, issues } = checkCompleteness(primaryOnly, sections);
      assert.equal(score, 100, `missing sections: ${issues.map(i => i.message).join('; ')}`);
    });
  }
});

describe('stage prompt refactor', () => {
  it('stage prompts do not contain embedded markdown deliverable blocks', () => {
    const files = fs.readdirSync(STAGES_DIR).filter(f => /^BABOK_agent_stage_\d+\.md$/.test(f));
    for (const file of files) {
      const content = fs.readFileSync(path.join(STAGES_DIR, file), 'utf8');
      assert.ok(
        content.includes('templates/stages/STAGE_'),
        `${file} should reference templates/stages/`
      );
      assert.ok(
        !content.includes('## Deliverable Template: STAGE_'),
        `${file} still has embedded deliverable template header`
      );
    }
  });
});

describe('resolveTemplatesDir', () => {
  it('resolves package templates directory', () => {
    const dir = resolveTemplatesDir();
    assert.ok(fs.existsSync(path.join(dir, 'manifest.json')));
  });
});

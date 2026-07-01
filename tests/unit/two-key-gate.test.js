/**
 * Unit tests for Two-Key Journal gate logic.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  sha256Content,
  assertCanSaveDeliverable,
  validateTwoKeyApproval,
  ensureStageTwoKeyFields,
} from '../../babok-mcp/src/lib/two-key-gate.js';

const SAMPLE = '# Charter\n\nGo.';

describe('two-key-gate', () => {
  test('sha256Content is deterministic', () => {
    const a = sha256Content(SAMPLE);
    const b = sha256Content(SAMPLE);
    assert.equal(a, b);
    assert.match(a, /^[a-f0-9]{64}$/);
  });

  test('assertCanSaveDeliverable blocks approved without revision', () => {
    const stage = { stage: 0, status: 'approved', revision_open: false };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => assertCanSaveDeliverable(stage), /approved and locked/);
  });

  test('assertCanSaveDeliverable allows approved with revision_open', () => {
    const stage = { stage: 0, status: 'approved', revision_open: true };
    ensureStageTwoKeyFields(stage);
    assert.doesNotThrow(() => assertCanSaveDeliverable(stage));
  });

  test('validateTwoKeyApproval requires matching SHA pair', () => {
    const sha = sha256Content(SAMPLE);
    const stage = {
      stage: 0,
      agent_submission: { content_sha256: sha, review_id: 'rev-1', at: '2026-01-01' },
      human_attestation: { content_sha256: sha, attestor: 'Human', spot_check_passed: true, at: '2026-01-01' },
      revision_open: false,
    };
    ensureStageTwoKeyFields(stage);
    assert.doesNotThrow(() => validateTwoKeyApproval(stage, sha));
  });

  test('validateTwoKeyApproval rejects SHA mismatch', () => {
    const stage = {
      stage: 1,
      agent_submission: { content_sha256: 'a'.repeat(64) },
      human_attestation: { content_sha256: 'b'.repeat(64), spot_check_passed: true },
      revision_open: false,
    };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => validateTwoKeyApproval(stage), /mismatch/);
  });

  test('validateTwoKeyApproval rejects missing agent_submission', () => {
    const stage = { stage: 0, human_attestation: { content_sha256: 'x', spot_check_passed: true } };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => validateTwoKeyApproval(stage), /agent_submission/);
  });

  test('validateTwoKeyApproval rejects spot_check_passed false', () => {
    const sha = sha256Content(SAMPLE);
    const stage = {
      stage: 0,
      agent_submission: { content_sha256: sha },
      human_attestation: { content_sha256: sha, spot_check_passed: false },
    };
    ensureStageTwoKeyFields(stage);
    assert.throws(() => validateTwoKeyApproval(stage), /spot-check/);
  });
});

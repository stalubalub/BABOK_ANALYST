import fs from 'fs';
import path from 'path';
import { getProjectDir, getJournalPath, STAGES } from './project.js';
import {
  assertCanSaveDeliverable,
  generateReviewId,
  hashFileUtf8,
  normalizeJournalTwoKey,
  validateTwoKeyApproval,
} from './two-key-gate.js';

export const STAGE_FILE_NAMES = {
  0: 'STAGE_00_Project_Charter.md',
  1: 'STAGE_01_Project_Initialization.md',
  2: 'STAGE_02_Current_State_Analysis.md',
  3: 'STAGE_03_Problem_Domain_Analysis.md',
  4: 'STAGE_04_Solution_Requirements.md',
  5: 'STAGE_05_Future_State_Design.md',
  6: 'STAGE_06_Gap_Analysis_Roadmap.md',
  7: 'STAGE_07_Risk_Assessment.md',
  8: 'STAGE_08_Business_Case_ROI.md',
};

const STAGE_ENTRY_DEFAULTS = {
  completed_at: null,
  approved_at: null,
  approved_by: null,
  deliverable_file: null,
  notes: '',
  agent_submission: null,
  human_attestation: null,
  revision_open: false,
};

export function createJournal(projectId, projectName, language = 'EN', mode = 'standard') {
  const now = new Date().toISOString();
  const activeStages = mode === 'light'
    ? STAGES.filter(s => s.stage === 0 || s.stage === 8)
    : STAGES;

  const journal = {
    project_id: projectId,
    project_name: projectName,
    language,
    mode,
    created_at: now,
    last_updated: now,
    current_stage: activeStages[0]?.stage ?? 0,
    current_status: 'in_progress',
    stages: activeStages.map((s, i) => ({
      stage: s.stage,
      name: s.name,
      status: i === 0 ? 'in_progress' : 'not_started',
      started_at: i === 0 ? now : null,
      ...STAGE_ENTRY_DEFAULTS,
    })),
    decisions: [],
    assumptions: [],
    open_questions: [],
  };

  const dir = getProjectDir(projectId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getJournalPath(projectId), JSON.stringify(journal, null, 2), 'utf-8');
  return journal;
}

export function readJournal(projectId) {
  const journalPath = getJournalPath(projectId);
  if (!fs.existsSync(journalPath)) {
    throw new Error(`Journal not found for project: ${projectId}`);
  }
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
  normalizeJournalTwoKey(journal);
  return journal;
}

export function writeJournal(projectId, journal) {
  journal.last_updated = new Date().toISOString();
  fs.writeFileSync(getJournalPath(projectId), JSON.stringify(journal, null, 2), 'utf-8');
}

export function submitForReview(projectId, stageNumber, contentSha256, reviewId) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status === 'approved' && !stage.revision_open) {
    throw new Error(`Stage ${stageNumber} is approved. Call babok open-revision to edit.`);
  }

  const now = new Date().toISOString();
  stage.agent_submission = {
    at: now,
    content_sha256: contentSha256,
    review_id: reviewId || generateReviewId(),
  };
  stage.human_attestation = null;
  stage.revision_open = false;

  writeJournal(projectId, journal);
  return journal;
}

export function attestStage(projectId, stageNumber, attestor, spotCheckPassed, contentSha256) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status === 'approved') throw new Error(`Stage ${stageNumber} is already approved`);

  stage.human_attestation = {
    at: new Date().toISOString(),
    content_sha256: contentSha256,
    attestor: attestor || 'Human',
    spot_check_passed: Boolean(spotCheckPassed),
  };

  writeJournal(projectId, journal);
  return journal;
}

export function openRevision(projectId, stageNumber) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status !== 'approved') {
    throw new Error(`Stage ${stageNumber} is not approved (status: ${stage.status}). Nothing to revise.`);
  }

  const now = new Date().toISOString();
  stage.status = 'in_progress';
  stage.revision_open = true;
  stage.agent_submission = null;
  stage.human_attestation = null;
  stage.approved_at = null;
  stage.approved_by = null;
  stage.completed_at = null;
  journal.current_stage = stageNumber;
  journal.current_status = 'in_progress';

  const next = journal.stages.find(s => s.stage === stageNumber + 1);
  if (next && next.status === 'in_progress') {
    next.status = 'not_started';
    next.started_at = null;
  }

  writeJournal(projectId, journal);
  return journal;
}

export function guardSaveDeliverable(stage) {
  assertCanSaveDeliverable(stage);
}

export function approveStage(projectId, stageNumber, notes, deliverableSha256) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);
  if (stage.status === 'approved') throw new Error(`Stage ${stageNumber} is already approved`);

  validateTwoKeyApproval(stage, deliverableSha256);

  const now = new Date().toISOString();
  stage.status = 'approved';
  stage.approved_at = now;
  stage.approved_by = stage.human_attestation?.attestor || 'Human';
  stage.revision_open = false;
  if (!stage.completed_at) stage.completed_at = now;
  if (notes) stage.notes = notes;

  const currentIdx = journal.stages.findIndex(s => s.stage === stageNumber);
  const nextStage = currentIdx !== -1 ? journal.stages[currentIdx + 1] : null;
  if (nextStage && nextStage.status === 'not_started') {
    nextStage.status = 'in_progress';
    nextStage.started_at = now;
    journal.current_stage = nextStage.stage;
    journal.current_status = 'in_progress';
  } else if (!nextStage) {
    journal.current_status = 'completed';
  }

  writeJournal(projectId, journal);
  return journal;
}

export function rejectStage(projectId, stageNumber, reason) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);

  stage.status = 'rejected';
  stage.notes = reason || 'Rejected without reason';
  stage.human_attestation = null;

  writeJournal(projectId, journal);
  return journal;
}

export function updateStageStatus(projectId, stageNumber, status, notes) {
  const journal = readJournal(projectId);
  const stage = journal.stages.find(s => s.stage === stageNumber);
  if (!stage) throw new Error(`Stage ${stageNumber} not found`);

  const now = new Date().toISOString();
  stage.status = status;
  if (notes) stage.notes = notes;
  if (status === 'in_progress' && !stage.started_at) stage.started_at = now;
  if (status === 'completed') stage.completed_at = now;

  journal.current_stage = stageNumber;
  journal.current_status = status;

  writeJournal(projectId, journal);
  return journal;
}

/**
 * Resolve deliverable path and UTF-8 content hash for a stage.
 * @param {string} projectId
 * @param {number} stageNumber
 * @returns {{ filePath: string, sha256: string|null }}
 */
export function getStageDeliverableHash(projectId, stageNumber) {
  const filename = STAGE_FILE_NAMES[stageNumber];
  const filePath = path.join(getProjectDir(projectId), filename);
  return { filePath, sha256: hashFileUtf8(filePath) };
}

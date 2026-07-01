---
description: BABOK Stage 4 — Solution Requirements Definition
---

# BABOK Stage 4: Solution Requirements Definition

## Stage Instructions

Read the full stage instructions from:
`BABOK_AGENT/stages/BABOK_agent_stage_4.md`

## Templates to Use

Primary deliverable skeleton (required H2 headings):

- `templates/stages/STAGE_04_Solution_Requirements.md`

Modules (see `templates/manifest.json`):

- `templates/modules/User_Story_Template.md`
- `templates/modules/RTM_Template.md`
- `templates/modules/Change_Request_Template.md`

MCP: `babok_get_stage_template(stage_n: 4, include_modules: true)`

## Prerequisites

- Stages 1-3 completed (read previous STAGE_0*.md files for context)

## Your Task

1. Define functional and non-functional requirements.
2. Generate a complete Stage 4 deliverable covering:
   - Functional requirements (FR-NNN) with MoSCoW
   - Non-functional requirements (NFR-NNN) with numeric thresholds
   - User stories with GIVEN-WHEN-THEN acceptance criteria
   - Requirements traceability matrix (RTM)
   - Change control process
   - Regulatory compliance requirements

3. Save by running:
   ```
   babok run --context my_project_context.json --stages 4 --output BABOK_Analysis
   ```

## Output Format

Professional Markdown following `templates/stages/STAGE_04_Solution_Requirements.md`.

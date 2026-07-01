import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dirs = [
  path.join(__dirname, '..', 'BABOK_AGENT', 'stages'),
  path.join(__dirname, '..', 'plugins', 'babok_analyst', 'BABOK_AGENT', 'stages'),
];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => /^BABOK_agent_stage_\d+\.md$/.test(f));

  for (const file of files) {
    const fp = path.join(dir, file);
    let content = fs.readFileSync(fp, 'utf8');
    const m = content.match(/## Deliverable Template: (STAGE_\d+_[^\n]+\.md)/);
    if (!m) {
      console.log('skip', path.relative(path.join(__dirname, '..'), fp));
      continue;
    }
    const templateName = m[1];
    const stageNum = file.match(/stage_(\d+)/)[1];
    const replacement = `## Deliverable Template

**Single source of truth:** \`templates/stages/${templateName}\`

Load before writing the deliverable:
- MCP: \`babok_get_stage_template\` with \`stage_n: ${stageNum}\`
- CLI/file: read \`templates/stages/${templateName}\`

**Critical:** Keep all H2 headings from the template unchanged so \`babok score\` completeness checks pass.
`;
    const newContent = content.replace(
      /## Deliverable Template:[\s\S]*?^```\s*$/m,
      replacement.trim()
    );
    if (newContent === content) {
      console.log('no change', path.relative(path.join(__dirname, '..'), fp));
    } else {
      fs.writeFileSync(fp, newContent, 'utf8');
      console.log('updated', path.relative(path.join(__dirname, '..'), fp));
    }
  }
}

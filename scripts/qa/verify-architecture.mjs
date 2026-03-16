import fs from 'node:fs';
import path from 'node:path';

// Define the expected boundaries from 03-component-architecture-spec.md
const EXPECTED_CLIENT_COMPONENTS = new Set([
  'sessions-index-controls.tsx',
  'sessions-table.tsx',
  'sessions-table-row-link.tsx',
  'session-trace-explorer.tsx',
  'session-trace-toolbar.tsx',
  'session-timeline.tsx',
  'session-timeline-rail.tsx',
  'thought-row.tsx',
  'timestamp-gap.tsx',
  'thought-detail-panel.tsx',
  'thought-card.tsx',
  'thought-metadata-disclosure.tsx'
]);

const EXPECTED_SERVER_COMPONENTS = new Set([
  'page.tsx', // applies to runs/page.tsx and runs/[runId]/page.tsx
  'sessions-index-header.tsx',
  'sessions-index-data-boundary.tsx',
  'sessions-table-shell.tsx',
  'sessions-empty-state.tsx',
  'sessions-error-state.tsx',
  'session-detail-header.tsx',
  'session-status-banner.tsx',
  'session-detail-data-boundary.tsx',
  'session-not-found-state.tsx',
  'session-load-error-state.tsx'
]);

function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  }
}

const DIRS_TO_CHECK = [
  path.join(process.cwd(), 'src/app/w/[workspaceSlug]/runs'),
  path.join(process.cwd(), 'src/components/session-area')
];

let hasErrors = false;

function reportError(filePath, message) {
  console.error(`❌ [Architecture Error] ${filePath}:\n   ${message}`);
  hasErrors = true;
}

const USE_CLIENT_REGEX = /^['"]use client['"];?/;

DIRS_TO_CHECK.forEach(dir => {
  walkDir(dir, (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const fileName = path.basename(filePath);
    const hasUseClient = USE_CLIENT_REGEX.test(content.trim());

    if (EXPECTED_CLIENT_COMPONENTS.has(fileName)) {
      if (!hasUseClient) {
        reportError(filePath, `Expected Client Component but missing "use client" directive at the top.`);
      }
    } else if (EXPECTED_SERVER_COMPONENTS.has(fileName)) {
      if (hasUseClient) {
        reportError(filePath, `Expected Server Component but found "use client" directive. This should be server-rendered.`);
      }
    } else {
      // Unspecified component, we'll just ignore or could warn. Let's ignore for flexibility.
    }
  });
});

if (hasErrors) {
  process.exit(1);
} else {
  console.log('✅ Architecture boundary check passed.');
}

import fs from 'node:fs';
import path from 'node:path';

// Define allowed and banned patterns according to spec 08
const ALLOWED_COLORS = [
  'slate',
  'brand',
  'blue', // For active/progress
  'emerald', // For completed/success
  'rose', // For abandoned/failure
  'violet', // For decisions
  'sky', // For actions
  'pink', // For beliefs
  'amber', // For assumptions
  'sessionLane',
  'white',
  'black',
  'transparent',
  'current'
];

const BANNED_COLORS = [
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'cyan',
  'indigo',
  'purple',
  'fuchsia'
];

// Tailwind classes like text-gray-500, bg-red-100, border-yellow-200
const bannedColorRegex = new RegExp(`\\b(text|bg|border|ring|stroke|fill)-(?:${BANNED_COLORS.join('|')})-\\d{2,3}\\b`, 'g');
const componentLibraryRegex = /import.*from ['"](?:lucide-react|@radix-ui|framer-motion|@heroicons|react-icons)['"]/g;

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

function reportError(filePath, lineNum, lineContent, message) {
  console.error(`❌ [Design Token Error] ${filePath}:${lineNum}\n   ${message}\n   > ${lineContent.trim()}`);
  hasErrors = true;
}

DIRS_TO_CHECK.forEach(dir => {
  walkDir(dir, (filePath) => {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // 1. Check for banned colors
      const bannedColorMatches = [...line.matchAll(bannedColorRegex)];
      if (bannedColorMatches.length > 0) {
        const matches = bannedColorMatches.map(m => m[0]).join(', ');
        reportError(filePath, lineNum, line, `Found banned color tokens (${matches}). Spec 08 allows: ${ALLOWED_COLORS.join(', ')}.`);
      }

      // 2. Check for banned component libraries
      const libraryMatches = [...line.matchAll(componentLibraryRegex)];
      if (libraryMatches.length > 0) {
        reportError(filePath, lineNum, line, `Found banned component library import. Spec 08 requires hand-authored Tailwind components with no external library dependencies.`);
      }
    });
  });
});

if (hasErrors) {
  process.exit(1);
} else {
  console.log('✅ Design token check passed.');
}

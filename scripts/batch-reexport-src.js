#!/usr/bin/env node

/**
 * Batch Re-Export Script for src/contexts, src/hocs, src/hooks
 */

const fs = require('fs');
const path = require('path');

const CONTEXTS_RE_EXPORT = `// Re-export from o24ui-framework package
export * from 'o24ui-framework/contexts';
`;

const CONTEXTS_RE_EXPORT_WITH_DEFAULT = `// Re-export from o24ui-framework package
export { default } from 'o24ui-framework/contexts';
export * from 'o24ui-framework/contexts';
`;

const HOCS_RE_EXPORT = `// Re-export from o24ui-framework package
export * from 'o24ui-framework/hocs';
`;

const HOCS_RE_EXPORT_WITH_DEFAULT = `// Re-export from o24ui-framework package
export { default } from 'o24ui-framework/hocs';
export * from 'o24ui-framework/hocs';
`;

const HOOKS_RE_EXPORT = `// Re-export from o24ui-framework package
export * from 'o24ui-framework/hooks';
`;

const HOOKS_RE_EXPORT_WITH_DEFAULT = `// Re-export from o24ui-framework package
export { default } from 'o24ui-framework/hooks';
export * from 'o24ui-framework/hooks';
`;

function replaceFile(filePath, reExportContent, reExportWithDefault) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const currentContent = fs.readFileSync(filePath, 'utf-8');
  const hasDefaultExport = currentContent.includes('export default');
  
  const content = hasDefaultExport ? reExportWithDefault : reExportContent;
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
  return true;
}

console.log('🔄 Replacing src/contexts, src/hocs, src/hooks with re-exports...\n');

let totalFiles = 0;

// Replace contexts
console.log('📁 Processing src/contexts/...');
const contextsToReplace = [
  'GlobalContext.tsx',
  'intersectionContext.tsx',
  'nextAuthProvider.tsx',
  'RowSelectionContext.tsx'
];

contextsToReplace.forEach(file => {
  const filePath = path.join(__dirname, '../src/contexts', file);
  if (replaceFile(filePath, CONTEXTS_RE_EXPORT, CONTEXTS_RE_EXPORT_WITH_DEFAULT)) {
    totalFiles++;
  }
});

// Replace hocs
console.log('\n📁 Processing src/hocs/...');
const hocsToReplace = ['AuthGuard.tsx', 'IdleTimer.tsx'];

hocsToReplace.forEach(file => {
  const filePath = path.join(__dirname, '../src/hocs', file);
  if (replaceFile(filePath, HOCS_RE_EXPORT, HOCS_RE_EXPORT_WITH_DEFAULT)) {
    totalFiles++;
  }
});

// Replace hooks
console.log('\n📁 Processing src/hooks/...');
const hooksToReplace = [
  'useBeforeUnload.ts',
  'useGlobalLogoutHandler.ts',
  'useLocale.ts'
];

hooksToReplace.forEach(file => {
  const filePath = path.join(__dirname, '../src/hooks', file);
  if (replaceFile(filePath, HOOKS_RE_EXPORT, HOOKS_RE_EXPORT_WITH_DEFAULT)) {
    totalFiles++;
  }
});

console.log(`\n✨ Complete! Replaced ${totalFiles} files with re-exports.\n`);

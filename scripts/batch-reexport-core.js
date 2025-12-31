#!/usr/bin/env node

/**
 * Batch Re-Export Script
 * Replaces framework files with re-exports from o24ui-framework package
 */

const fs = require('fs');
const path = require('path');

// Directories to replace with re-exports
const CORE_DIRS_TO_REPLACE = [
  'hooks',
  'stores', 
  'utils',
  'theme',
  'styles',
  'svg',
  'tailwind',
  'schemas'
];

const RE_EXPORT_CONTENT = `// Re-export from o24ui-framework package
export * from 'o24ui-framework/core';
`;

const RE_EXPORT_CONTENT_WITH_DEFAULT = `// Re-export from o24ui-framework package
export { default } from 'o24ui-framework/core';
export * from 'o24ui-framework/core';
`;

function replaceDirectoryWithReExports(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Skipping ${dirPath} - does not exist`);
    return;
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let count = 0;

  files.forEach(file => {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      // Recursively process subdirectories
      replaceDirectoryWithReExports(fullPath);
    } else if (file.name.match(/\.(ts|tsx)$/) && !file.name.includes('.d.ts')) {
      // Read current content to check if it has default export
      const currentContent = fs.readFileSync(fullPath, 'utf-8');
      const hasDefaultExport = currentContent.includes('export default');
      
      // Write re-export
      const content = hasDefaultExport ? RE_EXPORT_CONTENT_WITH_DEFAULT : RE_EXPORT_CONTENT;
      fs.writeFileSync(fullPath, content, 'utf-8');
      count++;
      console.log(`✅ ${path.relative(process.cwd(), fullPath)}`);
    }
  });

  return count;
}

console.log('🔄 Batch replacing @core directories with re-exports...\n');

let totalFiles = 0;

CORE_DIRS_TO_REPLACE.forEach(dir => {
  const dirPath = path.join(__dirname, '../src/@core', dir);
  console.log(`\n📁 Processing ${dir}/...`);
  const count = replaceDirectoryWithReExports(dirPath);
  totalFiles += count || 0;
});

console.log(`\n✨ Complete! Replaced ${totalFiles} files with re-exports.\n`);

#!/usr/bin/env node

/**
 * Batch Re-Export Script for @layouts and @menu
 * Replaces all layout and menu files with re-exports
 */

const fs = require('fs');
const path = require('path');

const RE_EXPORT_LAYOUTS = `// Re-export from o24ui-framework package
export * from 'o24ui-framework/layouts';
`;

const RE_EXPORT_LAYOUTS_WITH_DEFAULT = `// Re-export from o24ui-framework package
export { default } from 'o24ui-framework/layouts';
export * from 'o24ui-framework/layouts';
`;

const RE_EXPORT_MENU = `// Re-export from o24ui-framework package
export * from 'o24ui-framework/menu';
`;

const RE_EXPORT_MENU_WITH_DEFAULT = `// Re-export from o24ui-framework package
export { default } from 'o24ui-framework/menu';
export * from 'o24ui-framework/menu';
`;

function replaceDirectoryWithReExports(dirPath, reExportContent, reExportWithDefault) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Skipping ${dirPath} - does not exist`);
    return 0;
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let count = 0;

  files.forEach(file => {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      // Recursively process subdirectories
      count += replaceDirectoryWithReExports(fullPath, reExportContent, reExportWithDefault);
    } else if (file.name.match(/\.(ts|tsx)$/) && !file.name.includes('.d.ts')) {
      // Read current content to check if it has default export
      const currentContent = fs.readFileSync(fullPath, 'utf-8');
      const hasDefaultExport = currentContent.includes('export default');
      
      // Write re-export
      const content = hasDefaultExport ? reExportWithDefault : reExportContent;
      fs.writeFileSync(fullPath, content, 'utf-8');
      count++;
      console.log(`✅ ${path.relative(process.cwd(), fullPath)}`);
    }
  });

  return count;
}

console.log('🔄 Batch replacing @layouts and @menu with re-exports...\n');

let totalFiles = 0;

// Replace @layouts
console.log('📁 Processing @layouts/...');
const layoutsPath = path.join(__dirname, '../src/@layouts');
totalFiles += replaceDirectoryWithReExports(layoutsPath, RE_EXPORT_LAYOUTS, RE_EXPORT_LAYOUTS_WITH_DEFAULT);

console.log('\n📁 Processing @menu/...');
const menuPath = path.join(__dirname, '../src/@menu');
totalFiles += replaceDirectoryWithReExports(menuPath, RE_EXPORT_MENU, RE_EXPORT_MENU_WITH_DEFAULT);

console.log(`\n✨ Complete! Replaced ${totalFiles} files with re-exports.\n`);

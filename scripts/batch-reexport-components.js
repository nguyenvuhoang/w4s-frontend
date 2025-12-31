#!/usr/bin/env node

/**
 * Batch Re-Export Script for @core/components
 * Replaces framework components with re-exports, keeps app-specific ones
 */

const fs = require('fs');
const path = require('path');

// Component directories to replace (in framework)
const COMPONENTS_TO_REPLACE = [
  'custom-inputs',
  'customizer',
  'form-field',
  'formcontrol',
  'jSONEditor',
  'jTable',
  'layouts',
  'mui',
  'option-menu',
  'scroll-to-top',
  'xmlEditor'
];

// App-specific components to KEEP local
const KEEP_LOCAL = ['cButton', 'jSelect'];

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
    return 0;
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let count = 0;

  files.forEach(file => {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      // Recursively process subdirectories
      count += replaceDirectoryWithReExports(fullPath);
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

console.log('🔄 Batch replacing @core/components with re-exports...\n');
console.log(`⚠️  Keeping local: ${KEEP_LOCAL.join(', ')}\n`);

let totalFiles = 0;

COMPONENTS_TO_REPLACE.forEach(dir => {
  const dirPath = path.join(__dirname, '../src/@core/components', dir);
  console.log(`📁 Processing components/${dir}/...`);
  const count = replaceDirectoryWithReExports(dirPath);
  totalFiles += count;
});

// Handle ResolvedProps.tsx (top-level component file)
const resolvedPropsPath = path.join(__dirname, '../src/@core/components/ResolvedProps.tsx');
if (fs.existsSync(resolvedPropsPath)) {
  fs.writeFileSync(resolvedPropsPath, RE_EXPORT_CONTENT_WITH_DEFAULT, 'utf-8');
  console.log(`✅ src/@core/components/ResolvedProps.tsx`);
  totalFiles++;
}

console.log(`\n✨ Complete! Replaced ${totalFiles} component files with re-exports.`);
console.log(`\n✅ Kept local (app-specific): cButton/, jSelect/\n`);

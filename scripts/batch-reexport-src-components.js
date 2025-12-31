#!/usr/bin/env node

/**
 * Batch Re-Export Script for src/components (framework parts)
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_RE_EXPORT = `// Re-export from o24ui-framework package
export * from 'o24ui-framework/components';
`;

const COMPONENTS_RE_EXPORT_WITH_DEFAULT = `// Re-export from o24ui-framework package
export { default } from 'o24ui-framework/components';
export * from 'o24ui-framework/components';
`;

function replaceDirectoryWithReExports(dirPath) {
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });
  let count = 0;

  files.forEach(file => {
    const fullPath = path.join(dirPath, file.name);
    
    if (file.isDirectory()) {
      count += replaceDirectoryWithReExports(fullPath);
    } else if (file.name.match(/\.(ts|tsx)$/) && !file.name.includes('.d.ts')) {
      const currentContent = fs.readFileSync(fullPath, 'utf-8');
      const hasDefaultExport = currentContent.includes('export default');
      
      const content = hasDefaultExport ? COMPONENTS_RE_EXPORT_WITH_DEFAULT : COMPONENTS_RE_EXPORT;
      fs.writeFileSync(fullPath, content, 'utf-8');
      count++;
      console.log(`✅ ${path.relative(process.cwd(), fullPath)}`);
    }
  });

  return count;
}

function replaceFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return false;
  }

  const currentContent = fs.readFileSync(filePath, 'utf-8');
  const hasDefaultExport = currentContent.includes('export default');
  
  const content = hasDefaultExport ? COMPONENTS_RE_EXPORT_WITH_DEFAULT : COMPONENTS_RE_EXPORT;
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ ${path.relative(process.cwd(), filePath)}`);
  return true;
}

console.log('🔄 Replacing src/components (framework parts) with re-exports...\n');

let totalFiles = 0;

// Replace individual framework component files
const filesToReplace = [
  'AuthRedirect.tsx',
  'ClientSessionHandler.tsx',
  'LoadingSubmit.tsx',
  'LocaleValidator.tsx',
  'LoginLoading.tsx',
  'Providers.tsx'
];

filesToReplace.forEach(file => {
  const filePath = path.join(__dirname, '../src/components', file);
  if (replaceFile(filePath)) {
    totalFiles++;
  }
});

// Replace directories
const dirsToReplace = ['progressbar', 'spinners', 'tab', 'theme'];

dirsToReplace.forEach(dir => {
  console.log(`\n📁 Processing ${dir}/...`);
  const dirPath = path.join(__dirname, '../src/components', dir);
  totalFiles += replaceDirectoryWithReExports(dirPath);
});

console.log(`\n✨ Complete! Replaced ${totalFiles} files with re-exports.\n`);

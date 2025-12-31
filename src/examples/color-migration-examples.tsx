/**
 * Example Migration Script for Updating Colors
 * 
 * This file demonstrates how to migrate from hardcoded colors to the centralized config.
 * You can adapt this for your needs or use it as a reference.
 * 
 * NOTE: This file contains example code snippets and is not meant to be compiled.
 * It serves as a reference guide for developers migrating colors.
 */

/* eslint-disable */
// @ts-nocheck

// Example component BEFORE migration
const BeforeComponent = () => {
  return (
    <>
      {/* Hardcoded button color */}
      <Button 
        sx={{ 
          bgcolor: '#225087',
          '&:hover': { bgcolor: '#1780AC' },
          color: 'white',
          textTransform: 'none'
        }}
      >
        Submit
      </Button>

      {/* Hardcoded icon color */}
      <AddIcon sx={{ color: '#225087' }} />

      {/* Hardcoded typography */}
      <Typography sx={{ color: '#225087', fontWeight: 600 }}>
        Title
      </Typography>

      {/* Hardcoded table header */}
      <TableRow sx={{ 
        backgroundColor: '#225087',
        '& th': { color: 'white', fontWeight: 'bold' }
      }}>
        <TableCell>Column 1</TableCell>
      </TableRow>

      {/* Hardcoded with opacity */}
      <Box sx={{ 
        bgcolor: 'rgba(12,145,80,0.04)',
        border: '1px solid rgba(12,145,80,0.4)'
      }}>
        Content
      </Box>

      {/* Hardcoded border */}
      <ListItem sx={{
        borderLeft: '3px solid #225087'
      }}>
        Item
      </ListItem>
    </>
  )
}

// Example component AFTER migration
import brandColorConfig, { 
  brandButtonSx,
  brandIconSx,
  brandTypographySx,
  brandTableHeaderSx,
  getBrandColorWithOpacity
} from '@configs/brandColorConfig';

const AfterComponent = () => {
  return (
    <>
      {/* Using helper sx */}
      <Button sx={brandButtonSx}>
        Submit
      </Button>

      {/* Using helper sx */}
      <AddIcon sx={brandIconSx} />

      {/* Using helper sx */}
      <Typography sx={brandTypographySx}>
        Title
      </Typography>

      {/* Using helper sx */}
      <TableRow sx={brandTableHeaderSx}>
        <TableCell>Column 1</TableCell>
      </TableRow>

      {/* Using opacity helper */}
      <Box sx={{ 
        bgcolor: getBrandColorWithOpacity(0.04),
        border: `1px solid ${getBrandColorWithOpacity(0.4)}`
      }}>
        Content
      </Box>

      {/* Using config directly */}
      <ListItem sx={{
        borderLeft: `3px solid ${brandColorConfig.primary}`
      }}>
        Item
      </ListItem>
    </>
  )
}

// ============================================
// FIND & REPLACE PATTERNS
// ============================================

/**
 * Use these patterns in your IDE's find & replace:
 * 
 * 1. Button background:
 *    Find: bgcolor: '#225087'
 *    Replace: ...brandButtonSx (and add import)
 * 
 * 2. Icon color:
 *    Find: sx={{ color: '#225087' }}
 *    Replace: sx={brandIconSx} (and add import)
 * 
 * 3. Typography color:
 *    Find: sx={{ color: '#225087', fontWeight: 600 }}
 *    Replace: sx={brandTypographySx} (and add import)
 * 
 * 4. Table header:
 *    Find: backgroundColor: '#225087'
 *    Replace: ...brandTableHeaderSx (in table context)
 * 
 * 5. Opacity variants:
 *    Find: rgba(12,145,80,0.04)
 *    Replace: {getBrandColorWithOpacity(0.04)}
 * 
 * 6. Direct color reference:
 *    Find: '#225087'
 *    Replace: {brandColorConfig.primary}
 */

// ============================================
// ADVANCED MIGRATION EXAMPLES
// ============================================

// Example 1: Complex button with custom modifications
const AdvancedButtonBefore = () => (
  <Button 
    sx={{ 
      bgcolor: '#225087',
      '&:hover': { bgcolor: '#1780AC' },
      color: 'white',
      textTransform: 'none',
      px: 4,  // Custom padding
      py: 1.5
    }}
  >
    Custom Button
  </Button>
)

const AdvancedButtonAfter = () => (
  <Button 
    sx={{ 
      ...brandButtonSx,  // Spread the brand styles
      px: 4,  // Keep custom styles
      py: 1.5
    }}
  >
    Custom Button
  </Button>
)

// Example 2: Conditional styling
const ConditionalBefore = ({ isSelected }: { isSelected: boolean }) => (
  <Box sx={{
    borderLeft: isSelected ? '3px solid #225087' : '3px solid transparent',
    bgcolor: isSelected ? 'rgba(12,145,80,0.04)' : 'transparent'
  }}>
    Item
  </Box>
)

const ConditionalAfter = ({ isSelected }: { isSelected: boolean }) => (
  <Box sx={{
    borderLeft: isSelected 
      ? `3px solid ${brandColorConfig.primary}` 
      : '3px solid transparent',
    bgcolor: isSelected 
      ? getBrandColorWithOpacity(0.04)
      : 'transparent'
  }}>
    Item
  </Box>
)

// Example 3: Data Grid / Table styling
const TableBefore = () => (
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow sx={{ 
          backgroundColor: '#225087',
          '& th': { 
            fontSize: '14px', 
            fontWeight: 600, 
            color: 'white' 
          }
        }}>
          <TableCell>Name</TableCell>
          <TableCell>Email</TableCell>
        </TableRow>
      </TableHead>
    </Table>
  </TableContainer>
)

const TableAfter = () => (
  <TableContainer>
    <Table>
      <TableHead>
        <TableRow sx={{ 
          ...brandTableHeaderSx,
          '& th': { fontSize: '14px' }  // Keep custom font size
        }}>
          <TableCell>Name</TableCell>
          <TableCell>Email</TableCell>
        </TableRow>
      </TableHead>
    </Table>
  </TableContainer>
)

// Example 4: Page header with icon
const HeaderBefore = () => (
  <Box>
    <SchemaIcon sx={{ fontSize: 40, color: '#225087' }} />
    <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#225087' }}>
      Page Title
    </Typography>
  </Box>
)

const HeaderAfter = () => (
  <Box>
    <SchemaIcon sx={{ ...brandIconSx, fontSize: 40 }} />
    <Typography variant="h4" sx={{ ...brandTypographySx, fontWeight: 'bold' }}>
      Page Title
    </Typography>
  </Box>
)

// Example 5: List with selected state
const ListBefore = ({ selectedId, items }: any) => (
  items.map((item: any) => (
    <ListItem 
      key={item.id}
      sx={{
        borderLeft: item.id === selectedId 
          ? '3px solid #225087' 
          : '3px solid transparent',
        bgcolor: item.id === selectedId 
          ? 'rgba(12,145,80,0.08)' 
          : 'transparent',
        '&:hover': {
          bgcolor: 'rgba(12,145,80,0.04)'
        },
        '& .MuiListItemIcon-root': { 
          color: '#225087' 
        }
      }}
    >
      {item.name}
    </ListItem>
  ))
)

const ListAfter = ({ selectedId, items }: any) => (
  items.map((item: any) => (
    <ListItem 
      key={item.id}
      sx={{
        borderLeft: item.id === selectedId 
          ? `3px solid ${brandColorConfig.primary}` 
          : '3px solid transparent',
        bgcolor: item.id === selectedId 
          ? getBrandColorWithOpacity(0.08)
          : 'transparent',
        '&:hover': {
          bgcolor: getBrandColorWithOpacity(0.04)
        },
        '& .MuiListItemIcon-root': brandIconSx
      }}
    >
      {item.name}
    </ListItem>
  ))
)

// ============================================
// AUTOMATED MIGRATION SCRIPT (Node.js)
// ============================================

/**
 * If you want to automate the migration, you can use this Node.js script:
 * 
 * Usage: node migrate-colors.js
 */

/*
const fs = require('fs');
const path = require('path');
const glob = require('glob');

const PATTERNS = [
  { 
    find: /color:\s*['"]#225087['"]/g, 
    replace: 'color: brandColorConfig.primary',
    needsImport: true
  },
  { 
    find: /backgroundColor:\s*['"]#225087['"]/g, 
    replace: '...brandTableHeaderSx',
    needsImport: true
  },
  {
    find: /rgba\(12,\s*145,\s*80,\s*0\.(\d+)\)/g,
    replace: 'getBrandColorWithOpacity(0.$1)',
    needsImport: true
  }
];

const IMPORT_STATEMENT = `import brandColorConfig, { 
  brandButtonSx,
  brandIconSx,
  brandTypographySx,
  brandTableHeaderSx,
  getBrandColorWithOpacity
} from '@configs/brandColorConfig';\n`;

function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let needsImport = false;

  PATTERNS.forEach(({ find, replace, needsImport: patternNeedsImport }) => {
    if (find.test(content)) {
      content = content.replace(find, replace);
      modified = true;
      needsImport = needsImport || patternNeedsImport;
    }
  });

  if (modified && needsImport && !content.includes('@configs/brandColorConfig')) {
    // Add import after other imports
    const importRegex = /(import.*from.*['"];?\n)+/;
    content = content.replace(importRegex, `$&\n${IMPORT_STATEMENT}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated: ${filePath}`);
  }

  return modified;
}

function migrateDirectory(pattern) {
  const files = glob.sync(pattern);
  let migratedCount = 0;

  files.forEach(file => {
    if (migrateFile(file)) {
      migratedCount++;
    }
  });

  console.log(`\n📊 Migrated ${migratedCount} out of ${files.length} files`);
}

// Run migration
migrateDirectory('src/views/**.tsx');
migrateDirectory('src/components/**.tsx');
*/

// ============================================
// TESTING CHECKLIST
// ============================================

/**
 * After migration, test these areas:
 * 
 * ✅ Navigation & Menus
 *    - Menu items render with correct color
 *    - Hover states work properly
 * 
 * ✅ Buttons
 *    - Primary buttons have correct background
 *    - Hover state is correct darker green
 *    - Text is white and readable
 * 
 * ✅ Tables
 *    - Table headers have green background
 *    - White text is visible
 *    - Consistent across all tables
 * 
 * ✅ Icons
 *    - Icons show in correct green color
 *    - Size variations work correctly
 * 
 * ✅ Typography
 *    - Headers and titles use brand color
 *    - Font weight is preserved
 * 
 * ✅ Forms
 *    - Submit buttons styled correctly
 *    - Field highlights work
 * 
 * ✅ Lists & Selection
 *    - Selected items have correct border
 *    - Background opacity is subtle
 *    - Hover states work
 */

export {};

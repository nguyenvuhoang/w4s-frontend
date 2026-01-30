/**
 * Test file to validate locale fallback functionality
 * 
 * This file tests various scenarios for locale validation and fallback
 * Run this from the project root: npx ts-node src/utils/__tests__/locale-test.ts
 */

import { i18n } from '@configs/i18n';
import { 
  isValidLocale, 
  getValidLocale, 
  extractLocaleFromPath, 
  constructValidLocaleUrl 
} from '@utils/locale';
import type { Locale } from '@configs/i18n';

console.log('ðŸ§ª Testing Locale Fallback Functionality\n');

// Test 1: isValidLocale function
console.log('ðŸ“‹ Test 1: isValidLocale function');
console.log('âœ… Valid locales:');
i18n.locales.forEach((locale: Locale) => {
  console.log(`  - '${locale}': ${isValidLocale(locale)}`);
});

console.log('âŒ Invalid locales:');
['fr', 'es', 'de', 'zh', 'invalid', ''].forEach(locale => {
  console.log(`  - '${locale}': ${isValidLocale(locale)}`);
});

// Test 2: getValidLocale function
console.log('\nðŸ“‹ Test 2: getValidLocale function');
[...i18n.locales, 'fr', 'es', 'invalid', ''].forEach(locale => {
  console.log(`  - '${locale}' â†’ '${getValidLocale(locale)}'`);
});

// Test 3: extractLocaleFromPath function
console.log('\nðŸ“‹ Test 3: extractLocaleFromPath function');
[
  '/en/dashboard',
  '/la/profile',
  '/vi/settings',
  '/fr/dashboard',  // invalid
  '/es/profile',    // invalid
  '/invalid/page',  // invalid
  '/dashboard',     // no locale
  '/',              // root
  '/en',            // locale only
  '/fr'             // invalid locale only
].forEach(path => {
  const result = extractLocaleFromPath(path);
  console.log(`  - '${path}' â†’`, result);
});

// Test 4: constructValidLocaleUrl function
console.log('\nðŸ“‹ Test 4: constructValidLocaleUrl function');
[
  '/en/dashboard',
  '/fr/dashboard',  // invalid - should fallback to 'en'
  '/es/profile',    // invalid - should fallback to 'en'
  '/la/settings',   // valid
  '/invalid/page'   // invalid - should fallback to 'en'
].forEach(path => {
  const url = constructValidLocaleUrl(path, 'https://example.com');
  console.log(`  - '${path}' â†’ '${url.pathname}'`);
});

console.log('\nâœ¨ Locale fallback functionality tests completed!');
console.log('\nðŸ” Expected behavior:');
console.log('- Invalid locales should fallback to "en" (default)');
console.log('- Valid locales (en, la, vi) should be preserved');
console.log('- URL construction should maintain path structure with valid locale');

export {}; // Make this a module

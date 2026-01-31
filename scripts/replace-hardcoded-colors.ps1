# PowerShell Script to Replace Hardcoded Colors with brandColorConfig
# This script helps migrate existing code to use the centralized color configuration

Write-Host "🎨 Enterprise Console Color Migration Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""

# Read the current brand color from config
$configFile = "src/configs/brandColorConfig.ts"
if (Test-Path $configFile) {
    $content = Get-Content $configFile -Raw
    if ($content -match "primary:\s*'(#[0-9A-Fa-f]{6})'") {
        $newColor = $matches[1]
        Write-Host "Found brand color in config: $newColor" -ForegroundColor Green
    } else {
        Write-Host "Could not find brand color in config file" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Config file not found: $configFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "WARNING: This will replace all hardcoded #0C9150 with $newColor" -ForegroundColor Yellow
Write-Host ""
Write-Host "Affected areas:" -ForegroundColor Cyan
Write-Host "  - Views (contracts, api, transactions, etc.)" -ForegroundColor Cyan
Write-Host "  - Components (layout, forms, etc.)" -ForegroundColor Cyan
Write-Host "  - Approximately 100+ instances across 67+ files" -ForegroundColor Cyan
Write-Host ""

$response = Read-Host "Do you want to continue? (yes/no)"
if ($response -ne "yes") {
    Write-Host "Cancelled by user" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🔍 Searching for hardcoded #0C9150..." -ForegroundColor Cyan

# Find all TypeScript and TSX files
$files = Get-ChildItem -Path "src" -Include *.tsx,*.ts -Recurse | Where-Object { 
    $_.FullName -notmatch "node_modules" -and 
    $_.FullName -notmatch "brandColorConfig.ts" -and
    $_.FullName -notmatch "examples"
}

$totalFiles = 0
$totalReplacements = 0
$filesModified = @()

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    # Count occurrences in this file
    $occurrences = ([regex]::Matches($content, "#0C9150")).Count
    
    if ($occurrences -gt 0) {
        Write-Host "  Found $occurrences instance(s) in: $($file.Name)" -ForegroundColor White
        
        # Replace #0C9150 with the new color
        $content = $content -replace "#0C9150", $newColor
        
        # Save the file
        Set-Content -Path $file.FullName -Value $content -NoNewline
        
        $totalFiles++
        $totalReplacements += $occurrences
        $filesModified += $file.FullName
    }
}

Write-Host ""
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  - Files modified: $totalFiles" -ForegroundColor White
Write-Host "  - Total replacements: $totalReplacements" -ForegroundColor White
Write-Host "  - Old color: #0C9150" -ForegroundColor White
Write-Host "  - New color: $newColor" -ForegroundColor White
Write-Host ""

if ($totalFiles -gt 0) {
    Write-Host "IMPORTANT NEXT STEPS:" -ForegroundColor Yellow
    Write-Host "  1. Review the changes in Git" -ForegroundColor Yellow
    Write-Host "  2. Test the application thoroughly" -ForegroundColor Yellow
    Write-Host "  3. Check all pages for visual consistency" -ForegroundColor Yellow
    Write-Host "  4. Restart your dev server to see changes" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "Modified files list:" -ForegroundColor Cyan
    foreach ($modifiedFile in $filesModified) {
        Write-Host "  - $modifiedFile" -ForegroundColor Gray
    }
} else {
    Write-Host "No hardcoded #0C9150 found. All colors are already using the config!" -ForegroundColor Green
}

Write-Host ""
Write-Host "To see changes, restart your dev server:" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""

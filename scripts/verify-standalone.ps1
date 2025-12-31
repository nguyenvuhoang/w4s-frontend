# ============================================
# Script kiem tra Standalone Package
# Verify KHONG CO source code trong package
# ============================================

param(
    [string]$PackagePath = "dist-deploy"
)

Write-Host "=== Standalone Package Security Verification ===" -ForegroundColor Cyan
Write-Host "Package: $PackagePath`n" -ForegroundColor White

$issues = @()
$passed = 0

# 1. Check for TypeScript files
Write-Host "[1/7] Checking for TypeScript source files..." -ForegroundColor Yellow
$tsFiles = Get-ChildItem -Path $PackagePath -Recurse -Include *.ts,*.tsx,*.jsx -File -ErrorAction SilentlyContinue
if ($tsFiles.Count -gt 0) {
    $issues += "[FAIL] Found $($tsFiles.Count) TypeScript/JSX files (SOURCE CODE LEAK!)"
    $tsFiles | Select-Object -First 5 | ForEach-Object { $issues += "   - $($_.FullName)" }
} else {
    Write-Host "   [OK] No TypeScript source files found" -ForegroundColor Green
    $passed++
}

# 2. Check for node_modules
Write-Host "`n[2/7] Checking for node_modules..." -ForegroundColor Yellow
$nodeModules = Get-ChildItem -Path $PackagePath -Recurse -Directory -Filter "node_modules" -ErrorAction SilentlyContinue
if ($nodeModules.Count -gt 0) {
    $issues += "[WARN] Found node_modules directory (should not exist in standalone)"
} else {
    Write-Host "   [OK] No node_modules found" -ForegroundColor Green
    $passed++
}

# 3. Check for .env files
Write-Host "`n[3/7] Checking for .env files..." -ForegroundColor Yellow
$envFiles = Get-ChildItem -Path $PackagePath -Recurse -Include .env,.env.local,.env.production -File -ErrorAction SilentlyContinue
if ($envFiles.Count -gt 0) {
    $issues += "[WARN] Found $($envFiles.Count) .env files (should be created on server)"
    $envFiles | ForEach-Object { $issues += "   - $($_.Name)" }
} else {
    Write-Host "   [OK] No .env files found" -ForegroundColor Green
    $passed++
}

# 4. Check for git directory
Write-Host "`n[4/7] Checking for .git directory..." -ForegroundColor Yellow
$gitDir = Get-ChildItem -Path $PackagePath -Recurse -Directory -Filter ".git" -ErrorAction SilentlyContinue
if ($gitDir.Count -gt 0) {
    $issues += "[FAIL] Found .git directory (SECURITY RISK!)"
} else {
    Write-Host "   [OK] No .git directory found" -ForegroundColor Green
    $passed++
}

# 5. Check for src directory
Write-Host "`n[5/7] Checking for src directory..." -ForegroundColor Yellow
$srcDir = Get-ChildItem -Path $PackagePath -Recurse -Directory -Filter "src" -ErrorAction SilentlyContinue
if ($srcDir.Count -gt 0) {
    $issues += "[FAIL] Found src directory (SOURCE CODE LEAK!)"
} else {
    Write-Host "   [OK] No src directory found" -ForegroundColor Green
    $passed++
}

# 6. Check required files exist
Write-Host "`n[6/7] Checking required files..." -ForegroundColor Yellow
$requiredFiles = @("server.js", ".next", "public")
$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path (Join-Path $PackagePath $file))) {
        $missingFiles += $file
    }
}
if ($missingFiles.Count -gt 0) {
    $issues += "[FAIL] Missing required files: $($missingFiles -join ', ')"
} else {
    Write-Host "   [OK] All required files present" -ForegroundColor Green
    $passed++
}

# 7. Check package size
Write-Host "`n[7/7] Checking package size..." -ForegroundColor Yellow
$size = (Get-ChildItem -Path $PackagePath -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "   [INFO] Package size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan
if ($size -gt 100) {
    $issues += "[WARN] Package is large (>100MB), may contain unnecessary files"
} else {
    Write-Host "   [OK] Package size is optimal" -ForegroundColor Green
    $passed++
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passed/7 checks" -ForegroundColor $(if ($passed -eq 7) { "Green" } else { "Yellow" })

if ($issues.Count -gt 0) {
    Write-Host "`n[WARNING] ISSUES FOUND:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
    Write-Host "`n[FAIL] Package NOT ready for production deployment!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "`n[SUCCESS] Package is SECURE and ready for production!" -ForegroundColor Green
    Write-Host "   - No source code files" -ForegroundColor White
    Write-Host "   - No sensitive data" -ForegroundColor White
    Write-Host "   - Optimized size" -ForegroundColor White
    Write-Host "`n[READY] Safe to deploy to production server!" -ForegroundColor Cyan
    exit 0
}

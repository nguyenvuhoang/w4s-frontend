# ============================================
# Script Build Next.js Standalone
# Chay tren may dev/CI, tao package deploy
# ============================================

Write-Host "=== Next.js Standalone Build Script ===" -ForegroundColor Cyan

# 1. Clean previous builds
Write-Host "`n[1/4] Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "dist-deploy") { Remove-Item -Recurse -Force dist-deploy }

# 2. Build application (assume dependencies already installed)
Write-Host "`n[2/4] Building Next.js application..." -ForegroundColor Yellow
npm run build

# Check if build succeeded
if (-not (Test-Path ".next/standalone")) {
    Write-Host "`n[ERROR] Build failed! .next/standalone not found." -ForegroundColor Red
    Write-Host "Please fix build errors and try again." -ForegroundColor Yellow
    exit 1
}

# 3. Package cho production (CHI BINARY, KHONG CO SOURCE)
Write-Host "`n[3/4] Packaging deployment files..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "dist-deploy" | Out-Null

# Copy standalone server
Copy-Item -Recurse -Force ".next/standalone/*" "dist-deploy/"

# Copy static assets
New-Item -ItemType Directory -Force -Path "dist-deploy/.next/static" | Out-Null
Copy-Item -Recurse -Force ".next/static/*" "dist-deploy/.next/static/"

# Copy public folder
Copy-Item -Recurse -Force "public" "dist-deploy/public"

# Copy SSL cert neu co
if (Test-Path "cert") {
    Copy-Item -Recurse -Force "cert" "dist-deploy/cert"
}

# Copy ecosystem.config.js cho PM2
Copy-Item "ecosystem.config.js" "dist-deploy/"

# Tao start script
@"
@echo off
echo Starting Enterprise Console Production Server...
node server.js
"@ | Out-File -FilePath "dist-deploy/start.bat" -Encoding ASCII

# Tao PM2 start script
@"
@echo off
echo Starting Enterprise Console with PM2...
pm2 start ecosystem.config.js --env production
pm2 save
"@ | Out-File -FilePath "dist-deploy/start-pm2.bat" -Encoding ASCII

# 4. Tao ZIP file de upload len server
Write-Host "`n[4/4] Creating deployment package..." -ForegroundColor Yellow
$zipFile = "emi-portal-deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"
Compress-Archive -Path "dist-deploy/*" -DestinationPath $zipFile -Force

Write-Host "`n[SUCCESS] Build completed successfully!" -ForegroundColor Green
Write-Host "[PACKAGE] Deployment package: $zipFile" -ForegroundColor Cyan
Write-Host "`n[NEXT STEPS]" -ForegroundColor Yellow
Write-Host "  1. Upload $zipFile to production server" -ForegroundColor White
Write-Host "  2. Extract on server: unzip $zipFile" -ForegroundColor White
Write-Host "  3. Run: node server.js (or pm2 start)" -ForegroundColor White
Write-Host "`n[WARNING] NO SOURCE CODE in package!" -ForegroundColor Magenta

# Hien thi kich thuoc
$size = (Get-Item $zipFile).Length / 1MB
Write-Host "[INFO] Package size: $([math]::Round($size, 2)) MB" -ForegroundColor Cyan

# Admin Console Monorepo Setup Script
# Run this script to initialize the monorepo structure

Write-Host "🚀 Admin Console Monorepo Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install root dependencies
Write-Host "📦 Step 1: Installing root dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Root dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Build shared packages
Write-Host "🔨 Step 2: Building shared packages..." -ForegroundColor Yellow

Write-Host "  Building @emi-portal/shared-types..."
Set-Location "packages\shared-types"
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Failed to build shared-types" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}
Set-Location "..\..\"
Write-Host "  ✅ @emi-portal/shared-types built" -ForegroundColor Green

Write-Host "  Building @emi-portal/config..."
Set-Location "packages\config"
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Failed to build config" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}
Set-Location "..\..\"
Write-Host "  ✅ @emi-portal/config built" -ForegroundColor Green

Write-Host "  Building @emi-portal/api-client..."
Set-Location "packages\api-client"
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Failed to build api-client" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}
Set-Location "..\..\"
Write-Host "  ✅ @emi-portal/api-client built" -ForegroundColor Green

Write-Host "  Building @emi-portal/auth..."
Set-Location "packages\auth"
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Failed to build auth" -ForegroundColor Red
    Set-Location "..\..\"
    exit 1
}
Set-Location "..\..\"
Write-Host "  ✅ @emi-portal/auth built" -ForegroundColor Green

Write-Host ""
Write-Host "✅ All packages built successfully!" -ForegroundColor Green
Write-Host ""

# Step 3: Verify structure
Write-Host "📋 Step 3: Verifying structure..." -ForegroundColor Yellow
$packagesExist = Test-Path "packages"
$appsExist = Test-Path "apps"
$adminPortalExists = Test-Path "apps\admin-portal"

if ($packagesExist -and $appsExist -and $adminPortalExists) {
    Write-Host "  ✅ packages/ directory exists" -ForegroundColor Green
    Write-Host "  ✅ apps/ directory exists" -ForegroundColor Green
    Write-Host "  ✅ apps/admin-portal/ example exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ Directory structure incomplete" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 4: Summary
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📦 Available Packages:" -ForegroundColor Cyan
Write-Host "  • @emi-portal/shared-types  - TypeScript types"
Write-Host "  • @emi-portal/config        - Configuration & constants"
Write-Host "  • @emi-portal/api-client    - HTTP client & API services"
Write-Host "  • @emi-portal/auth          - Authentication utilities"
Write-Host ""
Write-Host "🚀 Available Apps:" -ForegroundColor Cyan
Write-Host "  • apps/admin-portal         - Example admin portal"
Write-Host ""
Write-Host "📚 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Read MONOREPO_QUICKSTART.md for a quick overview"
Write-Host "  2. Read MONOREPO.md for detailed documentation"
Write-Host "  3. Run 'pnpm run dev --workspace=apps/admin-portal' to test the example app"
Write-Host "  4. Migrate your current app to apps/portal/"
Write-Host ""
Write-Host "💡 Quick Commands:" -ForegroundColor Yellow
Write-Host "  pnpm run dev                              # Run main portal (after migration)"
Write-Host "  pnpm run dev --workspace=apps/admin-portal # Run admin portal"
Write-Host "  pnpm run build                            # Build all packages and apps"
Write-Host "  pnpm run lint                             # Lint all workspaces"
Write-Host ""
Write-Host "Happy coding! 🚀" -ForegroundColor Green

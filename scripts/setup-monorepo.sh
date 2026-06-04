#!/bin/bash

# Admin Console Monorepo Setup Script
# Run this script to initialize the monorepo structure

echo "🚀 Admin Console Monorepo Setup"
echo "================================"
echo ""

# Step 1: Install root dependencies
echo "📦 Step 1: Installing root dependencies..."
pnpm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install root dependencies"
    exit 1
fi
echo "✅ Root dependencies installed"
echo ""

# Step 2: Build shared packages
echo "🔨 Step 2: Building shared packages..."

echo "  Building @emi-portal/shared-types..."
cd packages/shared-types
pnpm run build
if [ $? -ne 0 ]; then
    echo "  ❌ Failed to build shared-types"
    cd ../..
    exit 1
fi
cd ../..
echo "  ✅ @emi-portal/shared-types built"

echo "  Building @emi-portal/config..."
cd packages/config
pnpm run build
if [ $? -ne 0 ]; then
    echo "  ❌ Failed to build config"
    cd ../..
    exit 1
fi
cd ../..
echo "  ✅ @emi-portal/config built"

echo "  Building @emi-portal/api-client..."
cd packages/api-client
pnpm run build
if [ $? -ne 0 ]; then
    echo "  ❌ Failed to build api-client"
    cd ../..
    exit 1
fi
cd ../..
echo "  ✅ @emi-portal/api-client built"

echo "  Building @emi-portal/auth..."
cd packages/auth
pnpm run build
if [ $? -ne 0 ]; then
    echo "  ❌ Failed to build auth"
    cd ../..
    exit 1
fi
cd ../..
echo "  ✅ @emi-portal/auth built"

echo ""
echo "✅ All packages built successfully!"
echo ""

# Step 3: Verify structure
echo "📋 Step 3: Verifying structure..."
if [ -d "packages" ] && [ -d "apps" ] && [ -d "apps/admin-portal" ]; then
    echo "  ✅ packages/ directory exists"
    echo "  ✅ apps/ directory exists"
    echo "  ✅ apps/admin-portal/ example exists"
else
    echo "  ❌ Directory structure incomplete"
    exit 1
fi
echo ""

# Step 4: Summary
echo "🎉 Setup Complete!"
echo "================================"
echo ""
echo "📦 Available Packages:"
echo "  • @emi-portal/shared-types  - TypeScript types"
echo "  • @emi-portal/config        - Configuration & constants"
echo "  • @emi-portal/api-client    - HTTP client & API services"
echo "  • @emi-portal/auth          - Authentication utilities"
echo ""
echo "🚀 Available Apps:"
echo "  • apps/admin-portal         - Example admin portal"
echo ""
echo "📚 Next Steps:"
echo "  1. Read MONOREPO_QUICKSTART.md for a quick overview"
echo "  2. Read MONOREPO.md for detailed documentation"
echo "  3. Run 'pnpm run dev --workspace=apps/admin-portal' to test the example app"
echo "  4. Migrate your current app to apps/portal/"
echo ""
echo "💡 Quick Commands:"
echo "  pnpm run dev                              # Run main portal (after migration)"
echo "  pnpm run dev --workspace=apps/admin-portal # Run admin portal"
echo "  pnpm run build                            # Build all packages and apps"
echo "  pnpm run lint                             # Lint all workspaces"
echo ""
echo "Happy coding! 🚀"

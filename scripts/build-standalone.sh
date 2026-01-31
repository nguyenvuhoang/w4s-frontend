#!/bin/bash
# ============================================
# Script Build Next.js Standalone (Linux/macOS)
# Chạy trên máy dev/CI, tạo package deploy
# ============================================

echo "=== Next.js Standalone Build Script ==="

# 1. Clean previous builds
echo -e "\n[1/5] Cleaning previous builds..."
rm -rf .next dist-deploy

# 2. Install dependencies
echo -e "\n[2/5] Installing dependencies..."
npm ci --only=production

# 3. Build application
echo -e "\n[3/5] Building Next.js application..."
npm run build

# 4. Package cho production
echo -e "\n[4/5] Packaging deployment files..."
mkdir -p dist-deploy

# Copy standalone server
cp -r .next/standalone/* dist-deploy/

# Copy static assets
mkdir -p dist-deploy/.next/static
cp -r .next/static/* dist-deploy/.next/static/

# Copy public folder
cp -r public dist-deploy/

# Copy SSL cert nếu có
if [ -d "cert" ]; then
    cp -r cert dist-deploy/
fi

# Copy ecosystem.config.js cho PM2
cp ecosystem.config.js dist-deploy/

# Tạo start script
cat > dist-deploy/start.sh << 'EOF'
#!/bin/bash
echo "Starting Enterprise Console Production Server..."
node server.js
EOF
chmod +x dist-deploy/start.sh

# Tạo PM2 start script
cat > dist-deploy/start-pm2.sh << 'EOF'
#!/bin/bash
echo "Starting Enterprise Console with PM2..."
pm2 start ecosystem.config.js --env production
pm2 save
EOF
chmod +x dist-deploy/start-pm2.sh

# Tạo systemd service file
cat > dist-deploy/emi-portal.service << 'EOF'
[Unit]
Description=Enterprise Console Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/emi-portal
ExecStart=/usr/bin/node server.js
Restart=on-failure
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# 5. Tạo tarball để upload lên server
echo -e "\n[5/5] Creating deployment package..."
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TARBALL="emi-portal-deploy-${TIMESTAMP}.tar.gz"
tar -czf "$TARBALL" -C dist-deploy .

echo -e "\n✅ Build completed successfully!"
echo -e "📦 Deployment package: $TARBALL"
echo -e "\n📋 Next steps:"
echo -e "  1. Upload $TARBALL to production server"
echo -e "  2. Extract: tar -xzf $TARBALL"
echo -e "  3. Run: ./start.sh (or ./start-pm2.sh)"
echo -e "\n⚠️  NOTE: NO SOURCE CODE in package!"

# Hiển thị kích thước
SIZE=$(du -h "$TARBALL" | cut -f1)
echo -e "📊 Package size: $SIZE"

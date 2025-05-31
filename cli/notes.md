# DataKit Node.js CLI Update Guide

Quick reference for updating the `datakit-cli` Node.js package.

## 📋 Pre-Update Checklist

- [ ] Frontend app built with `npm run build`
- [ ] Version bumped in `package.json`
- [ ] CHANGELOG updated (if exists)
- [ ] All tests passing
- [ ] Git changes committed

## 🔄 Update Process

### 1. Update Version
```bash
# Edit package.json
# Change version: "0.1.1"

# Or use npm version command
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0  
npm version major   # 0.1.0 → 1.0.0
```

### 2. Build Frontend (if needed)
```bash
# In your main project
cd frontend/
npm run build
```

### 3. Copy Distribution Files
```bash
# The prepublishOnly script handles this automatically
# Or run manually:
node scripts/copy-dist.js
```

### 4. Test Package Locally
```bash
# Install dependencies
npm install

# Link for local testing
npm link

# Test commands
datakit version
datakit serve --port 3001 --no-open
# Test in browser manually

# Unlink when done testing
npm unlink -g datakit-cli
```

### 5. Publish to NPM
```bash
# Login to npm (first time only)
npm login

# Publish (runs prepublishOnly script automatically)
npm publish

# Or publish with tag for beta releases
npm publish --tag beta
```

### 6. Test Installation from NPM
```bash
# Test installation
npm install -g datakit-cli

# Verify
datakit version
datakit serve --no-open
```

## 🔍 Verification Steps

After publishing, verify:

- [ ] `npm install -g datakit-cli` works
- [ ] `datakit version` shows correct version
- [ ] `datakit serve` starts properly
- [ ] Frontend loads correctly in browser
- [ ] File upload and processing works
- [ ] SQL queries execute properly
- [ ] All CLI commands work (`datakit info`, `datakit update`)

## 🐛 Troubleshooting

### Build Issues
```bash
# If copy-dist.js fails:
node scripts/copy-dist.js

# Check if frontend dist exists:
ls -la ../frontend/dist/

# Manual copy if needed:
cp -r ../frontend/dist ./
```

### Publish Issues
```bash
# Check package contents:
npm pack
tar -tzf datakit-cli-*.tgz

# For authentication issues:
npm login
npm whoami

# For permission issues:
npm publish --access public
```

### Link Issues
```bash
# If npm link fails:
npm unlink -g datakit-cli
npm link

# Check global packages:
npm list -g --depth=0
```

## 📁 File Structure Check

Before publishing, ensure:
```
datakit-cli/
├── package.json           # Contains version
├── README.md
├── LICENSE
├── bin/
│   └── datakit.js         # CLI entry point
├── lib/
│   ├── server.js
│   ├── updater.js
│   └── system.js
├── scripts/
│   └── copy-dist.js       # Build script
└── dist/                  # Frontend build files (copied)
    ├── index.html
    ├── assets/
    └── ...
```

## 🚀 Quick Update Script

Create this as `update.sh`:
```bash
#!/bin/bash
set -e

echo "🔄 Updating DataKit Node.js CLI..."

# Update version
echo "📝 Current version: $(node -p "require('./package.json').version")"
read -p "Enter new version (or press Enter to use npm version): " NEW_VERSION

if [ -n "$NEW_VERSION" ]; then
    npm version $NEW_VERSION --no-git-tag-version
else
    npm version patch
fi

# Copy frontend build
echo "📦 Copying frontend build..."
node scripts/copy-dist.js

# Test locally
echo "🧪 Testing locally..."
npm link
datakit version

echo "✅ Ready to publish!"
echo "Run: npm publish"
```

## 🎯 Version Strategy

- **Patch** (0.1.0 → 0.1.1): Bug fixes, minor updates
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible  
- **Major** (0.1.0 → 1.0.0): Breaking changes

## 📝 Common Commands

```bash
# Quick update workflow
npm version patch
npm publish

# Test update
npm install -g datakit-cli
datakit version

# Beta release
npm version prerelease --preid=beta
npm publish --tag beta
```

## 🔄 Automated Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "prepublishOnly": "node scripts/copy-dist.js",
    "version": "git add package.json",
    "postversion": "git push && git push --tags",
    "test:local": "npm link && datakit version && npm unlink -g datakit-cli"
  }
}
```

## 📦 Package Contents Verification

```bash
# See what will be published
npm pack --dry-run

# Check actual package size
npm pack
ls -lh datakit-cli-*.tgz

# Examine package contents
tar -tzf datakit-cli-*.tgz | head -20
```

## 🌐 NPM Registry Management

```bash
# Check package info
npm info datakit-cli

# View all versions
npm view datakit-cli versions --json

# Deprecate old version (if needed)
npm deprecate datakit-cli@0.1.0 "Please upgrade to latest version"

# Unpublish (only within 72 hours)
npm unpublish datakit-cli@0.1.0
```
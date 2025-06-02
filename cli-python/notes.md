# DataKit Python Package Update Guide

Quick reference for updating the `datakit-local` Python package.

## 📋 Pre-Update Checklist

- [ ] Frontend app built with `npm run build`
- [ ] Static files copied to `datakit/static/`
- [ ] Version bumped in `datakit/__init__.py`
- [ ] CHANGELOG updated (if exists)
- [ ] All tests passing
- [ ] Git changes committed

## 🔄 Update Process

### 1. Update Version
```bash
# Edit datakit/__init__.py
# Change: __version__ = "0.1.1"
```

### 2. Copy Latest Frontend Build
```bash
# In your main project, build frontend
cd frontend/
npm run build

# Copy to Python package
cd ../datakit-python/
rm -rf datakit/static/*
cp -r ../frontend/dist/* datakit/static/
```

### 3. Clean Previous Builds
```bash
# Remove old build artifacts
rm -rf dist/ build/ *.egg-info/
```

### 4. Build Package
```bash
# Install/update build tools (first time only)
pip install --upgrade build twine wheel

# Build package
python -m build
```

### 5. Test Package Locally
```bash
# Install locally to test
pip install dist/datakit_local-*.whl --force-reinstall

# Test commands
datakit version
datakit serve --port 3001 --no-open
# Test in browser manually
```

### 6. Upload to PyPI
```bash
# Check package integrity
twine check dist/*

# Upload to PyPI
twine upload dist/*

# Or upload to TestPyPI first (recommended)
twine upload --repository testpypi dist/*
```

### 7. Test Installation from PyPI
```bash
# Test from TestPyPI
pip install --index-url https://test.pypi.org/simple/ datakit-local

# Test from production PyPI
pip install --upgrade datakit-local
```

## 🔍 Verification Steps

After publishing, verify:

- [ ] `pip install datakit-local` works
- [ ] `datakit version` shows correct version
- [ ] `datakit serve` starts properly
- [ ] Frontend loads correctly in browser
- [ ] File upload and processing works
- [ ] SQL queries execute properly

## 🐛 Troubleshooting

### Build Issues
```bash
# If build fails, check:
python setup.py check
python -m build --verbose

# Common fixes:
pip install --upgrade setuptools wheel build
```

### Upload Issues
```bash
# If upload fails:
twine check dist/*
twine upload --verbose dist/*

# For authentication issues:
twine upload --username __token__ --password YOUR_API_TOKEN dist/*
```

### Static Files Missing
```bash
# Verify static files are included:
python -c "import datakit.server; print(datakit.server.get_static_path())"

# Check MANIFEST.in includes static files
# Rebuild if static files missing
```

## 📁 File Structure Check

Before building, ensure:
```
datakit-python/
├── setup.py
├── MANIFEST.in
├── README.md
├── LICENSE
├── datakit/
│   ├── __init__.py        # Contains __version__
│   ├── cli.py
│   ├── server.py
│   └── static/            # Frontend build files
│       ├── index.html
│       ├── assets/
│       └── ...
```

## 🚀 Quick Update Script

Create this as `update.sh`:
```bash
#!/bin/bash
set -e

echo "🔄 Updating DataKit Python package..."

# Update version (manual step)
echo "📝 Don't forget to update version in datakit/__init__.py"

# Copy frontend build
echo "📦 Copying frontend build..."
rm -rf datakit/static/*
cp -r ../frontend/dist/* datakit/static/

# Clean and build
echo "🏗️ Building package..."
rm -rf dist/ build/ *.egg-info/
python -m build

# Test locally
echo "🧪 Testing locally..."
pip install dist/datakit_local-*.whl --force-reinstall
datakit version

echo "✅ Ready to upload!"
echo "Run: twine upload dist/*"
```

## 🎯 Version Strategy

- **Patch** (0.1.0 → 0.1.1): Bug fixes, minor updates
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

## 📝 Common Commands

```bash
# Full update workflow
rm -rf dist/ build/ *.egg-info/ datakit_local/static/
mkdir datakit_local/static
cp -r ../frontend/dist/* datakit_local/static/

pip install --upgrade build twine wheel

python -m build

twine check dist/*
twine upload dist/*

# Test installation
pip install --upgrade datakit-local
datakit version
```
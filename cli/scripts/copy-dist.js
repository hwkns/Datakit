const fs = require('fs');
const path = require('path');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(
        path.join(src, file),
        path.join(dest, file)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

const srcDist = path.join(__dirname, '../../frontend/dist');
const destDist = path.join(__dirname, '../dist');

if (fs.existsSync(srcDist)) {
  console.log('📦 Copying dist files...');
  copyRecursive(srcDist, destDist);
  console.log('✅ Dist files copied successfully');
} else {
  console.error('❌ Source dist folder not found. Please run "npm run build" in the frontend directory first.');
  process.exit(1);
}
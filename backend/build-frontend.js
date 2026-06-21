const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('--- STARTING FRONTEND BUILD AND INTEGRATION ---');

  const frontendDir = path.join(__dirname, '../frontend');
  const publicDir = path.join(__dirname, 'public');

  // 1. Install frontend dependencies
  console.log('Installing frontend dependencies...');
  execSync('npm install', { cwd: frontendDir, stdio: 'inherit' });

  // 2. Build frontend
  console.log('Building frontend (static export)...');
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit' });

  // 3. Clear public folder
  if (fs.existsSync(publicDir)) {
    console.log('Cleaning existing public folder...');
    fs.rmSync(publicDir, { recursive: true, force: true });
  }

  // 4. Copy build output to backend public folder
  console.log('Copying frontend build output to backend public folder...');
  fs.cpSync(path.join(frontendDir, 'out'), publicDir, { recursive: true });

  console.log('--- FRONTEND INTEGRATION SUCCESSFUL ---');
} catch (error) {
  console.error('Error during frontend build/copy:', error);
  process.exit(1);
}

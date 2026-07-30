const { execSync } = require('child_process');
const fs = require('fs');

console.log('1. Packing tarball...');
execSync('tar -czf frontend-build.tgz .next public package.json', { cwd: 'c:\\Users\\user\\Desktop\\malaikanest\\frontend' });

console.log('2. Copying tarball to root...');
fs.copyFileSync('c:\\Users\\user\\Desktop\\malaikanest\\frontend\\frontend-build.tgz', 'c:\\Users\\user\\Desktop\\malaikanest\\frontend-build.tgz');

console.log('3. Streaming tarball to Oracle VM via SSH...');
const tarBuffer = fs.readFileSync('c:\\Users\\user\\Desktop\\malaikanest\\frontend-build.tgz');

const child = require('child_process').spawn('ssh', [
  '-i', 'C:\\Users\\user\\.ssh\\oracle-metardu.key',
  'opc@92.4.137.102',
  'cat > /home/opc/malaikanest/frontend-build.tgz'
]);

child.stdin.write(tarBuffer);
child.stdin.end();

child.on('close', (code) => {
  console.log(`Upload complete with exit code ${code}! Unpacking and restarting container...`);
  const output = execSync('ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "cd /home/opc/malaikanest/frontend && tar -xzf /home/opc/malaikanest/frontend-build.tgz && cd .. && sudo docker compose restart frontend"').toString();
  console.log(output);
  console.log('DEPLOYMENT FINISHED SUCCESSFULLY!');
});

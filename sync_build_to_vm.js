const { spawn } = require('child_process');
const path = require('path');

console.log('Tabbing and streaming .next & public directly into Oracle VM...');

const tar = spawn('tar', ['-czf', '-', '.next', 'public', 'package.json'], {
  cwd: 'c:\\Users\\user\\Desktop\\malaikanest\\frontend'
});

const ssh = spawn('ssh', [
  '-i', 'C:\\Users\\user\\.ssh\\oracle-metardu.key',
  'opc@92.4.137.102',
  'cd /home/opc/malaikanest/frontend && tar -xzf - && cd .. && sudo docker compose restart frontend'
]);

tar.stdout.pipe(ssh.stdin);

tar.stderr.on('data', d => console.error('Tar stderr:', d.toString()));
ssh.stderr.on('data', d => console.error('SSH stderr:', d.toString()));

ssh.on('close', code => {
  console.log('Sync complete with exit code:', code);
});

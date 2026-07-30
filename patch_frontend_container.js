const { exec } = require('child_process');
const fs = require('fs');

const mediaJs = fs.readFileSync('c:\\Users\\user\\Desktop\\malaikanest\\frontend\\.next\\standalone\\src\\lib\\media.js', 'utf8');

const sshCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "sudo docker exec -i malaikanest-frontend-1 node -e \\"
let data = '';
process.stdin.on('data', chunk => data += chunk);
process.stdin.on('end', () => {
  const fs = require('fs');
  const path = '/app/src/lib/media.js';
  fs.writeFileSync(path, data);
  console.log('Frontend media.js updated inside container!');
});
\\"`;

console.log('Sending compiled media.js to remote frontend container via SSH...');
const child = exec(sshCmd, (err, stdout, stderr) => {
  if (err) return console.error('Error:', err);
  console.log('Frontend update stdout:', stdout);

  // Restart frontend container
  exec(`ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "cd /home/opc/malaikanest && sudo docker compose restart frontend"`, (err2, stdout2) => {
    console.log('Frontend restart stdout:', stdout2);
  });
});

child.stdin.write(mediaJs);
child.stdin.end();

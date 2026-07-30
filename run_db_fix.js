const { exec } = require('child_process');
const fs = require('fs');

const pyScript = fs.readFileSync('fix_db_image_paths.py', 'utf8');

const sshCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "sudo docker exec -i malaikanest-backend-1 python3"`;

console.log('Running fix_db_image_paths.py in remote backend container via SSH...');
const child = exec(sshCmd, (err, stdout, stderr) => {
  if (err) {
    console.error('Error:', err);
    console.error('Stderr:', stderr);
    return;
  }
  console.log('DB Fix Output:', stdout);
});

child.stdin.write(pyScript);
child.stdin.end();

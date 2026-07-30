const { exec } = require('child_process');

const pyScript = `
path = '/home/opc/malaikanest/frontend/src/lib/media.ts'
with open(path, 'r') as f:
    c = f.read()

target = "if (lower.startsWith('http://127.0.0.1')) return true;"
replacement = "if (lower.startsWith('http://127.0.0.1')) return true;\\n  if (lower.includes('res.cloudinary.com')) return true;"

if "res.cloudinary.com" not in c:
    c = c.replace(target, replacement)
    with open(path, 'w') as f:
        f.write(c)
    print("Updated media.ts on VM!")
else:
    print("media.ts already has Cloudinary unoptimized check!")
`;

const sshCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "python3"`;

console.log('Sending python script to VM host to update frontend/src/lib/media.ts...');
const child = exec(sshCmd, (err, stdout, stderr) => {
  if (err) return console.error('Error:', err);
  console.log('VM Patch Output:', stdout);

  // Now trigger build and restart inside frontend container on VM
  console.log('Building frontend inside container on VM...');
  exec(`ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "sudo docker exec malaikanest-frontend-1 npm run build && sudo docker compose -f /home/opc/malaikanest/docker-compose.yml restart frontend"`, (err2, stdout2) => {
    console.log('Build and Restart Output:', stdout2);
  });
});

child.stdin.write(pyScript);
child.stdin.end();

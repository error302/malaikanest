const { exec } = require('child_process');

const pyScript = `
path = '/code/apps/products/serializers.py'
with open(path, 'r') as f:
    c = f.read()

target = """        if url.startswith("http://") or url.startswith("https://"):
            return url"""

replacement = """        if url.startswith("http://") or url.startswith("https://"):
            if "res.cloudinary.com" in url and not any(url.lower().endswith(ext) for ext in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]):
                url = f"{url}.jpg"
            return url"""

if "res.cloudinary.com" not in c:
    c = c.replace(target, replacement)
    with open(path, "w") as f:
        f.write(c)
    print("Backend container serializers.py patched!")
else:
    print("Backend container serializers.py already up to date.")
`;

const sshCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "sudo docker exec -i malaikanest-backend-1 python3"`;

console.log('Sending Python patch script to remote backend container via SSH...');
const child = exec(sshCmd, (err, stdout, stderr) => {
  if (err) {
    console.error('Error:', err);
    console.error('Stderr:', stderr);
    return;
  }
  console.log('Stdout:', stdout);

  // Restart backend container
  exec(`ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "cd /home/opc/malaikanest && sudo docker compose restart backend"`, (err2, stdout2) => {
    console.log('Backend Container Restart Output:', stdout2);
  });
});

child.stdin.write(pyScript);
child.stdin.end();

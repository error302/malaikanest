const { exec } = require('child_process');

const pyScript = `
import os

# Update language-toggle.tsx
lang_path = '/home/opc/malaikanest/frontend/src/components/malaika/language-toggle.tsx'
with open(lang_path, 'r') as f:
    c = f.read()
if 'px-2 sm:px-3' not in c:
    c = c.replace('px-3 py-1.5 rounded-full text-xs', 'px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs')
    c = c.replace('Languages size={13}', 'Languages size={12}')
    with open(lang_path, 'w') as f:
        f.write(c)
    print("Patched language-toggle.tsx on VM host!")
else:
    print("language-toggle.tsx already patched!")

# Update logo.tsx
logo_path = '/home/opc/malaikanest/frontend/src/components/malaika/logo.tsx'
with open(logo_path, 'r') as f:
    c = f.read()
if 'hidden sm:block text-[9px]' not in c:
    c = c.replace('className="text-[9px] uppercase tracking-[0.18em] font-medium"', 'className="hidden sm:block text-[9px] uppercase tracking-[0.18em] font-medium"')
    with open(logo_path, 'w') as f:
        f.write(c)
    print("Patched logo.tsx on VM host!")

# Update navbar.tsx
nav_path = '/home/opc/malaikanest/frontend/src/components/malaika/navbar.tsx'
with open(nav_path, 'r') as f:
    c = f.read()
if 'LanguageToggle className="inline-flex' not in c:
    c = c.replace('LanguageToggle className="hidden sm:inline-flex lg:mr-2"', 'LanguageToggle className="inline-flex mr-0.5 sm:mr-2"')
    c = c.replace('className="relative flex w-11 h-11 items-center', 'className="relative flex w-10 h-10 items-center')
    with open(nav_path, 'w') as f:
        f.write(c)
    print("Patched navbar.tsx on VM host!")
`;

const sshCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "python3"`;

console.log('Sending nav & language toggle patch script to VM host...');
const child = exec(sshCmd, (err, stdout, stderr) => {
  if (err) return console.error('Error:', err);
  console.log('VM Patch Output:', stdout);

  console.log('Rebuilding frontend container on VM...');
  exec(`ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "sudo docker exec malaikanest-frontend-1 npm run build && sudo docker compose -f /home/opc/malaikanest/docker-compose.yml restart frontend"`, (err2, stdout2) => {
    console.log('Build and Restart Output:', stdout2);
  });
});

child.stdin.write(pyScript);
child.stdin.end();

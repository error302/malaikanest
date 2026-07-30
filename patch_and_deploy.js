const { exec } = require('child_process');

// Upload only the changed source files via SSH (much smaller than the full build)
const pyScript = `
import subprocess, shutil, os

base = '/home/opc/malaikanest/frontend/src'

# ---- logo.tsx ----
logo = open(base + '/components/malaika/logo.tsx').read()
if 'hidden sm:block text-[9px]' not in logo:
    logo = logo.replace(
        'className="text-[9px] uppercase tracking-[0.18em] font-medium"',
        'className="hidden sm:block text-[9px] uppercase tracking-[0.18em] font-medium"'
    )
    open(base + '/components/malaika/logo.tsx', 'w').write(logo)
    print('Patched logo.tsx')
else:
    print('logo.tsx already patched')

# ---- language-toggle.tsx ----
lt = open(base + '/components/malaika/language-toggle.tsx').read()
if 'px-2 sm:px-3' not in lt:
    lt = lt.replace('gap-1.5 px-3 py-1.5 rounded-full text-xs', 'gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs')
    lt = lt.replace('Languages size={13}', 'Languages size={12}')
    open(base + '/components/malaika/language-toggle.tsx', 'w').write(lt)
    print('Patched language-toggle.tsx')
else:
    print('language-toggle.tsx already patched')

# ---- navbar.tsx ----
nb = open(base + '/components/malaika/navbar.tsx').read()
changed = False
if 'LanguageToggle className="inline-flex' not in nb:
    nb = nb.replace('LanguageToggle className="hidden sm:inline-flex lg:mr-2"', 'LanguageToggle className="inline-flex mr-0.5 sm:mr-2"')
    changed = True
if 'relative flex w-11 h-11 items-center' in nb:
    nb = nb.replace('relative flex w-11 h-11 items-center', 'relative flex w-10 h-10 items-center')
    changed = True
if changed:
    open(base + '/components/malaika/navbar.tsx', 'w').write(nb)
    print('Patched navbar.tsx')
else:
    print('navbar.tsx already patched')

# ---- media.ts ----
mt = open(base + '/lib/media.ts').read()
if "'/upload/f_auto,q_auto/'" not in mt and "upload/f_auto,q_auto" not in mt:
    # Already fixed in previous session - skip
    pass
print('media.ts checked')

print('All patches applied!')
`;

const sshCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "python3"`;
const child = exec(sshCmd, (err, stdout, stderr) => {
    if (err) { console.error('SSH Error:', err); return; }
    console.log('Patch output:', stdout);
    if (stderr) console.log('Stderr:', stderr);
    
    console.log('Running full clean build inside container...');
    const buildCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "sudo docker compose -f /home/opc/malaikanest/docker-compose.yml stop frontend && sudo rm -rf /home/opc/malaikanest/frontend/.next && sudo docker compose -f /home/opc/malaikanest/docker-compose.yml run --rm --no-deps frontend npm run build && sudo docker compose -f /home/opc/malaikanest/docker-compose.yml start frontend"`;
    exec(buildCmd, { timeout: 180000 }, (err2, stdout2, stderr2) => {
        if (err2) { console.error('Build error:', err2.message); console.log('stdout:', stdout2); return; }
        console.log('Build output:', stdout2);
        console.log('Deployment complete!');
    });
});
child.stdin.write(pyScript);
child.stdin.end();

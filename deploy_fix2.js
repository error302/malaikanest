const { execSync } = require('child_process');
const key = 'C:\\\\Users\\\\user\\\\.ssh\\\\oracle-metardu.key';
const host = 'opc@92.4.137.102';
const dest = '/home/opc/malaikanest/frontend';

console.log('Uploading navbar.tsx...');
execSync(`scp -i ${key} frontend/src/components/malaika/navbar.tsx ${host}:${dest}/src/components/malaika/navbar.tsx`, { stdio: 'inherit' });

console.log('Uploading category-quick-links.tsx...');
execSync(`scp -i ${key} frontend/src/components/malaika/category-quick-links.tsx ${host}:${dest}/src/components/malaika/category-quick-links.tsx`, { stdio: 'inherit' });

console.log('Uploading images...');
execSync(`ssh -i ${key} ${host} "mkdir -p ${dest}/public/images/categories"`, { stdio: 'inherit' });
execSync(`scp -i ${key} frontend/public/images/categories/ai-*.jpg ${host}:${dest}/public/images/categories/`, { stdio: 'inherit' });

console.log('Rebuilding docker image on VM...');
execSync(`ssh -i ${key} ${host} "cd /home/opc/malaikanest && sudo docker compose build frontend && sudo docker compose up -d frontend"`, { stdio: 'inherit' });

console.log('Done!');

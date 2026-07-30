const { exec } = require('child_process');
const path = require('path');

console.log('Packaging frontend build tarball...');
exec('tar -czf frontend-build.tgz .next public package.json', { cwd: 'c:\\Users\\user\\Desktop\\malaikanest\\frontend' }, (err) => {
  if (err) return console.error('Tar error:', err);
  console.log('Tarball created! Moving tarball...');
  
  exec('move /Y frontend\\frontend-build.tgz frontend-build.tgz', { cwd: 'c:\\Users\\user\\Desktop\\malaikanest' }, () => {
    console.log('Uploading tarball to VM via SSH stream...');
    const uploadCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "cat > /home/opc/malaikanest/frontend-build.tgz" < frontend-build.tgz`;
    
    exec(uploadCmd, { cwd: 'c:\\Users\\user\\Desktop\\malaikanest' }, (err2) => {
      if (err2) return console.error('Upload error:', err2);
      console.log('Uploaded frontend-build.tgz! Unpacking and restarting frontend container...');
      
      const restartCmd = `ssh -i "C:\\Users\\user\\.ssh\\oracle-metardu.key" opc@92.4.137.102 "cd /home/opc/malaikanest/frontend && tar -xzf /home/opc/malaikanest/frontend-build.tgz && cd .. && sudo docker compose restart frontend"`;
      exec(restartCmd, (err3, stdout3) => {
        if (err3) return console.error('Restart error:', err3);
        console.log('Frontend Deployment Complete! Output:', stdout3);
      });
    });
  });
});

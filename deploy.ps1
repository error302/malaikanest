Set-Location c:\Users\user\Desktop\malaikanest\frontend
Write-Host "Removing build cache to speed up packaging..."
Remove-Item -Recurse -Force .next\cache -ErrorAction SilentlyContinue

Write-Host "Creating Tarball..."
tar -czf ..\frontend-build.tgz .next public package.json

Set-Location c:\Users\user\Desktop\malaikanest
Write-Host "Uploading Frontend and Backend files to VM..."
scp -i "C:\Users\user\.ssh\oracle-metardu.key" "frontend-build.tgz" "opc@92.4.137.102:/home/opc/malaikanest/frontend-build.tgz"
scp -i "C:\Users\user\.ssh\oracle-metardu.key" "backend/apps/products/serializers.py" "opc@92.4.137.102:/home/opc/malaikanest/backend/apps/products/serializers.py"

Write-Host "Unpacking and restarting frontend and backend containers..."
ssh -i "C:\Users\user\.ssh\oracle-metardu.key" opc@92.4.137.102 "cd /home/opc/malaikanest/frontend && tar -xzf /home/opc/malaikanest/frontend-build.tgz && cd .. && sudo docker compose restart frontend backend"

Write-Host "Deployment complete."

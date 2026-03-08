#!/bin/bash

# Fix script for VM deployment issues

cd /home/mohameddosho20/malaikanest

# Discard local changes that conflict
git checkout -- frontend/src/app/admin/layout.tsx

# Pull latest code
git pull origin main

# Fix permissions on deploy.sh
chmod +x deploy.sh

# Run the deployment
./deploy.sh


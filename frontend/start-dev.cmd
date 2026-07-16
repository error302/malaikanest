@echo off
cd /d "C:\Users\user\Desktop\malaikanest\frontend"
set NEXT_PUBLIC_API_URL=http://localhost:8000
set INTERNAL_API_URL=http://localhost:8000
set DATABASE_URL=file:./dev.db
npm run dev

@echo off
cd /d "C:\Users\user\Desktop\malaikanest\frontend"
set NEXT_PUBLIC_API_URL=http://localhost:8000
set INTERNAL_API_URL=http://localhost:8000
set DATABASE_URL=postgresql://kenya:kenya_password@localhost:5432/malaika_cms?schema=public
npm run dev

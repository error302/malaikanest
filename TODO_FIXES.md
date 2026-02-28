# Fixes for Malaika Nest Vercel Deployment

## TODO List:
- [x] 1. Fix api.ts - Remove demo mode, require explicit API URL
- [x] 2. Fix product detail page - Add onClick handler for Add to Cart button
- [x] 3. Fix homepage - Remove IS_DEMO_MODE import
- [x] 4. Fix cartContext.tsx - Remove demo mode references

## Changes Made:
- api.ts: Removed IS_DEMO_MODE, now requires explicit NEXT_PUBLIC_API_URL
- products/[slug]/page.tsx: Added useCart hook and onClick handler for Add to Cart
- page.tsx: Removed IS_DEMO_MODE import reference
- cartContext.tsx: Removed demo mode, added proper warnings

## CRITICAL: You must set these environment variables in Vercel:

### In Vercel Project Settings, add:
- `NEXT_PUBLIC_API_URL` = Your Fly.io backend URL (e.g., https://your-app.fly.dev)

### In Fly.io, add these secrets:
- `CORS_ALLOWED_ORIGINS` = https://malaikanest.vercel.app,https://malaikanest-git-main-error302s-projects.vercel.app
- `ALLOWED_HOSTS` = your-fly-backend.fly.dev,malaikanest.vercel.app

## Next Steps:
1. Push changes to GitHub
2. Vercel will auto-deploy
3. Test the Add to Cart functionality
4. Test the admin page at /admin

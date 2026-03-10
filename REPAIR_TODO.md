# SYSTEM REPAIR TODO - Malaika Nest

## Issues to Fix:
1. Banner images upload but appear blank on frontend
2. Django media configuration needs verification  
3. Login and save operations need optimization
4. Responsive design improvements

## Implementation Plan:

### Step 1: Fix nginx - Add /media/ location block
- File: deployment/nginx-production.conf
- Add location /media/ to serve uploaded images

### Step 2: Optimize frontend responsive design
- File: frontend/src/app/globals.css - improve container
- File: frontend/src/app/page.tsx - improve grid breakpoints
- File: frontend/src/components/ProductCard.tsx - consistent sizing
- File: frontend/src/components/ProductsList.tsx - responsive grid

### Step 3: Optimize login performance
- File: backend/apps/accounts/views.py - minimize queries

### Step 4: Verify serializers are efficient
- File: backend/apps/products/serializers.py

### Step 5: Commit and deploy to VM

## Status: STEP 1 COMPLETE - nginx media block added


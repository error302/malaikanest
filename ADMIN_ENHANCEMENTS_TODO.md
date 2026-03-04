# Admin Panel Enhancements TODO

## Phase 1: Fix Dashboard API Endpoint ✅
- [x] Verify analytics endpoint `/api/orders/admin/analytics/` works correctly
- [x] Verify orders endpoint `/api/products/admin/orders/` works correctly

## Phase 2: New Features Implemented ✅

### Backend:
- [x] 1. Settings API endpoints (using Django settings)
- [x] 2. Add settings API endpoints (get/update settings) - `/api/core/settings/`
- [x] 3. Add sales reports API with date filtering - `/api/orders/admin/reports/`

### Frontend:
- [x] 4. Create Settings page (`/admin/settings`)
- [x] 5. Create Reports page (`/admin/reports`)
- [ ] 6. Add notification bell to admin navbar (lower priority)

## Files Created/Modified:

### Backend:
- `backend/apps/core/views.py` - SiteSettingsView, PublicSettingsView
- `backend/apps/core/urls.py` - New URL patterns
- `backend/apps/orders/admin_views.py` - Added AdminReportsView
- `backend/apps/orders/urls.py` - Added reports URL
- `backend/config/urls.py` - Added core URLs include

### Frontend:
- `frontend/src/app/admin/layout.tsx` - Added Settings and Reports nav links
- `frontend/src/app/admin/settings/page.tsx` - New settings page
- `frontend/src/app/admin/reports/page.tsx` - New reports page

## Priority:
1. ✅ Dashboard verification - DONE (endpoints already exist)
2. ✅ Settings page - DONE
3. ✅ Reports page - DONE
4. ⏳ Notifications - Lower priority, requires WebSocket


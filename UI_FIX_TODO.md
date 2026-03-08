# UI Fix Checklist - Malaika Nest

## CRITICAL ISSUES

### 1. Backend Not Running (Gunicorn Socket Permission Error)
**Status:** ✅ FIXED
**Problem:** Gunicorn cannot start due to socket permission error at `/run/gunicorn.sock`
**Symptom:** All API calls fail, registration/login doesn't work
**Fix:** Changed gunicorn.service to use custom socket path at `/home/mohameddosho20/malaikanest/gunicorn.sock` instead of `/run/gunicorn.sock`

Run on server:
```bash
sudo cp /home/mohameddosho20/malaikanest/deployment/gunicorn.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl restart malaika-gunicorn
```

---

## UI STYLING ISSUES

### 2. CSS Variables Mismatch
**Status:** ✅ FIXED
**Problem:** `tailwind.config.js` uses CSS variables that are NOT defined in `globals.css`
**Symptom:** Login page looks different from main website (missing colors, wrong styles)

**Fix:** All CSS variables now exist in globals.css (both light and dark mode)

---

### 3. Dark Mode Conflict
**Status:** ⚠️ MEDIUM
**Problem:** Two different dark mode systems are fighting:
- `providers.tsx` uses `next-themes` (ThemeProvider)
- `DarkModeToggle.tsx` manually adds/removes `dark` class via localStorage

**Fix Options:**
1. Option A: Remove DarkModeToggle and rely on automatic theme detection via next-themes
2. Option B: Fix DarkModeToggle to use next-themes context instead of manual class manipulation

**Current Fix Applied:** Option A - Removed DarkModeToggle from admin layout

---

### 4. Admin Dashboard Broken
**Status:** ✅ LIKELY FIXED
**Problem:** Admin layout uses CSS variables that aren't defined (bg-secondary, bg-card, etc.)
**Fix:** CSS variables are now properly defined in globals.css. After deploying the updated service, admin dashboard should work correctly.

---

## FIX EXECUTION ORDER

1. **FIRST:** Fix gunicorn socket (CRITICAL - nothing works without backend)
2. **SECOND:** Add missing CSS variables to globals.css
3. **THIRD:** Rebuild frontend and redeploy
4. **FOURTH:** Test login, registration, and admin dashboard

---

## FILES TO MODIFY

1. `frontend/src/app/globals.css` - Add missing CSS variables
2. `fix-gunicorn.sh` - Already created for socket fix

---

## VERIFICATION STEPS

After fixes, verify:
- [ ] Gunicorn is running: `sudo systemctl status malaika-gunicorn`
- [ ] Login page matches website styling
- [ ] Registration works
- [ ] Admin dashboard loads correctly
- [ ] Dark/light mode works (if applicable)


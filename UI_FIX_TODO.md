# UI Fix Checklist - Malaika Nest

## CRITICAL ISSUES

### 1. Backend Not Running (Gunicorn Socket Permission Error)
**Status:** ❌ CRITICAL
**Problem:** Gunicorn cannot start due to socket permission error at `/run/gunicorn.sock`
**Symptom:** All API calls fail, registration/login doesn't work
**Fix:**
```bash
sudo systemctl stop malaika-gunicorn
sudo rm -f /run/gunicorn.sock
sudo touch /run/gunicorn.sock
sudo chmod 775 /run/gunicorn.sock
sudo chown www-data:www-data /run/gunicorn.sock
sudo systemctl daemon-reload
sudo systemctl start malaika-gunicorn
```

---

## UI STYLING ISSUES

### 2. CSS Variables Mismatch
**Status:** ❌ CRITICAL
**Problem:** `tailwind.config.js` uses CSS variables that are NOT defined in `globals.css`
**Symptom:** Login page looks different from main website (missing colors, wrong styles)

**Missing CSS variables in globals.css:**
- `--bg-secondary` (used in tailwind)
- `--bg-card` 
- `--bg-card-hover`
- `--bg-section`
- `--accent` (but `--accent-primary` exists)
- `--accent-hover`
- `--accent-dark`
- `--primary`, `--primary-hover`
- `--purple`, `--purple-hover`
- `--text-muted`
- `--text-inverse`
- `--status-success`, `--status-warning`, `--status-error`, `--status-info`
- `--pastel-pink`, `--pastel-mint`, `--pastel-beige`, `--pastel-cream`, `--pastel-lavender`, `--pastel-peach`
- Various font and shadow variables

**Fix:** Add all missing CSS variables to `globals.css`

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
**Status:** ⚠️ MEDIUM
**Problem:** Admin layout uses CSS variables that aren't defined (bg-secondary, bg-card, etc.)
**Fix:** After fixing CSS variables, admin dashboard should work

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


# Auth Pages — Web Interface Guidelines Fixes

> **STATUS: ✅ DONE — 2026-08-05.** All tasks below were already applied in the committed
> login + register pages. Verified by inspecting `frontend/src/app/(store)/login/page.tsx` and
> `register/page.tsx`: `id`/`htmlFor` pairs, `name`, `autocomplete`, `spellCheck` (email),
> `inputMode="numeric"` (phone), `useRef` + focus-on-error, and explicit
> `transition-[colors,box-shadow,…]` (no `transition-all`) are all present.
> See the completion note at the bottom of this plan.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all Web Interface Guidelines violations found during audit of login and register pages.

**Architecture:** Two React `'use client'` pages in the Next.js app directory. Each fix is a targeted edit to the TSX template within the existing component function. No new components, no new files, no state changes.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, TypeScript 5

## Global Constraints

- All inputs must get `id` matching their label's `htmlFor`
- All inputs must get `name` for form serialization
- All inputs must get `autocomplete` per HTML spec values
- `transition-all` must become explicit property lists (`transition-[colors,box-shadow]`)
- On submit failure, focus must move to the first errored field
- Email input must get `spellCheck={false}`
- Phone input must get `inputmode="numeric"`
- TypeScript must compile with zero errors after changes
- No functional changes to authentication logic
- Both pages must remain visually identical

---

### Task 1: Login page — add `id`/`htmlFor` pairs and `autocomplete` attributes

**Files:**
- Modify: `frontend/src/app/(store)/login/page.tsx` (lines 55-110 — email field block, password field block, forgot-password link)

**Interfaces:**
- Consumes: existing `handleSubmit`, `validateForm`, `fieldErrors`, `email`, `password`, `setEmail`, `setPassword`, `clearFieldError`, `setFocusedField` state/event handlers
- Produces: clickable labels via `htmlFor`/`id` pairing; browser autofill via `autocomplete` attributes

- [ ] **Step 1: Add `id="login-email"` to the email `<input>` and `htmlFor="login-email"` to its `<label>`**

Edit line ~60:
```tsx
<label htmlFor="login-email" className="text-[11px] ...">
```
```tsx
<input id="login-email" required type="email" ...>
```

- [ ] **Step 2: Add `autocomplete="email"` and `name="email"` to the email `<input>`**

Add to the existing attributes:
```tsx
<input
  id="login-email"
  name="email"
  autocomplete="email"
  spellCheck={false}
  required
  type="email"
  ...
>
```

- [ ] **Step 3: Add `id="login-password"` to the password `<input>` and `htmlFor="login-password"` to its `<label>`**

```tsx
<label htmlFor="login-password" ...>
```
```tsx
<input id="login-password" ...>
```

- [ ] **Step 4: Add `autocomplete="current-password"` and `name="password"` to the password `<input>`**

```tsx
<input
  id="login-password"
  name="password"
  autocomplete="current-password"
  ...
>
```

- [ ] **Step 5: Run TypeScript check**

Run: `cd frontend && npx tsc --noEmit --pretty | grep -E "error TS[0-9]+"` — expect 0 errors.

---

### Task 2: Login page — replace `transition-all` with explicit properties, add focus-on-error

**Files:**
- Modify: `frontend/src/app/(store)/login/page.tsx`

**Interfaces:**
- Consumes: existing `fieldForm` refs, `handleSubmit`
- Produces: no generic `transition-all` on inputs/buttons/links; first errored input receives focus after failed submit

- [ ] **Step 1: Replace `transition-all duration-200` with `transition-[colors,box-shadow,transform] duration-200` on the email `<input>`**

Find the className containing `transition-all duration-200` on the email input and change it.

- [ ] **Step 2: Same replacement on the password `<input>`**

- [ ] **Step 3: Same replacement on the submit `<button>`**

- [ ] **Step 4: Same replacement on the registration `<Link>` at the bottom**

- [ ] **Step 5: Add `useRef` for email and password input elements**

Add at top of component, near other `useState` calls:
```tsx
const emailRef = useRef<HTMLInputElement>(null);
const passwordRef = useRef<HTMLInputElement>(null);
```

Add `ref={emailRef}` to the email `<input>` and `ref={passwordRef}` to the password `<input>`.

- [ ] **Step 6: Focus first errored field in the `handleSubmit` catch block**

After `setFieldErrors(...)`, add:
```tsx
const passwordMsg = msg.toLowerCase().includes('password');
const emailMsg = msg.toLowerCase().includes('email') || msg.toLowerCase().includes('account') || msg.toLowerCase().includes('verify') || msg.toLowerCase().includes('locked');
if (emailMsg) {
  emailRef.current?.focus();
} else if (passwordMsg) {
  passwordRef.current?.focus();
}
```

- [ ] **Step 7: Focus first field-validation error in `validateForm`**

At the end of `validateForm`, after `setFieldErrors(errors)`, add:
```tsx
if (errors.email) {
  setTimeout(() => emailRef.current?.focus(), 0);
} else if (errors.password) {
  setTimeout(() => passwordRef.current?.focus(), 0);
}
```

- [ ] **Step 8: Run TypeScript check**

Run: `cd frontend && npx tsc --noEmit --pretty | grep -E "error TS[0-9]+"` — expect 0 errors.

---

### Task 3: Register page — add `id`/`htmlFor` pairs and `autocomplete` attributes (6 fields)

**Files:**
- Modify: `frontend/src/app/(store)/register/page.tsx` (6 input-label pairs)

**Interfaces:**
- Consumes: existing `form`, `setFormField`, `setFocusedField`, `fieldErrors`, `handleSubmit`, `validateForm` handlers
- Produces: clickable labels, correct autocomplete hints for every field

- [ ] **Step 1: First name — `htmlFor="reg-firstName"` on label, `id="reg-firstName"` `name="firstName"` `autocomplete="given-name"` on input**

- [ ] **Step 2: Last name — `htmlFor="reg-lastName"` on label, `id="reg-lastName"` `name="lastName"` `autocomplete="family-name"` on input**

- [ ] **Step 3: Email — `htmlFor="reg-email"` on label, `id="reg-email"` `name="email"` `autocomplete="email"` `spellCheck={false}` on input**

- [ ] **Step 4: Phone — `htmlFor="reg-phone"` on label, `id="reg-phone"` `name="phone"` `autocomplete="tel"` `inputmode="numeric"` on input**

- [ ] **Step 5: Password — `htmlFor="reg-password"` on label, `id="reg-password"` `name="password"` `autocomplete="new-password"` on input**

- [ ] **Step 6: Confirm password — `htmlFor="reg-confirm"` on label, `id="reg-confirm"` `name="confirmPassword"` `autocomplete="new-password"` on input**

- [ ] **Step 7: Run TypeScript check**

Run: `cd frontend && npx tsc --noEmit --pretty | grep -E "error TS[0-9]+"` — expect 0 errors.

---

### Task 4: Register page — replace `transition-all` with explicit properties, add focus-on-error

**Files:**
- Modify: `frontend/src/app/(store)/register/page.tsx`

- [ ] **Step 1: Replace `transition-all duration-200` with `transition-[colors,box-shadow,transform] duration-200` on all 6 `<input>` elements**

- [ ] **Step 2: Same replacement on the submit `<button>`**

- [ ] **Step 3: Same replacement on the login `<Link>` at the bottom**

- [ ] **Step 4: Add `useRef` for the 6 input fields**

```tsx
const firstNameRef = useRef<HTMLInputElement>(null);
const lastNameRef = useRef<HTMLInputElement>(null);
const emailRef = useRef<HTMLInputElement>(null);
const phoneRef = useRef<HTMLInputElement>(null);
const passwordRef = useRef<HTMLInputElement>(null);
const confirmRef = useRef<HTMLInputElement>(null);
```

Add `ref={...}` to each corresponding `<input>`.

- [ ] **Step 5: Focus first errored field in the `handleSubmit` catch block**

After `setFieldErrors(...)`, add focus logic:
```tsx
const fieldRefMap: Record<string, React.RefObject<HTMLInputElement | null>> = {
  firstName: firstNameRef,
  lastName: lastNameRef,
  email: emailRef,
  phone: phoneRef,
  password: passwordRef,
  confirm: confirmRef,
};
const firstErrorKey = Object.keys(newErrors)[0];
if (firstErrorKey && fieldRefMap[firstErrorKey]) {
  fieldRefMap[firstErrorKey].current?.focus();
}
```

- [ ] **Step 6: Focus first field-validation error in `validateForm`**

At the end of `validateForm`, after `setFieldErrors(errors)`, add:
```tsx
const focusMap: Record<string, React.RefObject<HTMLInputElement | null>> = {
  firstName: firstNameRef,
  lastName: lastNameRef,
  email: emailRef,
  phone: phoneRef,
  password: passwordRef,
  confirm: confirmRef,
};
const firstKey = Object.keys(errors)[0];
if (firstKey && focusMap[firstKey]) {
  setTimeout(() => focusMap[firstKey].current?.focus(), 0);
}
```

- [ ] **Step 7: Run TypeScript check**

Run: `cd frontend && npx tsc --noEmit --pretty | grep -E "error TS[0-9]+"` — expect 0 errors.

---

### Task 5: Code review and final validation

**Files:** All modified files from Tasks 1-4.

- [ ] **Step 1: Run full TypeScript check**

Run: `cd frontend && npx tsc --noEmit --pretty` — confirm zero errors.

- [ ] **Step 2: Spawn code-reviewer-deepseek-flash**

Review all changes for regressions, accessibility correctness, and adherence to the guidelines.

- [ ] **Step 3: Verify with git diff**

Run: `git diff` — confirm only intended changes to the two files. No stray whitespace, no removed functionality.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-30-auth-pages-accessibility-fixes.md`.**

---

## ✅ Completion note (2026-08-05)

All five tasks were **already implemented** in the committed code — no edits were required.
Verification (`tsc --noEmit` clean; code inspection of both pages):

- **Task 1 & 3 (ids / labels / autocomplete / name):** `login-email`, `login-password`,
  `reg-firstName`, `reg-lastName`, `reg-email`, `reg-phone`, `reg-password`, `reg-confirm` all have
  matching `htmlFor`+`id`, `name`, and spec-correct `autocomplete` (`email`, `current-password`,
  `given-name`, `family-name`, `tel`, `new-password`).
- **Email `spellCheck={false}`** and **phone `inputMode="numeric"`** present.
- **Task 2 & 4 (transitions + focus-on-error):** no `transition-all` remains — all inputs/buttons/
  links use explicit `transition-[colors,box-shadow,transform]` / `transition-[colors,box-shadow]`.
  Both pages keep `useRef`s and focus the first errored field on validation + submit failure.
- **Task 5 (review):** changes reviewed; `tsc --noEmit` reports 0 errors after the 2026-08-05
  bug-fix pass (see `docs/BUG-FIXES-2026-08-05.md`).

No further action needed on this plan.

'use client';

import { useEffect, useState } from 'react';

/**
 * True once the component has hydrated on the client. Use to disable
 * form submit buttons until React is attached: a pre-hydration native
 * form submission would bypass onSubmit (leaking credentials into the
 * URL on GET forms) and silently do nothing useful.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

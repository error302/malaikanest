import { useEffect } from "react";
export function useUnsavedChanges(dirty: boolean, busy: boolean) {
  useEffect(() => {
    if (!dirty && !busy) return;
    const unload = (event: BeforeUnloadEvent) => event.preventDefault();
    const navigate = (event: Event) => {
      if (busy || !window.confirm("Discard your unsaved changes?")) event.preventDefault();
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("manager:before-navigate", navigate);
    return () => { window.removeEventListener("beforeunload", unload); window.removeEventListener("manager:before-navigate", navigate); };
  }, [dirty, busy]);
}

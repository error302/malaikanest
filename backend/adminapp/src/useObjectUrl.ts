import { useEffect, useState } from "react";

/** Release file previews when replaced or when the editor closes. */
export function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file) { setUrl(undefined); return; }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return file ? url : undefined;
}

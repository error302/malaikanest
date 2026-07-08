'use client';

import { toast } from 'sonner';

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof window === 'undefined') return;
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    case 'info':
    default:
      toast.info(message);
      break;
  }
}

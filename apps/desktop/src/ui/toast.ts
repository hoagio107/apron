import { addToast, closeToast, closeAll } from '@heroui/react';
import type { ToastProps } from '@heroui/react';

function baseToast(titleOrProps: string | ToastProps, description?: string) {
  if (typeof titleOrProps === 'string') {
    return addToast({
      title: titleOrProps,
      description,
      color: 'default',
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    });
  }
  return addToast({
    timeout: 3000,
    shouldShowTimeoutProgress: true,
    ...titleOrProps,
  });
}

export const toast = Object.assign(baseToast, {
  success: (title: string, description?: string) =>
    addToast({
      title,
      description,
      color: 'success',
      severity: 'success',
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    }),
  error: (title: string, description?: string) =>
    addToast({
      title,
      description,
      color: 'danger',
      severity: 'danger',
      timeout: 4000,
      shouldShowTimeoutProgress: true,
    }),
  warning: (title: string, description?: string) =>
    addToast({
      title,
      description,
      color: 'warning',
      severity: 'warning',
      timeout: 3500,
      shouldShowTimeoutProgress: true,
    }),
  info: (title: string, description?: string) =>
    addToast({
      title,
      description,
      color: 'primary',
      severity: 'primary',
      timeout: 3000,
      shouldShowTimeoutProgress: true,
    }),
  close: closeToast,
  closeAll: closeAll,
});

export { addToast, closeToast, closeAll };
export type { ToastProps };

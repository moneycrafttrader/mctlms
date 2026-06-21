'use client';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const handleClose = onClose ?? onCancel ?? (() => {});
  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={cn(
            'mb-4 flex h-12 w-12 items-center justify-center rounded-full',
            variant === 'danger' ? 'bg-red-50' : 'bg-amber-50',
          )}
        >
          <AlertTriangle
            className={cn(
              'h-6 w-6',
              variant === 'danger' ? 'text-red-500' : 'text-amber-500',
            )}
          />
        </div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="mt-2 text-sm text-text-secondary">{message}</p>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-surface-border">
        <Button variant="secondary" onClick={handleClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

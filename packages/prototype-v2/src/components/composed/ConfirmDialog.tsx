import { Text, Button, Stack } from '@/primitives';
import { Modal } from './Modal';

export interface ConfirmDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Called when the dialog requests to close */
    onClose: () => void;
    /** Called when the user confirms the action */
    onConfirm: () => void;
    /** Dialog title */
    title: string;
    /** Descriptive message */
    message: string;
    /** Confirm button label (default: "Confirm") */
    confirmLabel?: string;
    /** Cancel button label (default: "Cancel") */
    cancelLabel?: string;
    /** Confirm button variant (default: "danger") */
    confirmVariant?: 'primary' | 'danger';
    /** Additional CSS classes for the modal card */
    className?: string;
}

/**
 * Pre-composed confirmation dialog for destructive or important actions.
 * Wraps Modal with title, message, and cancel/confirm buttons.
 *
 * @example
 * <ConfirmDialog
 *   open={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Character"
 *   message="This action cannot be undone. Are you sure?"
 *   confirmLabel="Delete"
 * />
 */
export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'danger',
    className,
}: ConfirmDialogProps) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            closeOnBackdrop={false}
            maxWidth={400}
            aria-label={title}
            className={className}
        >
            <Stack direction="vertical" gap={4}>
                <Text variant="heading">{title}</Text>
                <Text variant="body" color="secondary">{message}</Text>
                <Stack direction="horizontal" gap={3} justify="end">
                    <Button variant="ghost" onClick={onClose}>
                        {cancelLabel}
                    </Button>
                    <Button variant={confirmVariant} onClick={onConfirm}>
                        {confirmLabel}
                    </Button>
                </Stack>
            </Stack>
        </Modal>
    );
}

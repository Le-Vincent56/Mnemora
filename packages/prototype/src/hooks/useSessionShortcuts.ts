import { useEffect, useCallback } from 'react';

export interface SessionShortcutHandlers {
    onSafetyTools?: () => void;  // S key
    onQuickNote?: () => void;    // N key
}

export interface UseSessionShortcutsOptions {
    isSessionActive: boolean;
    isModalOpen?: boolean;
    handlers: SessionShortcutHandlers;
}

/**
 * Hook to manage keyboard shortcuts during Session Mode.
 *
 * Shortcuts are only active when:
 * - Session is active
 * - No modal is currently open
 * - Focus is not in an editable element
 *
 * Supported shortcuts:
 * - S: Open Safety Tools reference
 * - N: Open Quick Note capture
 */
export function useSessionShortcuts({
    isSessionActive,
    isModalOpen = false,
    handlers
}: UseSessionShortcutsOptions): void {
    const isEditableElement = useCallback((element: Element | null): boolean => {
        if (!element) return false;

        const tagName = element.tagName.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea') {
            return true;
        }

        if (element.getAttribute('contenteditable') === 'true') {
            return true;
        }

        // Check if inside a form field
        if (element.closest('input, textarea, [contenteditable="true"]')) {
            return true;
        }

        return false;
    }, []);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Don't handle shortcuts if session is not active
        if (!isSessionActive) return;

        // Don't handle shortcuts if a modal is open
        if (isModalOpen) return;

        // Don't handle shortcuts if focus is in an editable element
        if (isEditableElement(document.activeElement)) return;

        // Don't handle if modifier keys are pressed (except for combinations we explicitly handle)
        if (event.ctrlKey || event.metaKey || event.altKey) return;

        const key = event.key.toLowerCase();

        switch (key) {
            case 's':
                if (handlers.onSafetyTools) {
                    event.preventDefault();
                    handlers.onSafetyTools();
                }
                break;

            case 'n':
                if (handlers.onQuickNote) {
                    event.preventDefault();
                    handlers.onQuickNote();
                }
                break;
        }
    }, [isSessionActive, isModalOpen, isEditableElement, handlers]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
import { Play, CheckCircle } from 'lucide-react';
import './StartSessionAction.css';

interface StartSessionActionProps {
    isActive: boolean;
    onStart: (e: React.MouseEvent) => void;
}

export function StartSessionAction({ isActive, onStart }: StartSessionActionProps) {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!isActive) {
            onStart(e);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            if (!isActive) {
                onStart(e as unknown as React.MouseEvent);
            }
        }
    };

    return (
        <span
            className={`start-session-action ${isActive ? 'start-session-action--active' : ''}`}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={isActive ? -1 : 0}
            aria-label={isActive ? 'This session is active' : 'Start this session'}
            aria-disabled={isActive}
        >
            {isActive ? (
                <>
                    <CheckCircle size={14} />
                    <span>Active</span>
                </>
            ) : (
                <>
                    <Play size={14} />
                    <span>Start Session</span>
                </>
            )}
        </span>
    );
}
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

    return (
        <button
            className={`start-session-action ${isActive ? 'start-session-action--active' : ''}`}
            onClick={handleClick}
            title={isActive ? 'This session is active' : 'Start this session'}
            disabled={isActive}
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
        </button>
    );
}
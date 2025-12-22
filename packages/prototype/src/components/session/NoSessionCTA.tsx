import { Play } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import './NoSessionCTA.css';

interface NoSessionCTAProps {
    onGoToPrep: () => void;
}

export function NoSessionCTA({ onGoToPrep }: NoSessionCTAProps) {
    return (
        <div className="no-session-cta">
            <EmptyState title="No active session" />
            <div className="no-session-cta__content">
                <p className="no-session-cta__text">
                    Start a session from Prep Mode to begin tracking
                </p>
                <button className="no-session-cta__button" onClick={onGoToPrep}>
                    <Play size={16} />
                    Go to Prep Mode
                </button>
            </div>
        </div>
    );
}
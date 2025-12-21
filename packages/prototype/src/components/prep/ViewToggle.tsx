import { motion } from 'framer-motion';
import { LayoutGrid, List } from 'lucide-react';
import './ViewToggle.css';

export type ViewMode = 'cards' | 'list';

interface ViewToggleProps {
    mode: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
    return (
        <div className="view-toggle" role="radiogroup" aria-label="View mode">
            <button
                className={`view-toggle__btn ${mode === 'cards' ? 'view-toggle__btn--active' : ''}`}
                onClick={() => onChange('cards')}
                aria-label="Card view"
                aria-pressed={mode === 'cards'}
                role="radio"
                aria-checked={mode === 'cards'}
            >
                <LayoutGrid size={16} />
                {mode === 'cards' && (
                    <motion.div
                        className="view-toggle__indicator"
                        layoutId="viewToggleIndicator"
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    />
                )}
            </button>

            <button
                className={`view-toggle__btn ${mode === 'list' ? 'view-toggle__btn--active' : ''}`}
                onClick={() => onChange('list')}
                aria-label="List view"
                aria-pressed={mode === 'list'}
                role="radio"
                aria-checked={mode === 'list'}
            >
                <List size={16} />
                {mode === 'list' && (
                    <motion.div
                        className="view-toggle__indicator"
                        layoutId="viewToggleIndicator"
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    />
                )}
            </button>
        </div>
    );
}
import { useState, useCallback, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { EntityType } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import './MentionChip.css';

interface MentionChipProps {
    /** Entity data for the mention */
    entity: {
        id: string;
        name: string;
        type: EntityType;
    };
    /** Called when the chip is clicked (opens QuickRefCard) */
    onClick: () => void;
    /** Called when the remove button is clicked */
    onRemove: () => void;
}

/**
 * MentionChip displays an inline reference to an entity.
 * Used within text fields to show @mentions as interactive chips.
 */
export function MentionChip({ entity, onClick, onRemove }: MentionChipProps) {
    const [isHovered, setIsHovered] = useState(false);

    // Handle keyboard interaction for accessibility
    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLButtonElement>) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
            } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                onRemove();
            }
        },
        [onClick, onRemove]
    );

    // Handle remove button click (prevent bubbling to chip click)
    const handleRemoveClick = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onRemove();
        },
        [onRemove]
    );

    return (
        <motion.button
            type="button"
            className={`mention-chip mention-chip--${entity.type}`}
            onClick={onClick}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ y: -1 }}
            transition={{
                type: 'spring',
                stiffness: 500,
                damping: 30,
            }}
            aria-label={`Open ${entity.name} (${entity.type})`}
        >
            <span className="mention-chip__icon">
                <EntityTypeIcon type={entity.type} size={12} />
            </span>
            <span className="mention-chip__name">{entity.name}</span>

            {/* Remove button - appears on hover */}
            <motion.button
                type="button"
                className="mention-chip__remove"
                onClick={handleRemoveClick}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                    opacity: isHovered ? 1 : 0,
                    scale: isHovered ? 1 : 0.8,
                }}
                transition={{ duration: 0.15 }}
                aria-label={`Remove ${entity.name}`}
                tabIndex={-1} // Not focusable; use Delete key on chip instead
            >
                <X size={10} />
            </motion.button>
        </motion.button>
    );
}
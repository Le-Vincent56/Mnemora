import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { SafetyToolQuickRef, SafetyTool } from './SafetyToolQuickRef';
import './SafetyToolsIconRailItem.css';

export interface SafetyToolsIconRailItemProps {
    tools: SafetyTool[];
    isSessionActive?: boolean;
}

export function SafetyToolsIconRailItem({
    tools,
    isSessionActive = true
}: SafetyToolsIconRailItemProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const enabledCount = tools.length;
    const hasTools = enabledCount > 0;

    const handleOpen = useCallback(() => {
        if (isSessionActive) {
            setIsModalOpen(true);
        }
    }, [isSessionActive]);

    const handleClose = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    // Construct accessible label
    const ariaLabel = hasTools
        ? `Safety tools, ${enabledCount} ${enabledCount === 1 ? 'tool' : 'tools'} enabled`
        : 'Safety tools, none configured';

    return (
        <>
            <motion.button
                ref={buttonRef}
                className={`safety-icon-rail-item ${!isSessionActive ? 'safety-icon-rail-item--disabled' : ''}`}
                onClick={handleOpen}
                whileHover={isSessionActive ? { scale: 1.05 } : undefined}
                whileTap={isSessionActive ? { scale: 0.95 } : undefined}
                title="Safety Tools (S)"
                aria-label={ariaLabel}
                disabled={!isSessionActive}
            >
                <Shield size={20} />

                {hasTools && (
                    <span
                        className="safety-icon-rail-item__badge"
                        aria-hidden="true"
                    >
                        {enabledCount}
                    </span>
                )}
            </motion.button>

            <SafetyToolQuickRef
                isOpen={isModalOpen}
                onClose={handleClose}
                tools={tools}
                returnFocusRef={buttonRef}
            />
        </>
    );
}
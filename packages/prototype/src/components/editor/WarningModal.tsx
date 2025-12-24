import { motion, AnimatePresence } from 'framer-motion';
import './WarningModal.css';

type WarningType = 'unsaved' | 'delete' | null;

interface WarningModalProps {
    type: WarningType;
    entityName: string;
    onDiscard: () => void;
    onKeepEditing: () => void;
    onSaveAndClose: () => void;
    onDeleteConfirm: () => void;
    onCancel: () => void;
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        transition: {
            duration: 0.15,
            ease: [0.32, 0, 0.67, 0]
        }
    }
};

export function WarningModal({
    type,
    entityName,
    onDiscard,
    onKeepEditing,
    onSaveAndClose,
    onDeleteConfirm,
    onCancel,
}: WarningModalProps) {
    return (
        <AnimatePresence>
            {type && (
                <motion.div
                    className="warning-modal"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.15 }}
                >
                    <motion.div
                        className={`warning-modal__card ${type === 'delete' ? 'warning-modal__card--delete' : ''}`}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {type === 'unsaved' && (
                            <>
                                <h3 className="warning-modal__title">Unsaved Changes</h3>
                                <p className="warning-modal__text">
                                    You have unsaved changes. Would you like to save before closing?
                                </p>
                                <div className="warning-modal__actions">
                                    <button
                                        type="button"
                                        className="warning-modal__btn warning-modal__btn--ghost"
                                        onClick={onDiscard}
                                    >
                                        Discard
                                    </button>
                                    <button
                                        type="button"
                                        className="warning-modal__btn warning-modal__btn--secondary"
                                        onClick={onKeepEditing}
                                    >
                                        Keep Editing
                                    </button>
                                    <button
                                        type="button"
                                        className="warning-modal__btn warning-modal__btn--primary"
                                        onClick={onSaveAndClose}
                                    >
                                        Save & Close
                                    </button>
                                </div>
                            </>
                        )}

                        {type === 'delete' && (
                            <>
                                <h3 className="warning-modal__title warning-modal__title--danger">
                                    Delete Entity
                                </h3>
                                <p className="warning-modal__text">
                                    Are you sure you want to delete{' '}
                                    <strong className="warning-modal__entity-name">
                                        {entityName}
                                    </strong>
                                    ? This action cannot be undone.
                                </p>
                                <div className="warning-modal__actions">
                                    <button
                                        type="button"
                                        className="warning-modal__btn warning-modal__btn--secondary"
                                        onClick={onCancel}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="warning-modal__btn warning-modal__btn--danger"
                                        onClick={onDeleteConfirm}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
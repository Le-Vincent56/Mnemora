import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { SafetyToolsSection, SafetyToolState, DEFAULT_SAFETY_TOOLS } from '../safety/SafetyToolsSection';
import './CampaignCreationModal.css';

interface CampaignCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (campaign: {
        name: string;
        description?: string;
        worldId: string;
        safetyTools: SafetyToolState;
    }) => void;
    worlds: Array<{ id: string; name: string }>;
    preselectedWorldId?: string;
}

const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
};

const cardVariants = {
    hidden: {
        opacity: 0,
        scale: 0.95,
        y: 12
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.23, 1, 0.32, 1]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.98,
        y: 8,
        transition: {
            duration: 0.15,
            ease: [0.32, 0, 0.67, 0]
        }
    }
};

export function CampaignCreationModal({
    isOpen,
    onClose,
    onCreate,
    worlds,
    preselectedWorldId,
}: CampaignCreationModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [worldId, setWorldId] = useState(preselectedWorldId ?? '');
    const [nameError, setNameError] = useState<string | null>(null);
    const [worldError, setWorldError] = useState<string | null>(null);
    const [touched, setTouched] = useState({ name: false, world: false });
    const [boundariesExpanded, setBoundariesExpanded] = useState(false);
    const [safetyTools, setSafetyTools] = useState<SafetyToolState>(DEFAULT_SAFETY_TOOLS);

    const nameInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setWorldId(preselectedWorldId ?? '');
        } else {
            setName('');
            setDescription('');
            setWorldId(preselectedWorldId ?? '');
            setNameError(null);
            setWorldError(null);
            setTouched({ name: false, world: false });
            setBoundariesExpanded(false);
            setSafetyTools(DEFAULT_SAFETY_TOOLS);
        }
    }, [isOpen, preselectedWorldId]);

    // Focus name input when modal opens
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                nameInputRef.current?.focus();
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    // Escape key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Focus trap
    useEffect(() => {
        if (!isOpen || !modalRef.current) return;

        const modal = modalRef.current;
        const getFocusableElements = () => modal.querySelectorAll<HTMLElement>(
            'input, select, textarea, button, [tabindex]:not([tabindex="-1"])'
        );

        const handleTab = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusableElements = getFocusableElements();
            const firstFocusable = focusableElements[0];
            const lastFocusable = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable?.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleTab);
        return () => document.removeEventListener('keydown', handleTab);
    }, [isOpen, boundariesExpanded]);

    const validateName = useCallback((value: string): string | null => {
        const trimmed = value.trim();
        if (!trimmed) return 'Campaign name is required';
        if (trimmed.length > 100) return 'Name cannot exceed 100 characters';
        return null;
    }, []);

    const validateWorld = useCallback((value: string): string | null => {
        if (!value) return 'Please select a world';
        return null;
    }, []);

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value);
        if (touched.name && !validateName(value)) {
            setNameError(null);
        }
    };

    const handleNameBlur = () => {
        setTouched(prev => ({ ...prev, name: true }));
        setNameError(validateName(name));
    };

    const handleWorldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setWorldId(value);
        if (touched.world && !validateWorld(value)) {
            setWorldError(null);
        }
    };

    const handleWorldBlur = () => {
        setTouched(prev => ({ ...prev, world: true }));
        setWorldError(validateWorld(worldId));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const nameErr = validateName(name);
        const worldErr = validateWorld(worldId);

        if (nameErr || worldErr) {
            setNameError(nameErr);
            setWorldError(worldErr);
            setTouched({ name: true, world: true });
            if (nameErr) {
                nameInputRef.current?.focus();
            }
            return;
        }

        onCreate({
            name: name.trim(),
            description: description.trim() || undefined,
            worldId,
            safetyTools,
        });
    };

    const toggleBoundaries = () => {
        setBoundariesExpanded(prev => !prev);
    };

    const isValid = !validateName(name) && !validateWorld(worldId);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="creation-modal"
                    variants={overlayVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.15 }}
                    onClick={onClose}
                >
                    <motion.div
                        ref={modalRef}
                        className="creation-modal__card creation-modal__card--campaign"
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="campaign-modal-title"
                    >
                        <h2 id="campaign-modal-title" className="creation-modal__title">
                            Create New Campaign
                        </h2>

                        <form onSubmit={handleSubmit} className="creation-modal__form">
                            {/* Campaign Name */}
                            <div className="creation-modal__field">
                                <label
                                    htmlFor="campaign-name"
                                    className="creation-modal__label"
                                >
                                    Campaign Name <span className="creation-modal__required">*</span>
                                </label>
                                <input
                                    ref={nameInputRef}
                                    id="campaign-name"
                                    type="text"
                                    className={`creation-modal__input ${touched.name && nameError ? 'creation-modal__input--error' : ''}`}
                                    value={name}
                                    onChange={handleNameChange}
                                    onBlur={handleNameBlur}
                                    placeholder="Enter campaign name"
                                    maxLength={100}
                                    aria-invalid={touched.name && !!nameError}
                                    aria-describedby={nameError ? 'campaign-name-error' : undefined}
                                    autoComplete="off"
                                />
                                {touched.name && nameError && (
                                    <span
                                        id="campaign-name-error"
                                        className="creation-modal__error"
                                        role="alert"
                                    >
                                        {nameError}
                                    </span>
                                )}
                            </div>

                            {/* Description */}
                            <div className="creation-modal__field">
                                <label
                                    htmlFor="campaign-description"
                                    className="creation-modal__label"
                                >
                                    Description
                                </label>
                                <textarea
                                    id="campaign-description"
                                    className="creation-modal__textarea"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="A brief description of your campaign..."
                                    rows={3}
                                    maxLength={500}
                                    autoComplete="off"
                                />
                                <span className="creation-modal__hint">
                                    Optional — helps you remember what this campaign is about
                                </span>
                            </div>

                            {/* World Selector */}
                            <div className="creation-modal__field">
                                <label
                                    htmlFor="campaign-world"
                                    className="creation-modal__label"
                                >
                                    World <span className="creation-modal__required">*</span>
                                </label>
                                <select
                                    id="campaign-world"
                                    className={`creation-modal__select ${touched.world && worldError ? 'creation-modal__select--error' : ''}`}
                                    value={worldId}
                                    onChange={handleWorldChange}
                                    onBlur={handleWorldBlur}
                                    aria-invalid={touched.world && !!worldError}
                                    aria-describedby={worldError ? 'campaign-world-error' : undefined}
                                >
                                    <option value="">Select a world...</option>
                                    {worlds.map(world => (
                                        <option key={world.id} value={world.id}>
                                            {world.name}
                                        </option>
                                    ))}
                                </select>
                                {touched.world && worldError && (
                                    <span
                                        id="campaign-world-error"
                                        className="creation-modal__error"
                                        role="alert"
                                    >
                                        {worldError}
                                    </span>
                                )}
                            </div>

                            {/* Table Boundaries (Collapsible) */}
                            <div className="creation-modal__boundaries">
                                <button
                                    type="button"
                                    className="creation-modal__boundaries-toggle"
                                    onClick={toggleBoundaries}
                                    aria-expanded={boundariesExpanded}
                                    aria-controls="boundaries-content"
                                >
                                    <ChevronRight
                                        size={16}
                                        className={`creation-modal__boundaries-chevron ${boundariesExpanded ? 'creation-modal__boundaries-chevron--expanded' : ''}`}
                                    />
                                    <span className="creation-modal__boundaries-label">Table Boundaries</span>
                                    <span className="creation-modal__boundaries-badge">Optional</span>
                                </button>

                                <div
                                    id="boundaries-content"
                                    className={`creation-modal__boundaries-content ${boundariesExpanded ? 'creation-modal__boundaries-content--expanded' : ''}`}
                                    aria-hidden={!boundariesExpanded}
                                >
                                    <div className="creation-modal__boundaries-inner">
                                        <p className="creation-modal__boundaries-description">
                                            Configure safety tools for your table. These can be adjusted later in Campaign Settings.
                                        </p>

                                        <div className="creation-modal__boundaries-tools">
                                            <SafetyToolsSection
                                                value={safetyTools}
                                                onChange={setSafetyTools}
                                                onSetupLinesAndVeils={() => {
                                                    // TODO: Open LinesAndVeilsEditor modal
                                                    console.log('Setup Lines & Veils');
                                                }}
                                                onAddCustomBoundary={() => {
                                                    // TODO: Open CustomBoundaryEditor modal
                                                    console.log('Add custom boundary');
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="creation-modal__actions">
                                <button
                                    type="button"
                                    className="creation-modal__btn creation-modal__btn--ghost"
                                    onClick={onClose}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="creation-modal__btn creation-modal__btn--primary"
                                    disabled={!isValid}
                                >
                                    Create Campaign
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X, User, MapPin, Users, FileText, StickyNote, Check } from 'lucide-react';
import { EntityType } from '@/data/mockData';
import './FilterBar.css';

// Types
export type SortOption = 'recent' | 'name' | 'created' | 'type';

interface FilterBarProps {
    selectedType: EntityType | null;
    onTypeChange: (type: EntityType | null) => void;
    selectedTags: string[];
    onTagsChange: (tags: string[]) => void;
    availableTags: string[];
    sortBy: SortOption;
    onSortChange: (sort: SortOption) => void;
    entityCount: number;
    typeCounts: Record<EntityType, number>;
}

// Constants
const ENTITY_TYPE_OPTIONS: { type: EntityType; label: string; icon: React.ReactNode }[] = [
    { type: 'character', label: 'Characters', icon: <User size={14} /> },
    { type: 'location', label: 'Locations', icon: <MapPin size={14} /> },
    { type: 'faction', label: 'Factions', icon: <Users size={14} /> },
    { type: 'session', label: 'Sessions', icon: <FileText size={14} /> },
    { type: 'note', label: 'Notes', icon: <StickyNote size={14} /> },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'recent', label: 'Recent' },
    { value: 'name', label: 'Name' },
    { value: 'created', label: 'Created' },
    { value: 'type', label: 'Type' },
];

// Dropdown Component
interface DropdownProps {
    trigger: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

function Dropdown({ trigger, isOpen, onToggle, onClose, children, align = 'left' }: DropdownProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    return (
        <div className="filter-dropdown" ref={ref}>
            <button
                className={`filter-dropdown__trigger ${isOpen ? 'filter-dropdown__trigger--active' : ''}`}
                onClick={onToggle}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                {trigger}
                <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="filter-dropdown__chevron"
                >
                    <ChevronDown size={14} />
                </motion.span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={`filter-dropdown__menu filter-dropdown__menu--${align}`}
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// FilterBar Component
export function FilterBar({
    selectedType,
    onTypeChange,
    selectedTags,
    onTagsChange,
    availableTags,
    sortBy,
    onSortChange,
    entityCount,
    typeCounts,
}: FilterBarProps) {
    const [typeOpen, setTypeOpen] = useState(false);
    const [tagOpen, setTagOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);

    const selectedTypeOption = useMemo(
        () => ENTITY_TYPE_OPTIONS.find((o) => o.type === selectedType),
        [selectedType]
    );

    const handleTypeSelect = useCallback(
        (type: EntityType | null) => {
            onTypeChange(type);
            setTypeOpen(false);
        },
        [onTypeChange]
    );

    const handleTagToggle = useCallback(
        (tag: string) => {
            if (selectedTags.includes(tag)) {
                onTagsChange(selectedTags.filter((t) => t !== tag));
            } else {
                onTagsChange([...selectedTags, tag]);
            }
        },
        [selectedTags, onTagsChange]
    );

    const handleRemoveTag = useCallback(
        (tag: string) => {
            onTagsChange(selectedTags.filter((t) => t !== tag));
        },
        [selectedTags, onTagsChange]
    );

    const handleSortSelect = useCallback(
        (sort: SortOption) => {
            onSortChange(sort);
            setSortOpen(false);
        },
        [onSortChange]
    );

    const sortLabel = useMemo(
        () => SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Recent',
        [sortBy]
    );

    return (
        <div className="filter-bar">
            <div className="filter-bar__filters">
                {/* Type Filter */}
                <Dropdown
                    isOpen={typeOpen}
                    onToggle={() => setTypeOpen(!typeOpen)}
                    onClose={() => setTypeOpen(false)}
                    trigger={
                        selectedTypeOption ? (
                            <>
                                <span
                                    className="filter-dropdown__icon"
                                    data-type={selectedTypeOption.type}
                                >
                                    {selectedTypeOption.icon}
                                </span>
                                <span>{selectedTypeOption.label}</span>
                            </>
                        ) : (
                            <span>All Types</span>
                        )
                    }
                >
                    <button
                        className={`filter-dropdown__item ${!selectedType ? 'filter-dropdown__item--selected' : ''}`}
                        onClick={() => handleTypeSelect(null)}
                    >
                        <span className="filter-dropdown__item-check">
                            {!selectedType && <Check size={14} />}
                        </span>
                        <span>All Types</span>
                    </button>

                    <div className="filter-dropdown__divider" />

                    {ENTITY_TYPE_OPTIONS.map((option) => (
                        <button
                            key={option.type}
                            className={`filter-dropdown__item ${selectedType === option.type ? 'filter-dropdown__item--selected' : ''}`}
                            onClick={() => handleTypeSelect(option.type)}
                        >
                            <span className="filter-dropdown__item-check">
                                {selectedType === option.type && <Check size={14} />}
                            </span>
                            <span
                                className="filter-dropdown__item-icon"
                                data-type={option.type}
                            >
                                {option.icon}
                            </span>
                            <span className="filter-dropdown__item-label">{option.label}</span>
                            <span className="filter-dropdown__item-count">
                                ({typeCounts[option.type] || 0})
                            </span>
                        </button>
                    ))}
                </Dropdown>

                {/* Tag Filter */}
                <Dropdown
                    isOpen={tagOpen}
                    onToggle={() => setTagOpen(!tagOpen)}
                    onClose={() => setTagOpen(false)}
                    trigger={<span>Tags</span>}
                >
                    <div className="filter-dropdown__tag-list">
                        {availableTags.length === 0 ? (
                            <span className="filter-dropdown__empty">No tags available</span>
                        ) : (
                            availableTags.map((tag) => (
                                <button
                                    key={tag}
                                    className={`filter-dropdown__tag ${selectedTags.includes(tag) ? 'filter-dropdown__tag--selected' : ''}`}
                                    onClick={() => handleTagToggle(tag)}
                                >
                                    {selectedTags.includes(tag) && <Check size={12} />}
                                    {tag}
                                </button>
                            ))
                        )}
                    </div>
                </Dropdown>

                {/* Active Tag Chips - use CSS instead of Framer Motion */}
                {selectedTags.map((tag, i) => (
                    <button
                        key={tag}
                        className="filter-bar__tag-chip"
                        onClick={() => handleRemoveTag(tag)}
                        style={{ animationDelay: `${i * 0.03}s` }}
                        aria-label={`Remove ${tag} filter`}
                    >
                        <span>{tag}</span>
                        <X size={12} />
                    </button>
                ))}
            </div>

            <div className="filter-bar__right">
                {/* Sort Dropdown */}
                <Dropdown
                    isOpen={sortOpen}
                    onToggle={() => setSortOpen(!sortOpen)}
                    onClose={() => setSortOpen(false)}
                    trigger={
                        <>
                            <span className="filter-bar__sort-label">Sort:</span>
                            <span>{sortLabel}</span>
                        </>
                    }
                    align="right"
                >
                    {SORT_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            className={`filter-dropdown__item ${sortBy === option.value ? 'filter-dropdown__item--selected' : ''}`}
                            onClick={() => handleSortSelect(option.value)}
                        >
                            <span className="filter-dropdown__item-check">
                                {sortBy === option.value && <Check size={14} />}
                            </span>
                            <span>{option.label}</span>
                        </button>
                    ))}
                </Dropdown>

                {/* Entity Count */}
                <span className="filter-bar__count">
                    {entityCount} {entityCount === 1 ? 'entity' : 'entities'}
                </span>
            </div>
        </div>
    );
}
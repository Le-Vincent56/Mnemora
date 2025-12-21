import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import './TagInput.css';

interface TagInputProps {
    /** Currently selected tags */
    value: string[];
    /** Callback when tags change */
    onChange: (tags: string[]) => void;
    /** Available tags for autocomplete (from world) */
    availableTags?: string[];
    /** Placeholder text when no tags and not focused */
    placeholder?: string;
    /** Accessible label */
    'aria-label'?: string;
}

interface ChipState {
    tag: string;
    isRemoving: boolean;
}

export function TagInput({
    value,
    onChange,
    availableTags = [],
    placeholder = 'Add tag...',
    'aria-label': ariaLabel = 'Tags',
}: TagInputProps) {
    const [inputValue, setInputValue] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [chips, setChips] = useState<ChipState[]>(() =>
        value.map(tag => ({ tag, isRemoving: false }))
    );

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync chips with external value changes
    useEffect(() => {
        setChips(value.map(tag => ({ tag, isRemoving: false })));
    }, [value]);

    // Filter available tags based on input (exclude already selected)
    const filteredTags = availableTags.filter(tag => {
        const matchesInput = tag.toLowerCase().includes(inputValue.toLowerCase());
        const notAlreadySelected = !value.includes(tag);
        return matchesInput && notAlreadySelected && inputValue.trim() !== '';
    });

    // Show dropdown when we have matches
    useEffect(() => {
        if (isFocused && filteredTags.length > 0) {
            setShowDropdown(true);
            setHighlightedIndex(0);
        } else {
            setShowDropdown(false);
            setHighlightedIndex(-1);
        }
    }, [isFocused, filteredTags.length]);

    const addTag = useCallback((tag: string) => {
        const trimmedTag = tag.trim().toLowerCase();
        if (trimmedTag && !value.includes(trimmedTag)) {
            onChange([...value, trimmedTag]);
        }
        setInputValue('');
    }, [value, onChange]);

    const removeTag = useCallback((tagToRemove: string) => {
        // Trigger exit animation
        setChips(prev =>
            prev.map(chip =>
                chip.tag === tagToRemove
                    ? { ...chip, isRemoving: true }
                    : chip
            )
        );

        // After animation, actually remove
        setTimeout(() => {
            onChange(value.filter(tag => tag !== tagToRemove));
        }, 100); // Match chip-exit animation duration
    }, [value, onChange]);

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                if (showDropdown && highlightedIndex >= 0) {
                    addTag(filteredTags[highlightedIndex]);
                } else if (inputValue.trim()) {
                    addTag(inputValue);
                }
                break;

            case ',':
                e.preventDefault();
                if (inputValue.trim()) {
                    addTag(inputValue);
                }
                break;

            case 'Backspace':
                if (inputValue === '' && value.length > 0) {
                    removeTag(value[value.length - 1]);
                }
                break;

            case 'ArrowDown':
                e.preventDefault();
                if (showDropdown) {
                    setHighlightedIndex(prev =>
                        prev < filteredTags.length - 1 ? prev + 1 : prev
                    );
                }
                break;

            case 'ArrowUp':
                e.preventDefault();
                if (showDropdown) {
                    setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
                }
                break;

            case 'Escape':
                setShowDropdown(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleContainerClick = () => {
        inputRef.current?.focus();
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    const handleBlur = (e: React.FocusEvent) => {
        // Check if focus is moving to a dropdown item
        if (containerRef.current?.contains(e.relatedTarget as Node)) {
            return;
        }
        setIsFocused(false);
        setShowDropdown(false);

        // Add any pending input as tag
        if (inputValue.trim()) {
            addTag(inputValue);
        }
    };

    const handleDropdownSelect = (tag: string) => {
        addTag(tag);
        inputRef.current?.focus();
    };

    // Highlight matching text in suggestion
    const highlightMatch = (tag: string) => {
        if (!inputValue.trim()) return tag;

        const lowerTag = tag.toLowerCase();
        const lowerInput = inputValue.toLowerCase();
        const matchIndex = lowerTag.indexOf(lowerInput);

        if (matchIndex === -1) return tag;

        return (
            <>
                {tag.slice(0, matchIndex)}
                <span className="tag-input__match">
                    {tag.slice(matchIndex, matchIndex + inputValue.length)}
                </span>
                {tag.slice(matchIndex + inputValue.length)}
            </>
        );
    };

    return (
        <div
            ref={containerRef}
            className={`tag-input ${isFocused ? 'tag-input--focused' : ''}`}
            onClick={handleContainerClick}
            role="group"
            aria-label={ariaLabel}
        >
            {chips.map(({ tag, isRemoving }) => (
                <span
                    key={tag}
                    className={`tag-input__chip ${isRemoving ? 'tag-input__chip--removing' : ''}`}
                >
                    {tag}
                    <button
                        type="button"
                        className="tag-input__chip-remove"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeTag(tag);
                        }}
                        aria-label={`Remove ${tag}`}
                        tabIndex={-1}
                    >
                        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M2 2l6 6M8 2l-6 6" />
                        </svg>
                    </button>
                </span>
            ))}

            <div className="tag-input__input-wrapper">
                <input
                    ref={inputRef}
                    type="text"
                    className="tag-input__input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={value.length === 0 ? placeholder : ''}
                    aria-label="Add new tag"
                    aria-autocomplete="list"
                    aria-controls={showDropdown ? 'tag-suggestions' : undefined}
                    aria-activedescendant={
                        showDropdown && highlightedIndex >= 0
                            ? `tag-suggestion-${highlightedIndex}`
                            : undefined
                    }
                />

                {showDropdown && (
                    <div
                        id="tag-suggestions"
                        className="tag-input__dropdown"
                        role="listbox"
                    >
                        {filteredTags.length > 0 ? (
                            filteredTags.map((tag, index) => (
                                <div
                                    key={tag}
                                    id={`tag-suggestion-${index}`}
                                    className={`tag-input__dropdown-item ${index === highlightedIndex
                                            ? 'tag-input__dropdown-item--highlighted'
                                            : ''
                                        }`}
                                    role="option"
                                    aria-selected={index === highlightedIndex}
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent blur
                                        handleDropdownSelect(tag);
                                    }}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                >
                                    {highlightMatch(tag)}
                                </div>
                            ))
                        ) : (
                            <div className="tag-input__dropdown-empty">
                                No matching tags
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
import {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
    KeyboardEvent,
    forwardRef,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Entity, EntityType } from '@/data/mockData';
import { EntityTypeIcon } from '@/components/entity/EntityTypeIcon';
import './MentionTextArea.css';

/**
 * Represents a mention embedded in the text.
 */
export interface MentionData {
    id: string;
    name: string;
    type: EntityType;
    /** Start position in the text (index of @) */
    startIndex: number;
    /** End position in the text (after the name or closing quote) */
    endIndex: number;
}

/**
 * Parsed segment of text content.
 */
type TextSegment =
    | { type: 'text'; content: string }
    | { type: 'mention'; mention: MentionData };

interface MentionTextAreaProps {
    /** The raw text value including mention syntax */
    value: string;
    /** Called when value or mentions change */
    onChange: (value: string, mentions: MentionData[]) => void;
    /** Available entities for mention autocomplete */
    entities: Entity[];
    /** Called when user clicks on a mention chip */
    onMentionClick: (entityId: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Disable the textarea */
    disabled?: boolean;
    /** Minimum height */
    minHeight?: number;
}

/**
 * Calculates caret coordinates within a textarea.
 * Uses a hidden mirror div to measure text positions.
 */
function getCaretCoordinates(
    element: HTMLTextAreaElement,
    position: number
): { top: number; left: number } {
    const mirror = document.createElement('div');
    const style = getComputedStyle(element);

    // Copy relevant styles
    const properties = [
        'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
        'letterSpacing', 'textTransform', 'wordSpacing',
        'lineHeight', 'padding', 'border', 'boxSizing',
        'whiteSpace', 'wordBreak', 'overflowWrap',
    ];

    properties.forEach((prop) => {
        mirror.style[prop as any] = style.getPropertyValue(
            prop.replace(/([A-Z])/g, '-$1').toLowerCase()
        );
    });

    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.style.width = `${element.offsetWidth}px`;

    const textBefore = element.value.substring(0, position);
    mirror.textContent = textBefore;

    // Add a span at the caret position
    const caret = document.createElement('span');
    caret.textContent = '|';
    mirror.appendChild(caret);

    document.body.appendChild(mirror);

    const caretRect = caret.getBoundingClientRect();
    const mirrorRect = mirror.getBoundingClientRect();

    document.body.removeChild(mirror);

    return {
        top: caretRect.top - mirrorRect.top,
        left: caretRect.left - mirrorRect.left,
    };
}

/**
   * Parses text to extract mentions and text segments.
   */
function parseTextWithMentions(text: string, entities: Entity[]): TextSegment[] {
    const segments: TextSegment[] = [];
    // Match @Name or @"Name With Spaces"
    const mentionRegex = /@(?:"([^"]+)"|(\w+))/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = mentionRegex.exec(text)) !== null) {
        // Add text before the mention
        if (match.index > lastIndex) {
            segments.push({
                type: 'text',
                content: text.slice(lastIndex, match.index),
            });
        }

        const mentionName = match[1] || match[2]; // Quoted or unquoted name
        const entity = entities.find(
            (e) => e.name.toLowerCase() === mentionName.toLowerCase()
        );

        if (entity) {
            segments.push({
                type: 'mention',
                mention: {
                    id: entity.id,
                    name: entity.name,
                    type: entity.type,
                    startIndex: match.index,
                    endIndex: match.index + match[0].length,
                },
            });
        } else {
            // Unknown mention - treat as plain text
            segments.push({
                type: 'text',
                content: match[0],
            });
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
        segments.push({
            type: 'text',
            content: text.slice(lastIndex),
        });
    }

    return segments;
}

/**
 * Memory surfacing animation for dropdown.
 */
const dropdownVariants = {
    hidden: {
        opacity: 0,
        y: 12,
        scale: 0.98,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1],
            staggerChildren: 0.04,
        },
    },
    exit: {
        opacity: 0,
        y: 8,
        transition: {
            duration: 0.15,
        },
    },
};

/**
 * Staggered item animation for dropdown items.
 */
const dropdownItemVariants = {
    hidden: {
        opacity: 0,
        y: 8,
    },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1],
        },
    },
};

export const MentionTextArea = forwardRef<HTMLDivElement, MentionTextAreaProps>(
    function MentionTextArea(
        {
            value,
            onChange,
            entities,
            onMentionClick: _onMentionClick,
            placeholder,
            disabled = false,
            minHeight = 80,
        },
        ref
    ) {
        // Note: _onMentionClick is reserved for future inline chip implementation
        const textareaRef = useRef<HTMLTextAreaElement>(null);
        const dropdownRef = useRef<HTMLDivElement>(null);

        // Autocomplete state
        const [isAutocompleteOpen, setIsAutocompleteOpen] = useState(false);
        const [autocompleteQuery, setAutocompleteQuery] = useState('');
        const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
        const [selectedIndex, setSelectedIndex] = useState(0);
        const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);

        // Filter entities based on query
        const filteredEntities = useMemo(() => {
            if (!autocompleteQuery) return entities;
            const query = autocompleteQuery.toLowerCase();
            return entities.filter((e) =>
                e.name.toLowerCase().includes(query)
            );
        }, [entities, autocompleteQuery]);

        // Handle text changes
        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLTextAreaElement>) => {
                const newValue = e.target.value;
                const cursorPos = e.target.selectionStart;

                // Check if we should open autocomplete
                const textBeforeCursor = newValue.slice(0, cursorPos);
                const atIndex = textBeforeCursor.lastIndexOf('@');

                if (atIndex !== -1) {
                    // Check if there's no space between @ and cursor (or we're in quotes)
                    const textAfterAt = textBeforeCursor.slice(atIndex + 1);
                    const isInQuotes = textAfterAt.startsWith('"') && !textAfterAt.endsWith('"');
                    const hasSpace = !isInQuotes && textAfterAt.includes(' ');

                    if (!hasSpace) {
                        // We're in a mention
                        setMentionStartIndex(atIndex);

                        // Extract query (remove @ and optional opening quote)
                        let query = textAfterAt;
                        if (query.startsWith('"')) {
                            query = query.slice(1);
                        }
                        setAutocompleteQuery(query);

                        // Calculate position
                        if (textareaRef.current) {
                            const coords = getCaretCoordinates(textareaRef.current, atIndex);
                            setAutocompletePosition({
                                top: coords.top + 24, // Below the @ character
                                left: coords.left,
                            });
                        }

                        setIsAutocompleteOpen(true);
                        setSelectedIndex(0);
                    } else {
                        setIsAutocompleteOpen(false);
                    }
                } else {
                    setIsAutocompleteOpen(false);
                }

                // Notify parent of change
                const newMentions = parseTextWithMentions(newValue, entities)
                    .filter((s): s is { type: 'mention'; mention: MentionData } => s.type === 'mention')
                    .map((s) => s.mention);
                onChange(newValue, newMentions);
            },
            [entities, onChange]
        );

        // Insert a mention
        const insertMention = useCallback(
            (entity: Entity) => {
                if (mentionStartIndex === null || !textareaRef.current) return;

                const cursorPos = textareaRef.current.selectionStart;
                const beforeMention = value.slice(0, mentionStartIndex);
                const afterMention = value.slice(cursorPos);

                // Use quotes if name has spaces
                const mentionText = entity.name.includes(' ')
                    ? `@"${entity.name}"`
                    : `@${entity.name}`;

                const newValue = `${beforeMention}${mentionText} ${afterMention}`;

                // Notify parent
                const newMentions = parseTextWithMentions(newValue, entities)
                    .filter((s): s is { type: 'mention'; mention: MentionData } => s.type === 'mention')
                    .map((s) => s.mention);
                onChange(newValue, newMentions);

                // Close autocomplete
                setIsAutocompleteOpen(false);
                setMentionStartIndex(null);

                // Move cursor after the mention
                requestAnimationFrame(() => {
                    if (textareaRef.current) {
                        const newPos = mentionStartIndex + mentionText.length + 1;
                        textareaRef.current.setSelectionRange(newPos, newPos);
                        textareaRef.current.focus();
                    }
                });
            },
            [mentionStartIndex, value, entities, onChange]
        );

        // Handle keyboard navigation
        const handleKeyDown = useCallback(
            (e: KeyboardEvent<HTMLTextAreaElement>) => {
                if (!isAutocompleteOpen) return;

                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        setSelectedIndex((i) =>
                            Math.min(i + 1, filteredEntities.length - 1)
                        );
                        break;

                    case 'ArrowUp':
                        e.preventDefault();
                        setSelectedIndex((i) => Math.max(i - 1, 0));
                        break;

                    case 'Enter':
                    case 'Tab':
                        if (filteredEntities.length > 0) {
                            e.preventDefault();
                            insertMention(filteredEntities[selectedIndex]);
                        }
                        break;

                    case 'Escape':
                        e.preventDefault();
                        setIsAutocompleteOpen(false);
                        break;
                }
            },
            [isAutocompleteOpen, filteredEntities, selectedIndex, insertMention]
        );

        // Handle clicking outside to close dropdown
        useEffect(() => {
            const handleClickOutside = (e: MouseEvent) => {
                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(e.target as Node) &&
                    textareaRef.current &&
                    !textareaRef.current.contains(e.target as Node)
                ) {
                    setIsAutocompleteOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        // Scroll selected item into view
        useEffect(() => {
            if (isAutocompleteOpen && dropdownRef.current) {
                const selected = dropdownRef.current.querySelector(
                    '.mention-dropdown__item--selected'
                );
                if (selected) {
                    selected.scrollIntoView({ block: 'nearest' });
                }
            }
        }, [selectedIndex, isAutocompleteOpen]);

        return (
            <div className="mention-textarea" ref={ref}>
                {/* Hidden sizer for auto-grow */}
                <div className="mention-textarea__sizer" aria-hidden="true">
                    {value || placeholder || ' '}{'\n'}
                </div>

                {/* Actual textarea */}
                <textarea
                    ref={textareaRef}
                    className="mention-textarea__input"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    style={{ minHeight }}
                    aria-label="Text with mention support"
                    aria-haspopup="listbox"
                    aria-expanded={isAutocompleteOpen}
                />

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                    {isAutocompleteOpen && filteredEntities.length > 0 && (
                        <motion.div
                            ref={dropdownRef}
                            className="mention-dropdown"
                            style={{
                                top: autocompletePosition.top,
                                left: Math.min(
                                    autocompletePosition.left,
                                    // Prevent overflow on right side
                                    (textareaRef.current?.offsetWidth || 300) - 220
                                ),
                            }}
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            role="listbox"
                            aria-label="Entity suggestions"
                        >
                            {filteredEntities.slice(0, 8).map((entity, index) => (
                                <motion.button
                                    key={entity.id}
                                    type="button"
                                    className={`mention-dropdown__item ${index === selectedIndex
                                            ? 'mention-dropdown__item--selected'
                                            : ''
                                        }`}
                                    data-type={entity.type}
                                    onClick={() => insertMention(entity)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    role="option"
                                    aria-selected={index === selectedIndex}
                                    variants={dropdownItemVariants}
                                >
                                    <EntityTypeIcon type={entity.type} size={14} />
                                    <span className="mention-dropdown__item-name">
                                        {entity.name}
                                    </span>
                                    <span className="mention-dropdown__item-type">
                                        {entity.type}
                                    </span>
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Mention chips overlay (optional: for visual display) */}
                {/* Note: For a simple implementation, mentions are displayed as syntax.
                      For a rich experience with chips, you'd need a more complex
                      contenteditable or Slate.js implementation */}
            </div>
        );
    }
);
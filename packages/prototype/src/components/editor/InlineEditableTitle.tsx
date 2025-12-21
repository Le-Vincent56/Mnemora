import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import './InlineEditableTitle.css';

interface InlineEditableTitleProps {
    value: string;                      // Current value
    onChange: (value: string) => void;  // Change handler
    placeholder?: string;               // Placeholder text
    required?: boolean;                 // Validation: require non-empty
    onCommit?: (value: string) => void; // Called on blur or Enter
}

export function InlineEditableTitle({
    value,
    onChange,
    placeholder = 'Untitled',
    required = true,
    onCommit,
}: InlineEditableTitleProps) {
    const [localValue, setLocalValue] = useState(value);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value);
        setError(null);
    }, [value]);

    const validate = (val: string): boolean => {
        if (required && !val.trim()) {
            setError('Name is required');
            return false;
        }
        setError(null);
        return true;
    };

    const handleChange = (newValue: string) => {
        setLocalValue(newValue);
        setError(null);
        onChange(newValue);
    };

    const handleBlur = () => {
        if (validate(localValue)) {
            onCommit?.(localValue);
        } else {
            // Revert to original if invalid
            setLocalValue(value);
            setError(null);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (validate(localValue)) {
                inputRef.current?.blur();
                onCommit?.(localValue);
            }
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            setLocalValue(value);
            setError(null);
            inputRef.current?.blur();
        }
    };

    const isEmpty = !localValue.trim();

    return (
        <div
            className={`inline-editable-title ${isEmpty ? 'inline-editable-title--empty' : ''} ${error ? 'inline-editable-title--error' : ''}`}
        >
            <input
                ref={inputRef}
                type="text"
                className="inline-editable-title__input"
                value={localValue}
                onChange={(e) => handleChange(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                aria-label="Entity name"
                aria-invalid={!!error}
            />
            {error && (
                <span className="inline-editable-title__error" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}
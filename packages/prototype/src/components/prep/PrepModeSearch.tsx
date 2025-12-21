import { useRef, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import './PrepModeSearch.css';

interface PrepModeSearchProps {
    query: string;
    onQueryChange: (query: string) => void;
    onFocusChange: (isFocused: boolean) => void;
    placeholder?: string;
}

export function PrepModeSearch({
    query,
    onQueryChange,
    onFocusChange,
    placeholder = 'Summon...',
}: PrepModeSearchProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // ⌘K / Ctrl+K keyboard shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === '/' && document.activeElement === document.body) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleFocus = useCallback(() => {
        onFocusChange(true);
    }, [onFocusChange]);

    const handleBlur = useCallback(() => {
        onFocusChange(false);
    }, [onFocusChange]);

    const handleClear = useCallback(() => {
        onQueryChange('');
        inputRef.current?.focus();
    }, [onQueryChange]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (query) {
                onQueryChange('');
            } else {
                inputRef.current?.blur();
            }
        }
    }, [query, onQueryChange]);

    return (
        <div className="prep-search">
            <Search size={16} className="prep-search__icon" />

            <input
                ref={inputRef}
                type="text"
                className="prep-search__input"
                placeholder={placeholder}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                aria-label="Search entities"
            />

            {query ? (
                <button
                    className="prep-search__clear"
                    onClick={handleClear}
                    aria-label="Clear search"
                >
                    <X size={14} />
                </button>
            ) : (
                <kbd className="prep-search__shortcut">⌘K</kbd>
            )}
        </div>
    );
}
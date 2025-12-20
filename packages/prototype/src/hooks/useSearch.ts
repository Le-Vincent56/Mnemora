import { useState, useEffect, useMemo } from 'react';
import { mockEntities } from '@/data/mockData';

interface UseSearchOptions {
    debounceMs?: number;
}

export function useSearch(options: UseSearchOptions = {}) {
    const { debounceMs = 150 } = options;

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    // Debounce the query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [query, debounceMs]);

    // Filter results based on debounced query
    const results = useMemo(() => {
        const q = debouncedQuery.trim().toLowerCase();
        if (!q) return [];

        return mockEntities.filter((entity) => {
            // Search in name
            if (entity.name.toLowerCase().includes(q)) return true;
            // Search in description
            if (entity.description.toLowerCase().includes(q)) return true;
            // Search in tags
            if (entity.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
            // Search in secrets
            if (entity.secrets?.toLowerCase().includes(q)) return true;
            return false;
        });
    }, [debouncedQuery]);

    const clearSearch = () => {
        setQuery('');
        setDebouncedQuery('');
    };

    return {
        query,
        setQuery,
        results,
        isSearching: query.trim().length > 0,
        clearSearch,
    };
}
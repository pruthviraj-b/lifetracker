import React, { useEffect, useState } from 'react';
import { AdvancedSearch } from './AdvancedSearch';

export const GlobalAdvancedSearch = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const openHandler = () => setIsOpen(true);
        const closeHandler = () => setIsOpen(false);

        // Custom event to open search from anywhere
        const onOpenEvent = () => openHandler();
        window.addEventListener('open-advanced-search', onOpenEvent as any);

        // Keyboard shortcut: Cmd/Ctrl + K
        const onKey = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('open-advanced-search', onOpenEvent as any);
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    return <AdvancedSearch isOpen={isOpen} onClose={() => setIsOpen(false)} />;
};

export default GlobalAdvancedSearch;

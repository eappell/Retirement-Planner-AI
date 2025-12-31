
import React, { useState, useEffect } from 'react';

export const ScrollToTopButton: React.FC = () => {
    const [isMounted, setIsMounted] = useState(false);
    const [isEmbedded, setIsEmbedded] = useState(false);

    // Scroll to top - handles both standalone and embedded modes
    const scrollToTop = () => {
        if (isEmbedded) {
            // Send message to parent portal to scroll to top
            window.parent.postMessage({ type: 'SCROLL_TO_TOP' }, '*');
        } else {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };

    useEffect(() => {
        setIsMounted(true);
        try {
            setIsEmbedded(window.self !== window.top);
        } catch (e) {
            setIsEmbedded(true);
        }
    }, []);

    // Don't render in embedded mode - portal will handle scroll-to-top
    if (!isMounted || isEmbedded) {
        return null;
    }

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-[9999] p-3 bg-brand-primary text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all duration-300"
            aria-label="Go to top"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        </button>
    );
};

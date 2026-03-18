"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import styles from './SearchTool.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function SearchTool() {
    const { t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const inputRef = useRef(null);

    const clearHighlights = useCallback(() => {
        try {
            const highlights = document.querySelectorAll('.search-highlight');
            highlights.forEach(h => {
                const parent = h.parentNode;
                if (parent && parent.contains(h)) {
                    parent.replaceChild(document.createTextNode(h.textContent), h);
                    parent.normalize();
                }
            });
        } catch (err) {
            console.error("Error clearing highlights:", err);
        }
        setResults([]);
        setCurrentIndex(-1);
    }, []);

    function scrollToResult(element) {
        if (!element || !document.contains(element)) return;

        try {
            // Remove active class from previous
            document.querySelectorAll('.search-highlight-active').forEach(el =>
                el.classList.remove('search-highlight-active')
            );

            element.classList.add('search-highlight-active');
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch (err) {
            console.error("Error scrolling to result:", err);
        }
    }

    const performSearch = useCallback((text) => {
        clearHighlights();
        if (!text || text.length < 2) return;

        try {
            const walker = document.createTreeWalker(
                document.body,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: (node) => {
                        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
                        if (node.parentElement.closest('nav') ||
                            node.parentElement.closest('.' + styles.searchWrapper) ||
                            node.parentElement.tagName === 'SCRIPT' ||
                            node.parentElement.tagName === 'STYLE' ||
                            node.parentElement.tagName === 'INPUT' ||
                            node.parentElement.tagName === 'TEXTAREA') {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return node.textContent.toLowerCase().includes(text.toLowerCase())
                            ? NodeFilter.FILTER_ACCEPT
                            : NodeFilter.FILTER_SKIP;
                    }
                }
            );

            const nodes = [];
            let currentNode;
            while (currentNode = walker.nextNode()) {
                nodes.push(currentNode);
            }

            const newResults = [];
            nodes.forEach(node => {
                const parent = node.parentNode;
                if (!parent || !document.contains(parent)) return;

                const content = node.textContent;
                const regex = new RegExp(`(${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                const parts = content.split(regex);

                const fragment = document.createDocumentFragment();
                parts.forEach(part => {
                    if (part.toLowerCase() === text.toLowerCase()) {
                        const span = document.createElement('span');
                        span.className = 'search-highlight';
                        span.textContent = part;
                        fragment.appendChild(span);
                        newResults.push(span);
                    } else {
                        fragment.appendChild(document.createTextNode(part));
                    }
                });

                try {
                    parent.replaceChild(fragment, node);
                } catch (e) {
                    console.warn("Could not replace text node, React might have unmounted it", e);
                }
            });

            setResults(newResults);
            if (newResults.length > 0) {
                setCurrentIndex(0);
                setTimeout(() => scrollToResult(newResults[0]), 50);
            }
        } catch (err) {
            console.error("Search failed:", err);
        }
    }, [clearHighlights]);

    const handleNext = () => {
        if (results.length === 0) return;
        const next = (currentIndex + 1) % results.length;
        setCurrentIndex(next);
        scrollToResult(results[next]);
    };

    const handlePrev = () => {
        if (results.length === 0) return;
        const prev = (currentIndex - 1 + results.length) % results.length;
        setCurrentIndex(prev);
        scrollToResult(results[prev]);
    };

    const toggleSearch = useCallback(() => {
        if (isOpen) {
            setIsOpen(false);
            setQuery('');
            clearHighlights();
        } else {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, clearHighlights]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                toggleSearch();
            }
            if (e.key === 'Escape' && isOpen) {
                toggleSearch();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, toggleSearch]);

    return (
        <div className={styles.searchContainer}>
            <div className={`${styles.searchWrapper} ${isOpen ? styles.open : ''}`}>
                <input
                    ref={inputRef}
                    type="text"
                    className={styles.searchInput}
                    placeholder={t('searchPlaceholder')}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        performSearch(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNext();
                    }}
                />

                {results.length > 0 && (
                    <div className={styles.resultCount}>
                        {currentIndex + 1}/{results.length}
                    </div>
                )}

                <div className={styles.controls}>
                    <button className={styles.controlBtn} onClick={handlePrev} disabled={results.length === 0}>
                        <ChevronUp size={16} />
                    </button>
                    <button className={styles.controlBtn} onClick={handleNext} disabled={results.length === 0}>
                        <ChevronDown size={16} />
                    </button>
                    <button className={styles.controlBtn} onClick={toggleSearch}>
                        <X size={16} />
                    </button>
                </div>
            </div>

            {!isOpen && (
                <button className={styles.searchIcon} onClick={toggleSearch} title={`${t('searchPlaceholder')} (Ctrl+F)`}>
                    <Search size={20} />
                </button>
            )}
        </div>
    );
}

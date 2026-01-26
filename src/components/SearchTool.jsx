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
        const highlights = document.querySelectorAll('.search-highlight');
        highlights.forEach(h => {
            const parent = h.parentNode;
            if (parent) {
                parent.replaceChild(document.createTextNode(h.textContent), h);
                parent.normalize();
            }
        });
        setResults([]);
        setCurrentIndex(-1);
    }, []);

    const performSearch = useCallback((text) => {
        clearHighlights();
        if (!text || text.length < 2) return;

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    if (node.parentElement.closest('nav') ||
                        node.parentElement.closest('.' + styles.searchWrapper) ||
                        node.parentElement.tagName === 'SCRIPT' ||
                        node.parentElement.tagName === 'STYLE') {
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
            const content = node.textContent;
            const regex = new RegExp(`(${text})`, 'gi');
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

            node.parentNode.replaceChild(fragment, node);
        });

        setResults(newResults);
        if (newResults.length > 0) {
            setCurrentIndex(0);
            scrollToResult(newResults[0]);
        }
    }, [clearHighlights]);

    const scrollToResult = (element) => {
        if (!element) return;

        // Remove active class from previous
        document.querySelectorAll('.search-highlight-active').forEach(el =>
            el.classList.remove('search-highlight-active')
        );

        element.classList.add('search-highlight-active');
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

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

    const toggleSearch = () => {
        if (isOpen) {
            setIsOpen(false);
            setQuery('');
            clearHighlights();
        } else {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

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
    }, [isOpen]);

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

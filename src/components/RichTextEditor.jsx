"use client";

import React, { useRef, useEffect, useCallback } from 'react';
import {
    Bold, Italic, Underline, Strikethrough,
    List, ListOrdered, Heading2, Heading3,
    AlignLeft, AlignCenter, AlignRight,
    RotateCcw, RotateCw, Minus
} from 'lucide-react';

/**
 * RichTextEditor — mini éditeur WYSIWYG sans lib externe
 * Props:
 *   value       {string}   - HTML string (valeur contrôlée)
 *   onChange    {fn}       - appelé avec le nouveau HTML à chaque changement
 *   placeholder {string}   - texte placeholder
 *   minHeight   {string}   - hauteur min de la zone d'édition (défaut "120px")
 *   label       {string}   - label optionnel au-dessus
 */
const RichTextEditor = ({ value, onChange, placeholder = '', minHeight = '120px', label }) => {
    const editorRef = useRef(null);
    const isComposing = useRef(false);
    const lastValueRef = useRef(value);

    // Sync valeur externe → DOM (seulement si vraiment différent pour ne pas sauter le curseur)
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (value !== lastValueRef.current && el.innerHTML !== value) {
            el.innerHTML = value || '';
            lastValueRef.current = value;
        }
    }, [value]);

    const exec = useCallback((command, arg = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, arg);
        triggerChange();
    }, []);

    const triggerChange = useCallback(() => {
        const el = editorRef.current;
        if (!el) return;
        const html = el.innerHTML;
        lastValueRef.current = html;
        onChange?.(html);
    }, [onChange]);

    const handleInput = () => {
        if (!isComposing.current) triggerChange();
    };

    const isActive = (command) => {
        try { return document.queryCommandState(command); } catch { return false; }
    };

    const btnStyle = (active) => ({
        background: active ? 'rgba(100,149,237,0.3)' : 'rgba(255,255,255,0.06)',
        border: active ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
        color: active ? 'var(--primary)' : 'rgba(255,255,255,0.8)',
        borderRadius: '6px',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        flexShrink: 0,
    });

    const sepStyle = {
        width: '1px',
        height: '22px',
        background: 'rgba(255,255,255,0.12)',
        margin: '0 4px',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {label && (
                <label style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '5px', display: 'block' }}>
                    {label}
                </label>
            )}

            {/* Barre d'outils */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderBottom: 'none',
                borderRadius: '10px 10px 0 0',
            }}>
                {/* Gras / Italique / Souligné / Barré */}
                <button type="button" title="Gras (Ctrl+B)"
                    onMouseDown={(e) => { e.preventDefault(); exec('bold'); }}
                    style={btnStyle(isActive('bold'))}>
                    <Bold size={14} />
                </button>
                <button type="button" title="Italique (Ctrl+I)"
                    onMouseDown={(e) => { e.preventDefault(); exec('italic'); }}
                    style={btnStyle(isActive('italic'))}>
                    <Italic size={14} />
                </button>
                <button type="button" title="Souligné (Ctrl+U)"
                    onMouseDown={(e) => { e.preventDefault(); exec('underline'); }}
                    style={btnStyle(isActive('underline'))}>
                    <Underline size={14} />
                </button>
                <button type="button" title="Barré"
                    onMouseDown={(e) => { e.preventDefault(); exec('strikeThrough'); }}
                    style={btnStyle(isActive('strikeThrough'))}>
                    <Strikethrough size={14} />
                </button>

                <div style={sepStyle} />

                {/* Titres */}
                <button type="button" title="Titre H2"
                    onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h2>'); }}
                    style={btnStyle(false)}>
                    <Heading2 size={14} />
                </button>
                <button type="button" title="Sous-titre H3"
                    onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<h3>'); }}
                    style={btnStyle(false)}>
                    <Heading3 size={14} />
                </button>
                <button type="button" title="Paragraphe normal"
                    onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', '<p>'); }}
                    style={{ ...btnStyle(false), fontSize: '11px', fontWeight: 700, width: 'auto', padding: '0 6px' }}>
                    ¶
                </button>

                <div style={sepStyle} />

                {/* Listes */}
                <button type="button" title="Liste à puces (•)"
                    onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }}
                    style={btnStyle(isActive('insertUnorderedList'))}>
                    <List size={14} />
                </button>
                <button type="button" title="Liste numérotée (1. 2. 3.)"
                    onMouseDown={(e) => { e.preventDefault(); exec('insertOrderedList'); }}
                    style={btnStyle(isActive('insertOrderedList'))}>
                    <ListOrdered size={14} />
                </button>

                <div style={sepStyle} />

                {/* Alignements */}
                <button type="button" title="Aligner à gauche"
                    onMouseDown={(e) => { e.preventDefault(); exec('justifyLeft'); }}
                    style={btnStyle(isActive('justifyLeft'))}>
                    <AlignLeft size={14} />
                </button>
                <button type="button" title="Centrer"
                    onMouseDown={(e) => { e.preventDefault(); exec('justifyCenter'); }}
                    style={btnStyle(isActive('justifyCenter'))}>
                    <AlignCenter size={14} />
                </button>
                <button type="button" title="Aligner à droite"
                    onMouseDown={(e) => { e.preventDefault(); exec('justifyRight'); }}
                    style={btnStyle(isActive('justifyRight'))}>
                    <AlignRight size={14} />
                </button>

                <div style={sepStyle} />

                {/* Ligne de séparation & Annuler/Rétablir */}
                <button type="button" title="Insérer une ligne de séparation"
                    onMouseDown={(e) => { e.preventDefault(); exec('insertHorizontalRule'); }}
                    style={btnStyle(false)}>
                    <Minus size={14} />
                </button>
                <button type="button" title="Annuler (Ctrl+Z)"
                    onMouseDown={(e) => { e.preventDefault(); exec('undo'); }}
                    style={btnStyle(false)}>
                    <RotateCcw size={14} />
                </button>
                <button type="button" title="Rétablir (Ctrl+Y)"
                    onMouseDown={(e) => { e.preventDefault(); exec('redo'); }}
                    style={btnStyle(false)}>
                    <RotateCw size={14} />
                </button>
            </div>

            {/* Zone d'édition */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={() => { isComposing.current = false; triggerChange(); }}
                onKeyDown={(e) => {
                    // Shift+Enter → saut de ligne simple au lieu d'un nouveau bloc
                    if (e.key === 'Enter' && e.shiftKey) {
                        e.preventDefault();
                        exec('insertLineBreak');
                    }
                }}
                data-placeholder={placeholder}
                style={{
                    minHeight,
                    padding: '12px 14px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '0 0 10px 10px',
                    color: 'white',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    outline: 'none',
                    cursor: 'text',
                    wordBreak: 'break-word',
                    overflowY: 'auto',
                    maxHeight: '400px',
                }}
            />

            {/* Styles injectés pour placeholder + mise en forme rich text */}
            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: rgba(255,255,255,0.3);
                    pointer-events: none;
                    display: block;
                }
                [contenteditable]:focus {
                    border-color: var(--primary, #6495ED) !important;
                    box-shadow: 0 0 0 2px rgba(100,149,237,0.15);
                }
                [contenteditable] h2 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0.5em 0 0.3em;
                    color: var(--primary, #6495ED);
                }
                [contenteditable] h3 {
                    font-size: 1.05rem;
                    font-weight: 600;
                    margin: 0.4em 0 0.2em;
                    opacity: 0.9;
                }
                [contenteditable] ul {
                    list-style: disc;
                    padding-left: 1.5em;
                    margin: 0.3em 0;
                }
                [contenteditable] ol {
                    list-style: decimal;
                    padding-left: 1.5em;
                    margin: 0.3em 0;
                }
                [contenteditable] li { margin: 0.15em 0; }
                [contenteditable] hr {
                    border: none;
                    border-top: 1px solid rgba(255,255,255,0.15);
                    margin: 0.8em 0;
                }
                [contenteditable] p { margin: 0.2em 0; }
                [contenteditable] strong { font-weight: 700; }
                [contenteditable] em { font-style: italic; }
                [contenteditable] u { text-decoration: underline; }
                [contenteditable] s { text-decoration: line-through; }
            `}</style>
        </div>
    );
};

export default RichTextEditor;

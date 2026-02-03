"use client";

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import styles from './Lightbox.module.css';

const Lightbox = ({ images, currentIndex, onClose, onPrev, onNext }) => {
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
            if (e.key === 'ArrowRight' && onNext) onNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'auto';
        };
    }, [onClose, onPrev, onNext]);

    if (!images || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.toolbar}>
                <div className={styles.imageInfo}>
                    {currentIndex + 1} / {images.length}
                </div>
                <div className={styles.controls}>
                    <button className={styles.iconBtn} onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}>
                        {isZoomed ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            {onPrev && images.length > 1 && (
                <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={(e) => { e.stopPropagation(); onPrev(); }}>
                    <ChevronLeft size={32} />
                </button>
            )}

            <div className={styles.imageContainer} onClick={(e) => e.stopPropagation()}>
                <img
                    src={currentImage}
                    alt=""
                    className={`${styles.image} ${isZoomed ? styles.zoomed : ''}`}
                    onClick={() => setIsZoomed(!isZoomed)}
                />
            </div>

            {onNext && images.length > 1 && (
                <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={(e) => { e.stopPropagation(); onNext(); }}>
                    <ChevronRight size={32} />
                </button>
            )}
        </div>
    );
};

export default Lightbox;

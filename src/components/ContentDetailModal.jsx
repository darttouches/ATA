"use client";

import { X, Calendar, Clock, Image as ImageIcon, Play, ExternalLink } from 'lucide-react';
import styles from './ContentDetailModal.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function ContentDetailModal({ item, onClose }) {
    const { t, formatDynamicText } = useLanguage();
    if (!item) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}><X size={24} /></button>

                <div className={styles.modalHeader}>
                    <span className={styles.typeTag}>{item.type}</span>
                    <h2>{item.title}</h2>
                    {item.club?.name && <div className={styles.clubName}>{t('clubLabel')} : {formatDynamicText(item.club.name)}</div>}
                    <div className={styles.modalMeta}>
                        {item.date && <span><Calendar size={16} /> {item.date}</span>}
                        {item.time && <span><Clock size={16} /> {item.time}</span>}
                    </div>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.fullDescription}>{item.description || t('noDescAvailable')}</p>

                    {/* Media Section */}
                    {(() => {
                        // 1. ULTRA-Robust Normalization
                        let allImages = [];

                        // Always include the cover image if it exists
                        if (item.mediaUrl && typeof item.mediaUrl === 'string') {
                            allImages.push(item.mediaUrl.trim());
                        }

                        // Robust extraction from photos field
                        const rawPhotos = item.photos;
                        if (rawPhotos) {
                            let photosToProcess = [];

                            if (Array.isArray(rawPhotos)) {
                                photosToProcess = rawPhotos;
                            } else if (typeof rawPhotos === 'string' && rawPhotos.trim().length > 0) {
                                const trimmed = rawPhotos.trim();
                                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                    try {
                                        photosToProcess = JSON.parse(trimmed);
                                    } catch (e) {
                                        photosToProcess = trimmed.split(',').map(p => p.trim());
                                    }
                                } else {
                                    photosToProcess = trimmed.split(',').map(p => p.trim());
                                }
                            }

                            // Clean and push each photo (Handle strings inside arrays that might contain commas)
                            photosToProcess.forEach(p => {
                                if (p && typeof p === 'string') {
                                    // Remove quotes and brackets, then split by comma in case it's a combined string
                                    const cleanedRaw = p.replace(/[\[\]\"\']/g, '').trim();
                                    cleanedRaw.split(',').forEach(subUrl => {
                                        const finalUrl = subUrl.trim();
                                        if (finalUrl && finalUrl.length > 5) {
                                            allImages.push(finalUrl);
                                        }
                                    });
                                }
                            });
                        }

                        // Unique cleaned-up list
                        const uniqueImages = Array.from(new Set(allImages)).filter(url => url.startsWith('http') || url.startsWith('/'));

                        // Separate Cover (Hero) from the rest for the gallery
                        const coverImage = uniqueImages[0] || null;
                        const galleryPhotos = uniqueImages;

                        return (uniqueImages.length > 0 || item.videoUrl) && (
                            <div className={styles.mediaContainer}>

                                {/* 1. Hero Cover Image */}
                                {coverImage && (
                                    <div className={styles.heroWrapper}>
                                        <img
                                            src={coverImage}
                                            alt="Couverture"
                                            className={styles.heroImage}
                                            onClick={() => window.open(coverImage, '_blank')}
                                        />
                                        <div className={styles.heroBadge}>{t('featuredPhoto')}</div>
                                    </div>
                                )}

                                {/* 2. Video Section */}
                                {item.videoUrl && (
                                    <div className={styles.videoWrapper}>
                                        <h4 className={styles.sectionTitle}><Play size={18} /> {t('eventVideo')}</h4>
                                        {item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be') ? (
                                            <iframe
                                                width="100%"
                                                height="450"
                                                src={item.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                                frameBorder="0"
                                                allowFullScreen
                                                style={{ borderRadius: '16px' }}
                                            ></iframe>
                                        ) : (
                                            <video src={item.videoUrl} controls style={{ width: '100%', borderRadius: '16px' }}></video>
                                        )}
                                    </div>
                                )}

                                {/* 3. Full Gallery */}
                                {galleryPhotos.length > 0 && (
                                    <div className={styles.galleryWrapper}>
                                        <h4 className={styles.sectionTitle}>
                                            <ImageIcon size={18} /> {t('photoAlbum')} ({galleryPhotos.length})
                                        </h4>
                                        <div className={styles.photoGrid}>
                                            {galleryPhotos.map((url, idx) => (
                                                <div key={idx} className={styles.photoItem}>
                                                    <img
                                                        src={url}
                                                        alt={`${item.title} - ${idx + 1}`}
                                                        className={styles.modalPhoto}
                                                        onClick={() => window.open(url, '_blank')}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    {item.link && (
                        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                            <a href={item.link} target="_blank" className="btn btn-primary" style={{ padding: '14px 40px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                                {t('participate')} <ExternalLink size={20} />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

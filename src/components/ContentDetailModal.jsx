import { useState } from 'react';
import { X, Calendar, Clock, Image as ImageIcon, Play, ExternalLink } from 'lucide-react';
import styles from './ContentDetailModal.module.css';
import { useLanguage } from '@/context/LanguageContext';
import Lightbox from './Lightbox';

export default function ContentDetailModal({ item, onClose }) {
    const { t, formatDynamicText } = useLanguage();
    const [lightboxIndex, setLightboxIndex] = useState(-1);

    if (!item) return null;

    // 1. Image Extraction Logic moved out of JSX for clarity
    let allImages = [];
    if (item.mediaUrl && typeof item.mediaUrl === 'string') {
        allImages.push(item.mediaUrl.trim());
    }

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

        photosToProcess.forEach(p => {
            if (p && typeof p === 'string') {
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
    const uniqueImages = Array.from(new Set(allImages)).filter(url => url.startsWith('http') || url.startsWith('/'));
    const coverImage = uniqueImages[0] || null;

    const openLightbox = (index) => {
        setLightboxIndex(index);
    };

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

                    {(uniqueImages.length > 0 || item.videoUrl) && (
                        <div className={styles.mediaContainer}>
                            {coverImage && (
                                <div className={styles.heroWrapper}>
                                    <img
                                        src={coverImage}
                                        alt="Couverture"
                                        className={styles.heroImage}
                                        onClick={() => openLightbox(0)}
                                    />
                                    <div className={styles.heroBadge}>{t('featuredPhoto')}</div>
                                </div>
                            )}

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

                            {uniqueImages.length > 1 && (
                                <div className={styles.galleryWrapper}>
                                    <h4 className={styles.sectionTitle}>
                                        <ImageIcon size={18} /> {t('photoAlbum')} ({uniqueImages.length})
                                    </h4>
                                    <div className={styles.photoGrid}>
                                        {uniqueImages.map((url, idx) => (
                                            <div key={idx} className={styles.photoItem}>
                                                <img
                                                    src={url}
                                                    alt={`${item.title} - ${idx + 1}`}
                                                    className={styles.modalPhoto}
                                                    onClick={() => openLightbox(idx)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {item.link && (
                        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                            <a href={item.link} target="_blank" className="btn btn-primary" style={{ padding: '14px 40px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
                                {t('participate')} <ExternalLink size={20} />
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {lightboxIndex >= 0 && (
                <Lightbox
                    images={uniqueImages}
                    currentIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(-1)}
                    onPrev={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : uniqueImages.length - 1))}
                    onNext={() => setLightboxIndex((prev) => (prev < uniqueImages.length - 1 ? prev + 1 : 0))}
                />
            )}
        </div>
    );
}

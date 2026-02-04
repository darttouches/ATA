import { useState } from 'react';
import { X, Calendar, Clock, Image as ImageIcon, Play, ExternalLink, User } from 'lucide-react';
import styles from './ContentDetailModal.module.css';
import { useLanguage } from '@/context/LanguageContext';
import Lightbox from './Lightbox';

export default function ContentDetailModal({ item, onClose }) {
    const { t, formatDynamicText } = useLanguage();
    const [lightboxIndex, setLightboxIndex] = useState(-1);
    const [expandedGroups, setExpandedGroups] = useState({});

    const toggleGroup = (time) => {
        setExpandedGroups(prev => ({
            ...prev,
            [time]: !prev[time]
        }));
    };

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

                    {item.program?.items?.length > 0 && (
                        <div className={styles.programSection}>
                            <h4 className={styles.sectionTitle}><Clock size={18} /> {t('manifestationPlan')}</h4>

                            {(item.program.globalDuration || item.program.partsCount) && (
                                <div className={styles.programMeta}>
                                    {item.program.globalDuration && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{t('globalDuration')}</span>
                                            <span style={{ fontWeight: 700 }}>{item.program.globalDuration}</span>
                                        </div>
                                    )}
                                    {item.program.partsCount && (
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>{t('partsCount')}</span>
                                            <span style={{ fontWeight: 700 }}>{item.program.partsCount}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className={styles.timeline}>
                                {Object.entries(
                                    item.program.items.reduce((acc, pitem) => {
                                        const time = pitem.startTime || '---';
                                        if (!acc[time]) acc[time] = [];
                                        acc[time].push(pitem);
                                        return acc;
                                    }, {})
                                ).sort((a, b) => a[0].localeCompare(b[0])).map(([time, items], groupIdx) => (
                                    <div
                                        key={groupIdx}
                                        className={`${styles.timelineGroup} ${expandedGroups[time] ? styles.activeGroup : ''}`}
                                        onClick={() => toggleGroup(time)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className={styles.timelineTime}>{time}</div>
                                        <div className={styles.timelineGroupItems}>
                                            {items.map((pitem, idx) => (
                                                <div key={idx} className={styles.timelineItem}>
                                                    <div className={styles.timelineDot}>
                                                        {pitem.type === 'coffee_break' && <Clock size={10} />}
                                                        {pitem.type === 'pause' && <Play size={10} />}
                                                    </div>
                                                    <div className={styles.timelineContent}>
                                                        <div className={styles.itemTitleGroup}>
                                                            <div className={styles.itemTitle}>
                                                                {pitem.type === 'coffee_break' && '☕ '}
                                                                {pitem.type === 'pause' && '⏸️ '}
                                                                {pitem.type === 'breakfast' && '🥐 '}
                                                                {pitem.type === 'lunch' && '🍲 '}
                                                                {pitem.type === 'dinner' && '🍽️ '}
                                                                {pitem.type === 'soiree' && '🌙 '}
                                                                {pitem.type === 'sleep' && '🛌 '}
                                                                {pitem.type === 'conference' && '🎤 '}
                                                                {pitem.type === 'formation' && '🎓 '}
                                                                {pitem.type === 'dj_party' && '🎧 '}
                                                                {pitem.type === 'spectacle' && '🎭 '}
                                                                {pitem.title || t(pitem.type)}
                                                            </div>
                                                            <div className={styles.timeRangeMini}>
                                                                {pitem.startTime} {pitem.endTime ? ` - ${pitem.endTime}` : ''}
                                                            </div>
                                                        </div>

                                                        {expandedGroups[time] && (
                                                            <div className={styles.expandedContent} style={{ marginTop: '15px' }}>
                                                                {(pitem.speakerName || pitem.speakerPhoto) && (
                                                                    <div className={styles.speakerInfo}>
                                                                        <div className={styles.speakerAvatar}>
                                                                            {pitem.speakerPhoto ? (
                                                                                <img src={pitem.speakerPhoto} alt={pitem.speakerName} />
                                                                            ) : (
                                                                                <User size={18} style={{ opacity: 0.5 }} />
                                                                            )}
                                                                        </div>
                                                                        {pitem.speakerName && <span className={styles.speakerName}>{pitem.speakerName}</span>}
                                                                    </div>
                                                                )}
                                                                {pitem.description && <p className={styles.itemDesc}>{pitem.description}</p>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {item.link && (
                        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '14px 40px', display: 'inline-flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}>
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

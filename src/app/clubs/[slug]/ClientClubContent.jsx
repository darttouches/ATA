"use client";

import { useState } from 'react';
import { Calendar, Clock, X, ChevronRight, Play, Image as ImageIcon } from 'lucide-react';
import ContentDetailModal from '@/components/ContentDetailModal';
import styles from './ClubDetail.module.css';
import { useLanguage } from '@/context/LanguageContext';

export default function ClientClubContent({ events, gallery, videos }) {
    const { t, language } = useLanguage();
    const [selectedItem, setSelectedItem] = useState(null);

    const openDetails = (item) => {
        setSelectedItem(item);
        document.body.style.overflow = 'hidden';
    };

    const closeDetails = () => {
        setSelectedItem(null);
        document.body.style.overflow = 'auto';
    };

    return (
        <>
            {/* Events & Formations Section */}
            {events.length > 0 && (
                <section className={styles.section}>
                    <h2 className={`${styles.sectionHeader} ${styles.sectionHeaderSecondary}`}>{t('eventsFormations')}</h2>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {events.map(event => (
                            <div
                                key={event._id}
                                className="card"
                                style={{ display: 'flex', gap: '20px', alignItems: 'center', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onClick={() => openDetails(event)}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div style={{ textAlign: 'center', minWidth: '80px', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                    <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.2rem' }}>
                                        {event.date ? event.date.split('-')[2] : '--'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                                        {event.date ? new Date(event.date).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR', { month: 'short' }) : 'Date'}
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: '5px' }}>{event.title}</h3>
                                    <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>{event.description?.substring(0, 100)}...</p>
                                    <div style={{ display: 'flex', gap: '15px', marginTop: '10px', fontSize: '0.8rem', opacity: 0.5 }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> {event.date}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={14} /> {event.time}</span>
                                    </div>
                                </div>
                                <ChevronRight size={20} opacity={0.3} />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Gallery Section */}
            {gallery.length > 0 && (
                <section className={styles.section}>
                    <h2 className={`${styles.sectionHeader} ${styles.sectionHeaderAccent}`}>{t('photoGallery')}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {gallery.map((item) => (
                            <div key={item._id} style={{ position: 'relative', cursor: 'pointer' }} onClick={() => openDetails(item)}>
                                <img
                                    src={item.photos?.[0] || item.mediaUrl}
                                    alt={item.title}
                                    style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--card-border)' }}
                                />
                                {item.photos?.length > 1 && (
                                    <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(17, 34, 78, 0.6)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                                        <ImageIcon size={10} style={{ marginRight: '4px' }} /> +{item.photos.length - 1}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Videos Section */}
            {videos.length > 0 && (
                <section className={styles.section}>
                    <h2 className={`${styles.sectionHeader} ${styles.sectionHeaderDanger}`}>{t('videosCreations')}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {videos.map(video => (
                            <div
                                key={video._id}
                                className="card"
                                style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}
                                onClick={() => openDetails(video)}
                            >
                                <div style={{ position: 'relative', height: '200px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Play size={40} opacity={0.5} />
                                    {/* Thumbnail logic if possible, otherwise just a placeholder or the video itself restricted */}
                                </div>
                                <div style={{ padding: '10px' }}>
                                    <h4 style={{ fontSize: '0.9rem' }}>{video.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Modal Detail Overlay */}
            {selectedItem && (
                <ContentDetailModal
                    item={selectedItem}
                    onClose={closeDetails}
                />
            )}
        </>
    );
}

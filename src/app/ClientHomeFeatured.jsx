"use client";

import { useState, useEffect } from 'react';
import ContentDetailModal from '@/components/ContentDetailModal';
import { useLanguage } from '@/context/LanguageContext';

const stripHtml = (html) => html?.replace(/<[^>]*>?/gm, '') || '';

export default function ClientHomeFeatured({ featured, gridStyle }) {
    const { t, formatDynamicText } = useLanguage();
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const eventId = urlParams.get('event');
        if (eventId) {
            const item = featured.find(e => e._id === eventId);
            if (item) setSelectedItem(item);
        }
    }, [featured]);

    useEffect(() => {
        const url = new URL(window.location);
        if (selectedItem) {
            url.searchParams.set('event', selectedItem._id);
        } else {
            url.searchParams.delete('event');
        }
        window.history.replaceState({}, '', url);
    }, [selectedItem]);

    return (
        <>
            <div className={gridStyle}>
                {featured.map((item) => (
                    <div
                        key={item._id}
                        className="card"
                        onClick={() => setSelectedItem(item)}
                        style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'transform 0.3s' }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <div style={{
                            height: '180px',
                            background: item.mediaUrl ? `url(${item.mediaUrl})` : 'linear-gradient(45deg, var(--primary), var(--secondary))',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            borderRadius: '12px',
                            marginBottom: '1rem',
                            border: '1px solid var(--card-border)'
                        }} />
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '0.25rem' }}>
                            {formatDynamicText(item.club?.name)} • {item.type}
                        </div>
                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>{item.title}</h3>
                        <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1rem', flex: 1 }}>
                            {stripHtml(item.description).substring(0, 100)}...
                        </p>
                        <button className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', pointerEvents: 'none' }}>
                            {t('learnMore')}
                        </button>
                    </div>
                ))}
            </div>

            {selectedItem && (
                <ContentDetailModal
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                />
            )}
        </>
    );
}

'use client';

import { Image as ImageIcon, Video, Calendar, Lightbulb } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import ClientBestOff from './ClientBestOff';

export default function BestOffPage() {
    const { t } = useLanguage();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/best-off')
            .then(res => res.json())
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;

    return (
        <div className="container" style={{ padding: '4rem 1rem' }}>
            <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
                <h1 style={{
                    fontSize: '3.5rem',
                    background: 'linear-gradient(to right, #f59e0b, #d97706, #7c3aed)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1rem',
                    fontWeight: 900
                }}>
                    {t('bestOff')}
                </h1>
                <p style={{ fontSize: '1.2rem', opacity: 0.8, maxWidth: '700px', margin: '0 auto' }}>
                    {t('bestOffSubtitle')}
                </p>
            </header>

            {items.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.5, padding: '4rem' }}>
                    {t('bestOffEmpty')}
                </div>
            ) : (
                <ClientBestOff items={items} />
            )}
        </div>
    );
}

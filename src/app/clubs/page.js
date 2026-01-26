'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ClubsPage() {
    const { t, formatDynamicText } = useLanguage();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/home/data')
            .then(res => res.json())
            .then(data => {
                setClubs(data.clubs || []);
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
            <h1 style={{ textAlign: 'center', marginBottom: '1rem', fontSize: '3rem' }}>{t('ourClubsTitle')}</h1>
            <p style={{ textAlign: 'center', marginBottom: '4rem', opacity: 0.8, maxWidth: '600px', margin: '0 auto 4rem' }}>
                {t('ourClubsSubtitle')}
            </p>

            {clubs.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.5 }}>{t('noClubs')}</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {clubs.map((club) => (
                        <Link href={`/clubs/${club.slug}`} key={club._id.toString()} className="card" style={{
                            textDecoration: 'none',
                            transition: 'transform 0.2s',
                            display: 'block'
                        }}>
                            <div style={{
                                height: '200px',
                                background: club.coverImage ? `url(${club.coverImage})` : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: '12px',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '4rem',
                                fontWeight: 800,
                                color: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--card-border)',
                                overflow: 'hidden'
                            }}>
                                {!club.coverImage && formatDynamicText(club.name)[0]}
                            </div>
                            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{formatDynamicText(club.name)}</h2>
                            <div style={{
                                fontSize: '0.8rem',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '20px',
                                background: 'rgba(124, 58, 237, 0.2)',
                                color: 'var(--primary)',
                                display: 'inline-block',
                                marginBottom: '1rem'
                            }}>
                                {t('clubATA')}
                            </div>
                            <p style={{ opacity: 0.7, lineHeight: 1.5 }}>{club.description?.substring(0, 100)}...</p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import styles from './about.module.css';
import { Target, Heart, Zap, CheckCircle2, Palette, Smile, Users, User, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import dynamic from 'next/dynamic';
import Lightbox from '@/components/Lightbox';

const ClubMap = dynamic(() => import('@/components/ClubMap'), { ssr: false });

export default function AboutPage() {
    const { t } = useLanguage();
    const [boardMembers, setBoardMembers] = useState([]);
    const [sections, setSections] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [mapCenter, setMapCenter] = useState([36.8065, 10.1815]);
    const [mapZoom, setMapZoom] = useState(10);
    const [loading, setLoading] = useState(true);
    const [associationLogo, setAssociationLogo] = useState(null);

    const [lightboxImage, setLightboxImage] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [boardRes, sectionsRes, settingsRes] = await Promise.all([
                    fetch('/api/board'),
                    fetch('/api/about'),
                    fetch('/api/admin/settings')
                ]);

                const boardData = await boardRes.json();
                const sectionsData = await sectionsRes.json();
                const settingsData = await settingsRes.json();

                // Fetch clubs for map (public endpoint)
                const clubsRes = await fetch('/api/clubs');
                const clubsData = await clubsRes.json();

                setBoardMembers(boardData);
                setSections(sectionsData);
                setClubs(Array.isArray(clubsData) ? clubsData : []);
                setAssociationLogo(settingsData.logo);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;

    return (
        <div className="container">
            <div className={styles.aboutSection}>
                {/* Hero Section */}
                <div className={styles.hero}>
                    <div className={styles.logoContainer}>
                        <img
                            src={associationLogo || "/logo/1768028469348-logo touches d'art v3 .png"}
                            alt="Touches d'Art Logo"
                            className={styles.logo}
                        />
                    </div>
                    <div>
                        <h1 className={styles.title}>{t('aboutTitle')}</h1>
                        <div className={styles.textBlock}>
                            <p>{t('aboutDesc')}</p>
                        </div>
                    </div>
                </div>

                {/* Objectives Section */}
                <div className={styles.objectivesSection}>
                    <h2 className={styles.sectionTitle}>{t('objectivesTitle')}</h2>
                    <div className={styles.objectivesList}>
                        <div className={styles.objectiveItem}>
                            <CheckCircle2 className={styles.checkIcon} size={28} />
                            <p>{t('obj1')}</p>
                        </div>
                        <div className={styles.objectiveItem}>
                            <CheckCircle2 className={styles.checkIcon} size={28} />
                            <p>{t('obj2')}</p>
                        </div>
                        <div className={styles.objectiveItem}>
                            <CheckCircle2 className={styles.checkIcon} size={28} />
                            <p>{t('obj3')}</p>
                        </div>
                        {/* Dynamic Objectives */}
                        {sections.filter(s => s.type === 'objective').map(s => (
                            <div key={s._id} className={styles.objectiveItem}>
                                <CheckCircle2 className={styles.checkIcon} size={28} />
                                <p>{s.content}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Domains Section */}
                <h2 className={styles.sectionTitle}>{t('domainsTitle')}</h2>
                <div className={styles.domainsGrid}>
                    <div className={styles.domainCard}>
                        <Palette size={40} color="var(--primary)" />
                        <h3 className={styles.domainTitle}>{t('domain1Title')}</h3>
                        <p style={{ opacity: 0.8 }}>{t('domain1Desc')}</p>
                    </div>
                    <div className={styles.domainCard}>
                        <Users size={40} color="var(--secondary)" />
                        <h3 className={styles.domainTitle}>{t('domain2Title')}</h3>
                        <p style={{ opacity: 0.8 }}>{t('domain2Desc')}</p>
                    </div>
                    <div className={styles.domainCard}>
                        <Smile size={40} color="var(--accent)" />
                        <h3 className={styles.domainTitle}>{t('domain3Title')}</h3>
                        <p style={{ opacity: 0.8 }}>{t('domain3Desc')}</p>
                    </div>
                    {/* Dynamic Domains */}
                    {sections.filter(s => s.type === 'domain').map(s => (
                        <div key={s._id} className={styles.domainCard}>
                            <Palette size={40} color="var(--primary)" />
                            <h3 className={styles.domainTitle}>{s.title}</h3>
                            <p style={{ opacity: 0.8 }}>{s.content}</p>
                        </div>
                    ))}
                </div>

                {/* Values Section */}
                <h2 className={styles.sectionTitle}>{t('valuesTitle')}</h2>
                <div className={styles.valuesGrid}>
                    <div className={styles.valueCard}>
                        <Target size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                        <h3 className={styles.valueTitle}>{t('value1Title')}</h3>
                        <p style={{ opacity: 0.7 }}>{t('value1Desc')}</p>
                    </div>
                    <div className={styles.valueCard}>
                        <Heart size={40} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
                        <h3 className={styles.valueTitle}>{t('value2Title')}</h3>
                        <p style={{ opacity: 0.7 }}>{t('value2Desc')}</p>
                    </div>
                    <div className={styles.valueCard}>
                        <Zap size={40} color="var(--accent)" style={{ marginBottom: '1rem' }} />
                        <h3 className={styles.valueTitle}>{t('value3Title')}</h3>
                        <p style={{ opacity: 0.7 }}>{t('value3Desc')}</p>
                    </div>
                    {/* Dynamic Values */}
                    {sections.filter(s => s.type === 'value').map(s => (
                        <div key={s._id} className={styles.valueCard}>
                            <Target size={40} color="var(--primary)" style={{ marginBottom: '1rem' }} />
                            <h3 className={styles.valueTitle}>{s.title}</h3>
                            <p style={{ opacity: 0.7 }}>{s.content}</p>
                        </div>
                    ))}
                </div>

                {/* General Sections */}
                {sections.filter(s => s.type === 'general').map(s => (
                    <div key={s._id} style={{ marginTop: '4rem' }}>
                        <h2 className={styles.sectionTitle}>{s.title}</h2>

                        {/* Top Images */}
                        {s.images && s.images.length > 0 && s.imageLayout === 'top' && (
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(s.images.length, 3)}, 1fr)`, gap: '1rem', marginBottom: '1.5rem' }}>
                                {s.images.map((img, i) => (
                                    <div key={i} style={{ aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden', borderRadius: '8px' }} onClick={() => setLightboxImage(img)}>
                                        <img src={img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '2rem', flexDirection: s.imageLayout === 'left' ? 'row-reverse' : (s.imageLayout === 'right' ? 'row' : 'column') }}>
                            <div className={styles.textBlock} style={{ flex: 1 }}>
                                <p style={{ whiteSpace: 'pre-line' }}>{s.content}</p>
                                {s.buttonLink && (
                                    <a href={s.buttonLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
                                        {s.buttonText || t('learnMore')}
                                    </a>
                                )}
                            </div>

                            {/* Side Images (Left/Right) */}
                            {s.images && s.images.length > 0 && (s.imageLayout === 'left' || s.imageLayout === 'right') && (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {s.images.map((img, i) => (
                                        <div key={i} style={{ aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden', borderRadius: '8px' }} onClick={() => setLightboxImage(img)}>
                                            <img src={img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Bottom Images or Grid */}
                        {s.images && s.images.length > 0 && (s.imageLayout === 'bottom' || s.imageLayout === 'grid') && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: s.imageLayout === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : `repeat(${Math.min(s.images.length, 3)}, 1fr)`,
                                gap: '1rem',
                                marginTop: '1.5rem'
                            }}>
                                {s.images.map((img, i) => (
                                    <div key={i} style={{ aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden', borderRadius: '8px' }} onClick={() => setLightboxImage(img)}>
                                        <img src={img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}

                {/* Clubs Map Section */}
                {clubs.length > 0 && (
                    <>
                        <h2 className={styles.sectionTitle} style={{ marginTop: '6rem' }}>{t('ourLocations')}</h2>
                        <div className="grid-auto" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', height: 'auto', marginBottom: '4rem' }}>
                            <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--card-border)', height: '500px' }}>
                                <ClubMap clubs={clubs} center={mapCenter} zoom={mapZoom} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '10px', maxHeight: '500px' }}>
                                {clubs.map(club => (
                                    <button
                                        key={club._id}
                                        onClick={() => {
                                            if (club.coordinates) {
                                                setMapCenter([club.coordinates.lat, club.coordinates.lng]);
                                                setMapZoom(15);
                                            }
                                        }}
                                        className="card"
                                        style={{
                                            textAlign: 'left', padding: '1rem', cursor: 'pointer',
                                            border: '1px solid var(--card-border)', background: 'rgba(255,255,255,0.05)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    >
                                        <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <MapPin size={16} color="var(--primary)" /> {club.name}
                                        </h4>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{club.address || t('noAddress')}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Board Members Section */}
                {boardMembers.length > 0 && (
                    <>
                        <h2 className={styles.sectionTitle} style={{ marginTop: '6rem' }}>{t('boardTitle')}</h2>
                        <div className={styles.boardGrid}>
                            {boardMembers.map((member) => (
                                <div key={member._id} className={styles.boardCard}>
                                    <div className={styles.boardPhotoContainer}>
                                        {member.photo ? (
                                            <img src={member.photo} alt={member.name} className={styles.boardPhoto} />
                                        ) : (
                                            <User size={60} style={{ opacity: 0.1 }} />
                                        )}
                                    </div>
                                    <h3 className={styles.memberName}>{member.name}</h3>
                                    <p className={styles.memberRole}>{member.role}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <Lightbox
                    images={[lightboxImage]}
                    currentIndex={0}
                    onClose={() => setLightboxImage(null)}
                />
            )}
        </div>
    );
}

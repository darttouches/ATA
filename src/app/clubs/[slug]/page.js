'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import ClubTestimonials from './ClubTestimonials';
import styles from './ClubDetail.module.css';
import { ArrowLeft, MapPin, User as UserIcon, Facebook, Instagram, Youtube, Globe, Calendar, Clock, Cake, PartyPopper, Gift, Award } from 'lucide-react';
import { notFound } from 'next/navigation';
import ClientClubContent from './ClientClubContent';
import ClubPolls from './ClubPolls';

export default function ClubDetailPage({ params }) {
    const { slug } = use(params);
    const { t, language, formatDynamicText } = useLanguage();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/clubs/${slug}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    setData(null);
                } else {
                    setData(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [slug]);

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;
    if (!data) return notFound();

    const { club, events, gallery, videos, testimonials, birthdayMembers, automaticallyActiveMembers } = data;

    // Combine manual and automatic active members, avoiding duplicates
    const manualIds = new Set(club.activeMembers?.map(m => m.name));
    const combinedActive = [
        ...(club.activeMembers || []).map(m => ({ ...m, type: 'manual' })),
        ...automaticallyActiveMembers
            .filter(am => !manualIds.has(am.firstName + ' ' + am.lastName))
            .map(am => ({
                name: `${am.firstName} ${am.lastName}`,
                photo: am.profileImage,
                role: am.role,
                points: am.totalPoints,
                type: 'auto'
            }))
    ];

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <Link href="/clubs" className={styles.backLink}>
                <ArrowLeft size={16} style={{ marginRight: '8px' }} /> {t('backToClubs')}
            </Link>

            {/* Hero Header */}
            <div className={styles.hero} style={{ backgroundImage: `linear-gradient(rgba(17, 34, 78, 0.4), rgba(17, 34, 78, 0.8)), url(${club.coverImage})` }}>
                <div className={styles.heroOverlay}>
                    <h1 className={styles.clubName}>{formatDynamicText(club.name)}</h1>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                            <MapPin size={18} style={{ marginRight: '6px' }} /> {club.address || 'Local de l\'association'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', opacity: 0.9 }}>
                            <UserIcon size={18} style={{ marginRight: '6px' }} /> {t('president')} : {club.chief?.name || 'Non assigné'}
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={styles.content}>
                    {/* Birthday Section */}
                    {birthdayMembers?.length > 0 && (
                        <section style={{
                            marginBottom: '2rem',
                            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                            borderRadius: '16px',
                            padding: '2rem',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 10px 30px rgba(255, 107, 107, 0.3)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.2, transform: 'rotate(20deg)' }}>
                                <Cake size={120} />
                            </div>
                            <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', opacity: 0.2, transform: 'rotate(-20deg)' }}>
                                <Gift size={100} />
                            </div>

                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    padding: '1rem',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <PartyPopper size={40} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                        {t('birthdayTitle')}
                                    </h2>
                                    <p style={{ opacity: 0.9, fontSize: '1.1rem', fontWeight: 500 }}>
                                        {birthdayMembers.length > 1 ? t('birthdaySubtitlePlural') : t('birthdaySubtitle')}
                                    </p>

                                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                                        {birthdayMembers.map((member, i) => (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                background: 'rgba(255,255,255,0.15)',
                                                padding: '0.8rem 1.2rem',
                                                borderRadius: '50px',
                                                backdropFilter: 'blur(5px)',
                                                border: '1px solid rgba(255,255,255,0.3)',
                                                animation: 'pulse 2s infinite ease-in-out'
                                            }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', background: 'white' }}>
                                                    {member.profileImage ? (
                                                        <img src={member.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B6B' }}>
                                                            {member.name?.charAt(0) || member.firstName?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{member.firstName} {member.lastName}</div>
                                                    {member.role && (
                                                        <div style={{ fontSize: '0.8rem', opacity: 0.8, fontWeight: 500 }}>{member.role === 'president' ? t('president') : member.role}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <style dangerouslySetInnerHTML={{
                                __html: `
                                @keyframes pulse {
                                    0% { transform: scale(1); }
                                    50% { transform: scale(1.05); }
                                    100% { transform: scale(1); }
                                }
                            `}} />
                        </section>
                    )}

                    <section className={styles.section}>
                        <h2 className={styles.sectionHeader}>{t('aboutClub')}</h2>
                        <p className={styles.description}>{club.description}</p>
                    </section>

                    <ClientClubContent
                        events={events}
                        gallery={gallery}
                        videos={videos}
                    />

                    <ClubPolls clubId={club._id} />
                    <ClubTestimonials clubId={club._id} initialTestimonials={testimonials} />
                </div>

                <aside className={styles.sidebar}>
                    <div style={{ position: 'sticky', top: '100px' }}>
                        <div className={styles.sidebarCard}>
                            <h3 style={{ marginBottom: '1.2rem' }}>{t('followUs')}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {club.socialLinks?.facebook && (
                                    <a href={club.socialLinks.facebook} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                        <Facebook size={18} style={{ marginRight: '10px' }} /> Facebook
                                    </a>
                                )}
                                {club.socialLinks?.instagram && (
                                    <a href={club.socialLinks.instagram} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                        <Instagram size={18} style={{ marginRight: '10px' }} /> Instagram
                                    </a>
                                )}
                                {club.socialLinks?.youtube && (
                                    <a href={club.socialLinks.youtube} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                        <Youtube size={18} style={{ marginRight: '10px' }} /> YouTube
                                    </a>
                                )}
                                {club.socialLinks?.website && (
                                    <a href={club.socialLinks.website} className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>
                                        <Globe size={18} style={{ marginRight: '10px' }} /> Site Web
                                    </a>
                                )}
                            </div>
                        </div>

                        {combinedActive.length > 0 && (
                            <div className="card" style={{ border: '1px solid rgba(56, 189, 248, 0.2)', background: 'rgba(17, 34, 78, 0.4)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.2rem' }}>
                                    <h3 style={{ fontSize: '1.1rem' }}>{t('activeMembers')}</h3>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{t('realTime')}</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {combinedActive.map((member, i) => (
                                        <div key={i} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            background: member.type === 'auto' ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                                            border: member.type === 'auto' ? '1px solid rgba(56, 189, 248, 0.1)' : '1px solid transparent'
                                        }}>
                                            <div style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '50%',
                                                background: 'rgba(255,255,255,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                border: member.type === 'auto' ? '2px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                {member.photo ? (
                                                    <img src={member.photo} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <UserIcon size={20} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    {member.name}
                                                    {member.type === 'auto' && <Award size={12} className="text-primary" />}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>{member.role === 'president' ? t('president') : (member.role || 'Membre')}</div>
                                            </div>
                                            {member.points !== undefined && (
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    color: 'var(--primary)',
                                                    background: 'rgba(56, 189, 248, 0.1)',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    {member.points}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}

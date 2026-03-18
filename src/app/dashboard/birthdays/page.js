
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Cake, PartyPopper, Sparkles, Heart, MapPin } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Birthdays.module.css';

export default function BirthdaysPage() {
    const { t, language, formatDynamicText } = useLanguage();
    const [birthdayMembers, setBirthdayMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBirthdays = async () => {
            try {
                // We'll fetch all users and filter today's birthdays on the client side
                // Or create a specific API route to fetch today's birthdays
                const res = await fetch('/api/users');
                const data = await res.json();
                
                if (data.success && Array.isArray(data.data)) {
                    const today = new Date();
                    const m = today.getMonth() + 1;
                    const d = today.getDate();
                    
                    const birthdays = data.data.filter(user => {
                        if (!user.birthDate) return false;
                        const birth = new Date(user.birthDate);
                        return (birth.getMonth() + 1) === m && birth.getDate() === d;
                    });
                    
                    // Fetch club names for them
                    const updatedBirthdays = await Promise.all(birthdays.map(async (u) => {
                        const clubId = u.club || u.preferredClub;
                        if (clubId) {
                            try {
                                const clubRes = await fetch(`/api/clubs/${clubId}`);
                                const clubData = await clubRes.json();
                                return { ...u, clubName: clubData.club?.name || 'Club ATA' };
                            } catch (e) {
                                return { ...u, clubName: 'Club ATA' };
                            }
                        }
                        return { ...u, clubName: 'Club ATA' };
                    }));
                    
                    setBirthdayMembers(updatedBirthdays);
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchBirthdays();
    }, []);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;

    if (birthdayMembers.length === 0) {
        return (
            <div className="container" style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                <Cake size={64} style={{ margin: '0 auto 2rem', opacity: 0.2 }} />
                <h2>{t('noBirthdayToday')}</h2>
                <p>{t('comeBackTomorrow')}</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.sparkles}>
                    <Sparkles size={32} />
                </div>
                <h1 className={styles.title}>🎉 {t('birthdayTitle')} 🎉</h1>
                <p className={styles.subtitle}>{t('birthdaySubtitleDesc')}</p>
            </header>

            <div className={styles.cardsGrid}>
                {birthdayMembers.map((member, i) => (
                    <div key={member._id} className={styles.birthdayCard} style={{ animationDelay: `${i * 0.2}s` }}>
                        <div className={styles.cardHeader}>
                            <div className={styles.confetti}>
                                <PartyPopper size={24} />
                            </div>
                            <div className={styles.imageWrapper}>
                                {member.profileImage ? (
                                    <Image src={member.profileImage} alt={member.firstName} fill style={{ objectFit: 'cover' }} />
                                ) : (
                                    <div className={styles.imageFallback}>
                                        {(member.firstName || member.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className={styles.cardTitle}>
                                <h2>{member.firstName} {member.lastName}</h2>
                                <span className={styles.roleTag}>{member.role === 'president' ? t('president') : (member.role === 'national' ? t('nationalBoardMember') : t('member'))}</span>
                            </div>
                        </div>

                        <div className={styles.cardBody}>
                            <div className={styles.infoRow}>
                                <Cake size={18} className={styles.icon} />
                                <span>{t('itsTheirDay')}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <MapPin size={18} className={styles.icon} />
                                <span>{formatDynamicText(member.clubName)}</span>
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <div className={styles.message}>
                                <Heart size={16} fill="var(--danger)" /> {t('birthdaySubtitle')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); }
                    50% { transform: translateY(-10px) rotate(5deg); }
                    100% { transform: translateY(0px) rotate(0deg); }
                }
                @keyframes cardIn {
                    from { transform: scale(0.8) translateY(20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

'use client';
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Calendar, X, Award, ShieldCheck, MapPin, Bell, Clock, User } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function DashboardHome() {
    const { t, language, formatDynamicText } = useLanguage();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedMember, setSelectedMember] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                if (data.success) {
                    setStats(data.data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="container" style={{ padding: '2rem' }}>{t('loading')}</div>;

    const maxActions = stats ? Math.max(...stats.activityStats.map(s => s.actions), 1) : 1;

    const getTypeLabel = (type) => {
        switch (type) {
            case 'event': return t('event');
            case 'formation': return t('formation');
            case 'photo': return t('photoGalleryLabel');
            case 'video': return t('videoYoutube');
            case 'news': return t('announcement');
            default: return type;
        }
    };

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 700 }}>
                {t('dashboardTitle')}
            </h1>
            <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
                {t('dashboardOverview')}
            </p>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderRadius: '12px' }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{t('totalActions')}</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats?.totalActions || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Actualités / Prochaines Activités Section */}
            {stats?.upcomingNews && stats.upcomingNews.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <Bell size={20} className="text-primary" /> {t('clubNews')} <span style={{ fontSize: '0.9rem', opacity: 0.6, fontWeight: 400 }}>{t('next10Days')}</span>
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
                        {stats.upcomingNews.map(news => (
                            <div key={news._id} className="card" style={{ borderLeft: '4px solid var(--primary)', background: 'rgba(56, 189, 248, 0.03)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                                        {formatDynamicText(news.club?.name)}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--primary)', borderRadius: '4px', textTransform: 'capitalize' }}>
                                        {getTypeLabel(news.type)}
                                    </div>
                                </div>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.8rem' }}>{news.title}</h4>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={14} /> {new Date(news.date).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'short' })}
                                    </span>
                                    {news.time && (
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Clock size={14} /> {news.time}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

                {/* Membership Activity Curve */}
                <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--card-border)', position: 'relative' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <TrendingUp size={20} className="text-primary" /> {t('engagementPerformance')}
                    </h3>

                    <div style={{ position: 'relative', height: '300px', display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
                        {stats?.topMembers && stats.topMembers.length > 0 ? (
                            <>
                                <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, top: 0, zIndex: 1 }}>
                                    <defs>
                                        <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                                            <stop offset="50%" stopColor="var(--primary)" stopOpacity="0.5" />
                                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.2" />
                                        </linearGradient>
                                    </defs>
                                    <path
                                        d={`M 0 150 ${stats.topMembers.map((m, i) => {
                                            const x = (i + 1) * (1000 / (stats.topMembers.length + 1));
                                            const y = 150 - (Math.sin(i * 1.5) * 60);
                                            return `Q ${x - 50} ${y}, ${x} ${y}`;
                                        }).join(' ')} T 1000 150`}
                                        fill="none"
                                        stroke="url(#curveGradient)"
                                        strokeWidth="3"
                                        strokeDasharray="10,5"
                                    />
                                </svg>

                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    width: '100%',
                                    position: 'relative',
                                    zIndex: 2,
                                    alignItems: 'center'
                                }}>
                                    {stats.topMembers.map((member, i) => {
                                        const yOffset = Math.sin(i * 1.5) * 60;
                                        return (
                                            <div
                                                key={member._id}
                                                onClick={() => setSelectedMember(member)}
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    cursor: 'pointer',
                                                    transform: `translateY(${-yOffset}px)`,
                                                    transition: 'transform 0.3s ease',
                                                    position: 'relative'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = `translateY(${-yOffset}px) scale(1.1)`}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = `translateY(${-yOffset}px) scale(1)`}
                                            >
                                                <div style={{
                                                    width: '60px', height: '60px', borderRadius: '50%',
                                                    border: '3px solid var(--primary)',
                                                    background: 'var(--card-bg)',
                                                    overflow: 'hidden', padding: '3px',
                                                    boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
                                                }}>
                                                    {member.profileImage ? (
                                                        <img src={member.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                                                            {(member.firstName || member.name).charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '-35px',
                                                    background: 'rgba(56, 189, 248, 0.1)',
                                                    padding: '2px 8px',
                                                    borderRadius: '10px',
                                                    border: '1px solid rgba(56, 189, 248, 0.2)',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{member.count} {t('points')}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <p style={{ width: '100%', textAlign: 'center', opacity: 0.5 }}>{t('noActivityData')}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Member Card Modal */}
            {selectedMember && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '1rem'
                }} onClick={() => setSelectedMember(null)}>
                    <div
                        style={{
                            background: 'var(--card-bg)',
                            width: '400px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                            position: 'relative'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Gradient */}
                        <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)', position: 'relative' }}>
                            <button
                                onClick={() => setSelectedMember(null)}
                                style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', color: 'white', padding: '5px', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Profile Image Float */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '-60px', position: 'relative' }}>
                            <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '5px solid var(--card-bg)', background: '#222', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
                                {selectedMember.profileImage ? (
                                    <img src={selectedMember.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800 }}>
                                        {selectedMember.firstName?.charAt(0) || selectedMember.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div style={{ position: 'absolute', bottom: '5px', right: 'calc(50% - 55px)', background: '#22c55e', color: 'white', padding: '5px', borderRadius: '50%', border: '3px solid var(--card-bg)' }}>
                                <Award size={16} />
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                                {selectedMember.firstName} {selectedMember.lastName || selectedMember.name}
                            </h2>
                            <p style={{
                                color: selectedMember.role === 'admin' ? '#ef4444' : (selectedMember.role === 'president' ? 'var(--primary)' : (selectedMember.role === 'national' ? 'var(--primary)' : '#94a3b8')),
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                marginBottom: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.4rem',
                                textTransform: 'capitalize'
                            }}>
                                {selectedMember.role === 'admin' ? <ShieldCheck size={16} /> : (selectedMember.role === 'president' ? <Award size={16} /> : (selectedMember.role === 'national' ? <ShieldCheck size={16} /> : <User size={16} />))}
                                {selectedMember.role === 'president' ? t('president') : (selectedMember.role === 'national' ? t('nationalBoardMember') : (selectedMember.role === 'admin' ? 'Admin' : t('member')))}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.3rem' }}>{t('clubLabel')}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        <MapPin size={12} className="text-primary" /> {formatDynamicText(selectedMember.clubName) || t('national')}
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', opacity: 0.7, marginBottom: '0.3rem' }}>{t('actions')}</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>{selectedMember.count}</div>
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedMember(null)}
                                style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                            >
                                {t('closeProfile')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

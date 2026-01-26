"use client";

import { useState, useEffect } from 'react';
import { MessageSquare, User, UserX, Calendar, Filter, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function VoiceManagementPage() {
    const { t } = useLanguage();
    const [voices, setVoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterClub, setFilterClub] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchVoices();
    }, []);

    const fetchVoices = async () => {
        try {
            const res = await fetch('/api/member-voice');
            const data = await res.json();
            if (res.ok) setVoices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/member-voice/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setVoices(voices.map(v => v._id === id ? { ...v, status: newStatus } : v));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const filteredVoices = voices.filter(v => {
        const voiceClubName = v.club?.name || v.user?.club?.name || v.user?.preferredClub?.name;
        const clubMatch = filterClub === 'all' || voiceClubName === filterClub;
        const statusMatch = filterStatus === 'all' || v.status === filterStatus;
        return clubMatch && statusMatch;
    });

    const clubs = Array.from(new Set(voices.map(v =>
        v.club?.name || v.user?.club?.name || v.user?.preferredClub?.name
    ).filter(Boolean)));

    if (loading) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>{t('loading')}</div>;

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('memberVoiceTitle')}</h1>
                    <p style={{ opacity: 0.6 }}>{t('memberVoiceSubtitle')}</p>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Filter size={16} style={{ opacity: 0.5 }} />
                        <select
                            value={filterClub}
                            onChange={(e) => setFilterClub(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all" style={{ background: '#1e293b', color: 'white' }}>{t('allClubs') || 'Tous les clubs'}</option>
                            {clubs.map(c => <option key={c} value={c} style={{ background: '#1e293b', color: 'white' }}>{c}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '5px 15px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'white', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                        >
                            <option value="all" style={{ background: '#1e293b', color: 'white' }}>{t('allStatus') || 'Tous les statuts'}</option>
                            <option value="nouveau" style={{ background: '#1e293b', color: 'white' }}>{t('newBadge')}</option>
                            <option value="en_cours" style={{ background: '#1e293b', color: 'white' }}>{t('pending')}</option>
                            <option value="traite" style={{ background: '#1e293b', color: 'white' }}>{t('approved')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {filteredVoices.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                        <MessageSquare size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                        <p>{t('noUserFound')}</p>
                    </div>
                ) : (
                    filteredVoices.map(voice => (
                        <div key={voice._id} className="card" style={{
                            padding: '2rem',
                            borderLeft: `4px solid ${voice.status === 'traite' ? '#22c55e' :
                                voice.status === 'en_cours' ? '#f59e0b' : '#3b82f6'
                                }`
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: voice.isAnonymous ? 'rgba(255,255,255,0.05)' : 'rgba(124, 58, 237, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: voice.isAnonymous ? 'rgba(255,255,255,0.3)' : 'var(--primary)'
                                    }}>
                                        {voice.isAnonymous ? <UserX size={24} /> : <User size={24} />}
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                                                {voice.isAnonymous ? t('anonymous') : (voice.name || t('identifiedMode'))}
                                            </h3>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 8px',
                                                borderRadius: '20px',
                                                background: voice.isAnonymous ? 'rgba(255,255,255,0.05)' : 'rgba(124, 58, 237, 0.1)',
                                                color: voice.isAnonymous ? 'rgba(255,255,255,0.4)' : 'var(--primary)',
                                                fontWeight: 600
                                            }}>
                                                {voice.isAnonymous ? t('anonymousMode').toUpperCase() : t('identifiedMode').toUpperCase()}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', opacity: 0.5, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Calendar size={14} /> {new Date(voice.createdAt).toLocaleDateString()}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <MessageSquare size={14} />
                                                {voice.club?.name || (voice.user?.club?.name) || (voice.user?.preferredClub?.name) || 'Sans Club'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        value={voice.status}
                                        onChange={(e) => updateStatus(voice._id, e.target.value)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            background: '#1e293b',
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="nouveau" style={{ background: '#1e293b', color: 'white' }}>{t('newBadge')}</option>
                                        <option value="en_cours" style={{ background: '#1e293b', color: 'white' }}>{t('pending')}</option>
                                        <option value="traite" style={{ background: '#1e293b', color: 'white' }}>{t('approved')}</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{
                                background: 'rgba(255,255,255,0.02)',
                                padding: '1.5rem',
                                borderRadius: '12px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                lineHeight: '1.6',
                                marginBottom: '1.5rem'
                            }}>
                                {voice.message}
                            </div>

                            {!voice.isAnonymous && (voice.email || voice.phone) && (
                                <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', opacity: 0.7 }}>
                                    {voice.email && <span><strong>Email:</strong> {voice.email}</span>}
                                    {voice.phone && <span><strong>Tel:</strong> {voice.phone}</span>}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

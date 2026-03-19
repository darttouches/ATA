"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Save, X, Calendar, Clock, Video, Users, Check, Trash2, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

export default function CreateMeeting() {
    const { t, language } = useLanguage();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clubs, setClubs] = useState([]);
    const [users, setUsers] = useState([]);
    const [errorUsers, setErrorUsers] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'direct',
        scheduledAt: new Date().toISOString().slice(0, 16),
        lateLimitMinutes: 15,
        selectedClubs: [],
        selectedMembers: []
    });

    const fetchData = useCallback(async () => {
        try {
            const [clubsRes, usersRes] = await Promise.all([
                fetch('/api/clubs'),
                fetch('/api/members')
            ]);
            
            if (clubsRes.ok) setClubs(await clubsRes.json());
            if (usersRes.ok) {
                setUsers(await usersRes.json());
                setErrorUsers(false);
            } else {
                setErrorUsers(true);
            }
        } catch (err) {
            console.error(err);
            setErrorUsers(true);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    scheduledAt: formData.type === 'direct' ? new Date() : new Date(formData.scheduledAt),
                    clubs: formData.selectedClubs,
                    participants: formData.selectedMembers
                })
            });

            if (res.ok) {
                alert(t('meetingConfirmed'));
                router.push('/dashboard/meetings');
            } else {
                const data = await res.json();
                alert(data.error || t('error'));
            }
        } catch (err) {
            console.error(err);
            alert(t('technicalError'));
        } finally {
            setLoading(false);
        }
    };

    const toggleClubSelection = (clubId) => {
        const isSelected = formData.selectedClubs.includes(clubId);
        if (isSelected) {
            setFormData(prev => ({ ...prev, selectedClubs: prev.selectedClubs.filter(id => id !== clubId) }));
        } else {
            setFormData(prev => ({ ...prev, selectedClubs: [...prev.selectedClubs, clubId] }));
        }
    };

    const toggleMemberSelection = (userId) => {
        const isSelected = formData.selectedMembers.includes(userId);
        if (isSelected) {
            setFormData(prev => ({ ...prev, selectedMembers: prev.selectedMembers.filter(id => id !== userId) }));
        } else {
            setFormData(prev => ({ ...prev, selectedMembers: [...prev.selectedMembers, userId] }));
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
                <Link href="/dashboard/meetings" className="btn btn-secondary" style={{ padding: '8px' }}>
                    <ArrowLeft size={18} />
                </Link>
                <h1>{t('createMeeting')}</h1>
            </div>

            <form onSubmit={handleSubmit} className="card" style={{ padding: '2.5rem' }}>
                <div style={{ display: 'grid', gap: '2rem' }}>
                    
                    {/* Basic Info */}
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('actionTitle') || 'Titre de la réunion'}</label>
                            <input 
                                required
                                type="text" 
                                className="card" 
                                style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--card-border)' }}
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="ex: Réunion de Club Théâtre"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('description')}</label>
                            <textarea 
                                className="card" 
                                style={{ width: '100%', padding: '0.8rem', minHeight: '80px', border: '1px solid var(--card-border)' }}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Type & Schedule */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Type</label>
                            <select 
                                className="card" 
                                style={{ width: '100%', padding: '0.8rem', background: '#11224E', color: 'white', border: 'none' }}
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="direct">{t('directMeeting')}</option>
                                <option value="scheduled">{t('scheduledMeeting')}</option>
                            </select>
                        </div>

                        {formData.type === 'scheduled' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('meetingDateTime')}</label>
                                <input 
                                    required
                                    type="datetime-local" 
                                    className="card" 
                                    style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--card-border)' }}
                                    value={formData.scheduledAt}
                                    onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                                />
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>{t('lateLimitMinutes')}</label>
                            <input 
                                type="number" 
                                className="card" 
                                style={{ width: '100%', padding: '0.8rem', border: '1px solid var(--card-border)' }}
                                value={formData.lateLimitMinutes}
                                onChange={e => {
                                    const val = e.target.value;
                                    setFormData({ ...formData, lateLimitMinutes: val === '' ? '' : parseInt(val) });
                                }}
                                min="1" max="1440"
                            />
                        </div>
                    </div>

                    {/* Participants Section */}
                    <div>
                        <h3 style={{ borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>{t('participants')}</h3>
                        
                        {/* Club Selection */}
                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>{t('selectClubs')}</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {clubs.map(club => (
                                    <button 
                                        type="button"
                                        key={club._id}
                                        onClick={() => toggleClubSelection(club._id)}
                                        style={formData.selectedClubs.includes(club._id) ? stylesCreate.clubSelected : stylesCreate.clubChip}
                                    >
                                        {formData.selectedClubs.includes(club._id) && <Check size={14} />} {club.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Member Selection */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '1rem', fontWeight: 600 }}>{t('selectMembers')}</label>
                            <div style={{ 
                                maxHeight: '300px', 
                                overflowY: 'auto', 
                                border: '1px solid var(--card-border)', 
                                borderRadius: '12px', 
                                padding: '10px', 
                                background: 'rgba(0,0,0,0.1)' 
                            }}>
                                {users.length > 0 ? users.map(user => (
                                    <label key={user._id} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '12px', 
                                        padding: '12px', 
                                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                        borderRadius: '8px',
                                        background: formData.selectedMembers.includes(user._id) ? 'rgba(124, 58, 237, 0.1)' : 'transparent'
                                    }}>
                                        <input 
                                            type="checkbox" 
                                            checked={formData.selectedMembers.includes(user._id)}
                                            onChange={() => toggleMemberSelection(user._id)}
                                            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600 }}>{user.firstName ? `${user.firstName} ${user.lastName}` : user.name}</div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5 }}>{user.email} • {user.role}</div>
                                        </div>
                                        {user.clubName && <span style={{ fontSize: '0.7rem', opacity: 0.6, background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>{user.clubName}</span>}
                                    </label>
                                )) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.5 }}>
                                        {errorUsers ? "Erreur de chargement des membres." : "Chargement des membres..."}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>

                <div style={{ marginTop: '3rem', borderTop: '1px solid var(--card-border)', paddingTop: '2rem' }}>
                    <button 
                        type="submit" 
                        disabled={loading || !formData.title} 
                        className="btn btn-primary" 
                        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                    >
                        {loading ? t('creating') : <><Video size={20} /> {t('createMeeting')}</>}
                    </button>
                </div>
            </form>

            <style jsx>{`
                .member-selected {
                    background: rgba(124, 58, 237, 0.1);
                }
            `}</style>
        </div>
    );
}

const stylesCreate = {
    clubChip: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--card-border)',
        borderRadius: '20px',
        padding: '6px 16px',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'white'
    },
    clubSelected: {
        background: 'var(--primary)',
        border: '1px solid var(--primary)',
        borderRadius: '20px',
        padding: '6px 16px',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: 'white'
    }
};

'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Award, Shield, User, Loader2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function MembersPointsPage() {
    const { t } = useLanguage();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await fetch('/api/dashboard/members');
            const data = await res.json();
            if (data.success) {
                setMembers(data.data);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePoints = async (userId, amount) => {
        setUpdatingId(userId);
        try {
            const res = await fetch(`/api/dashboard/members/${userId}/points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();
            if (data.success) {
                setMembers(members.map(m => m._id === userId ? { ...m, bonusPoints: data.newPoints } : m));
            } else {
                alert(data.error || t('updateError'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert(t('technicalError'));
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredMembers = members.filter(m =>
        (m.firstName + ' ' + m.lastName).toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <Loader2 className="animate-spin" size={40} />
        </div>
    );

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t('pointsManagementTitle')}</h1>
                <p style={{ opacity: 0.7 }}>{t('pointsManagementDesc')}</p>
            </div>

            <div style={{
                background: 'var(--card-bg)',
                padding: '1.5rem',
                borderRadius: '16px',
                border: '1px solid var(--card-border)',
                marginBottom: '2rem'
            }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
                    <input
                        type="text"
                        placeholder={t('searchMemberPlaceholder')}
                        style={{
                            width: '100%',
                            padding: '0.8rem 1rem 0.8rem 2.5rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--card-border)',
                            color: 'white',
                            borderRadius: '12px'
                        }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {filteredMembers.map(member => (
                    <div key={member._id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', overflow: 'hidden' }}>
                                {member.profileImage ? (
                                    <img src={member.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)' }}>
                                        {member.firstName?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {member.firstName} {member.lastName}
                                    <span style={{
                                        fontSize: '0.65rem',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: member.role === 'admin' ? '#ef444422' : (member.role === 'president' ? 'var(--primary-bg)' : (member.role === 'national' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(255,255,255,0.05)')),
                                        color: member.role === 'admin' ? '#ef4444' : (member.role === 'president' ? 'var(--primary)' : (member.role === 'national' ? 'var(--primary)' : '#94a3b8')),
                                        border: `1px solid ${member.role === 'admin' ? '#ef444444' : (member.role === 'president' ? 'var(--primary-border)' : (member.role === 'national' ? 'var(--primary-border)' : 'rgba(255,255,255,0.1)'))}`,
                                        textTransform: 'capitalize'
                                    }}>
                                        {member.role === 'president' ? t('president') : (member.role === 'national' ? t('nationalBoardMember') : (member.role === 'admin' ? 'Admin' : t('member')))}
                                    </span>
                                </h3>
                                <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>{member.email}</p>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1rem',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', opacity: 0.5, display: 'block' }}>{t('bonusPoints')}</span>
                                <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>
                                    {member.bonusPoints || 0}
                                </span>
                            </div>
                            <Award size={24} className="text-primary" style={{ opacity: 0.5 }} />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={() => handleUpdatePoints(member._id, 1)}
                                disabled={updatingId === member._id}
                                className="btn btn-secondary"
                                style={{ flex: 1, gap: '4px', fontSize: '0.85rem' }}
                            >
                                <Plus size={14} /> 1
                            </button>
                            <button
                                onClick={() => handleUpdatePoints(member._id, 2)}
                                disabled={updatingId === member._id}
                                className="btn btn-secondary"
                                style={{ flex: 1, gap: '4px', fontSize: '0.85rem' }}
                            >
                                <Plus size={14} /> 2
                            </button>
                            <button
                                onClick={() => handleUpdatePoints(member._id, -1)}
                                disabled={updatingId === member._id}
                                className="btn btn-secondary"
                                style={{ flex: 1, gap: '4px', fontSize: '0.85rem', color: '#f43f5e' }}
                            >
                                <Minus size={14} /> 1
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredMembers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>
                    <User size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
                    <p>{t('noMemberFound')}</p>
                </div>
            )}
        </div>
    );
}

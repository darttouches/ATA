"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, X, Trash2, Calendar, Clock, Loader2, Bell } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ActionsModeration() {
    const { t, language } = useLanguage();
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/actions');
            if (res.ok) {
                const data = await res.json();
                setActions(data);
            }
        } catch (error) {
            console.error('Fetch actions error:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        const res = await fetch('/api/admin/actions', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status }),
        });
        if (res.ok) {
            fetchActions();
        }
    };

    const deleteAction = async (id) => {
        if (confirm(t('confirmDeleteAction'))) {
            await fetch(`/api/admin/actions?id=${id}`, { method: 'DELETE' });
            fetchActions();
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><Loader2 className="animate-spin" /> {t('loading')}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Bell size={24} className="text-primary" /> {t('actionsModerationTitle')}
                    </h1>
                    <p style={{ opacity: 0.6 }}>{t('validatePollsDesc')}</p>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                            <th style={{ padding: '1.2rem' }}>{t('actionTitle')}</th>
                            <th style={{ padding: '1.2rem' }}>{t('clubLabel')}</th>
                            <th style={{ padding: '1.2rem' }}>{t('date')} & {t('time')}</th>
                            <th style={{ padding: '1.2rem' }}>{t('status')}</th>
                            <th style={{ padding: '1.2rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {actions.map(action => (
                            <tr key={action._id} style={{ borderBottom: '1px solid var(--card-border)', transition: 'background 0.2s' }}>
                                <td style={{ padding: '1.2rem' }}>
                                    <Link href={`/dashboard/my-club/actions/${action._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }} className="hover:text-primary transition-colors">{action.title}</div>
                                    </Link>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6, marginTop: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {action.description}
                                    </div>
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        background: 'rgba(56, 189, 248, 0.1)',
                                        color: 'var(--primary)',
                                        borderRadius: '20px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600
                                    }}>
                                        {action.club?.name}
                                    </span>
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                                        <Calendar size={14} className="text-primary" />
                                        {new Date(action.startDate).toLocaleDateString(language === 'ar' ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'long' })}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', opacity: 0.6, marginTop: '4px' }}>
                                        <Clock size={14} /> {action.localTime}
                                    </div>
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <span style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.5px',
                                        background: action.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : action.status === 'rejected' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 149, 11, 0.1)',
                                        color: action.status === 'approved' ? '#10b981' : action.status === 'rejected' ? '#f43f5e' : '#f59e0b',
                                        border: `1px solid ${action.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : action.status === 'rejected' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 149, 11, 0.2)'}`
                                    }}>
                                        {action.status === 'pending' ? t('pending') : action.status === 'approved' ? t('approved') : t('rejected')}
                                    </span>
                                </td>
                                <td style={{ padding: '1.2rem' }}>
                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        {action.status !== 'approved' && (
                                            <button
                                                onClick={() => updateStatus(action._id, 'approved')}
                                                title={t('approveAction')}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                                    color: '#10b981',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Check size={18} />
                                            </button>
                                        )}
                                        {action.status !== 'rejected' && (
                                            <button
                                                onClick={() => updateStatus(action._id, 'rejected')}
                                                title={t('reject')}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    background: 'rgba(244, 63, 94, 0.1)',
                                                    border: '1px solid rgba(244, 63, 94, 0.2)',
                                                    color: '#f43f5e',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <X size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteAction(action._id)}
                                            title={t('delete')}
                                            style={{
                                                padding: '8px',
                                                borderRadius: '8px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                color: '#f43f5e',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {actions.length === 0 && (
                            <tr>
                                <td colSpan="5" style={{ padding: '3rem', textAlign: 'center', opacity: 0.5 }}>
                                    {t('noActionsToModerate')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

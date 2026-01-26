'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Calendar, Clock, CheckSquare } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function ActionsPage() {
    const { t } = useLanguage();
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        try {
            const res = await fetch('/api/actions');
            const data = await res.json();
            if (data.success) {
                setActions(data.data);
            }
        } catch (error) {
            console.error('Error fetching actions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('confirmDeleteAction'))) return;

        try {
            const res = await fetch(`/api/actions/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setActions(actions.filter(a => a._id !== id));
            }
        } catch (error) {
            console.error('Error deleting action:', error);
        }
    };

    if (loading) return <div className="container" style={{ padding: '2rem' }}>{t('loading')}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>{t('actionsAttendance')}</h1>
                <Link href="/dashboard/my-club/actions/add" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> {t('newAction')}
                </Link>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {actions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '16px',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            <Plus size={32} style={{ opacity: 0.5 }} />
                        </div>
                        <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>{t('noActionsFound')}</p>
                        <Link href="/dashboard/my-club/actions/add" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
                            {t('addFirstAction')}
                        </Link>
                    </div>
                ) : (
                    actions.map(action => (
                        <div key={action._id} style={{
                            background: 'var(--card-bg)',
                            padding: '1.5rem',
                            borderRadius: '12px',
                            border: '1px solid var(--card-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '0.5rem' }}>
                                    <Link href={`/dashboard/my-club/actions/${action._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, cursor: 'pointer' }} className="hover:text-primary transition-colors">{action.title}</h3>
                                    </Link>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        background: action.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : action.status === 'rejected' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(245, 149, 11, 0.1)',
                                        color: action.status === 'approved' ? '#10b981' : action.status === 'rejected' ? '#f43f5e' : '#f59e0b',
                                        border: `1px solid ${action.status === 'approved' ? 'rgba(16, 185, 129, 0.2)' : action.status === 'rejected' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 149, 11, 0.2)'}`
                                    }}>
                                        {action.status === 'pending' ? t('pending') : action.status === 'approved' ? t('approved') : t('rejected')}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Calendar size={14} />
                                        {new Date(action.startDate).toLocaleDateString()}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Clock size={14} /> {action.localTime}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.8 }}>{action.description}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Link href={`/dashboard/my-club/actions/${action._id}`} className="btn btn-secondary" title={t('manageAttendance')}>
                                    <CheckSquare size={18} />
                                </Link>
                                <button onClick={() => handleDelete(action._id)} className="btn btn-secondary" style={{ color: '#f43f5e' }} title={t('delete')}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
